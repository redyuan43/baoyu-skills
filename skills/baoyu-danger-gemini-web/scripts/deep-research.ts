import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import {
  CdpConnection,
  discoverRunningChromeDebugPort,
  findChromeExecutable as findChromeExecutableBase,
  findExistingChromeDebugPort,
  getDefaultChromeUserDataDirs,
  getFreePort,
  openPageSession,
  sleep,
  waitForChromeDebugPort,
  type PlatformCandidates,
} from 'baoyu-chrome-cdp';

import { resolveGeminiWebChromeProfileDir, resolveGeminiWebDataDir } from './gemini-webapi/utils/index.js';

const GEMINI_APP_URL = 'https://gemini.google.com/app';

const CHROME_CANDIDATES: PlatformCandidates = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  default: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/microsoft-edge',
  ],
};

type Args = {
  prompt: string | null;
  profileDir: string | null;
  profileEmail: string | null;
  sessionId: string | null;
  newSession: boolean;
  listSessions: boolean;
  listProfiles: boolean;
  waitMs: number;
  noSubmit: boolean;
  json: boolean;
  help: boolean;
};

type ChromeProfile = {
  profileKey: string;
  profileDir: string;
  userDataDir: string;
  name: string;
  email: string | null;
  isLastUsed: boolean;
  isSignedIn: boolean;
};

type BrowserHandle = {
  cdp: CdpConnection;
  port: number;
  launched: boolean;
};

type SessionRecord = {
  id: string;
  conversationUrl: string | null;
  profileEmail: string | null;
  profileDir: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
};

function printUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/deep-research.ts "Research topic"
  npx -y bun scripts/deep-research.ts --prompt "Research topic"
  npx -y bun scripts/deep-research.ts --sessionId my-research "Follow up question"

Options:
  -p, --prompt <text>       Prompt text to submit in Gemini Deep Research
  --sessionId <id>          Continue/save a Gemini Deep Research conversation
  --new-session             Start a new saved Deep Research conversation
  --list-sessions           List saved Deep Research sessions
  --profile-dir <path>      Chrome profile dir (default: Gemini web profile)
  --profile-email <email>   Resolve Chrome profile by signed-in email
  --list-profiles           List detected Chrome profiles
  --wait-ms <ms>            Wait after submit before returning (default: 5000)
  --no-submit               Fill the prompt but do not click submit
  --json                    Output JSON
  -h, --help                Show help

Env overrides:
  GEMINI_WEB_CHROME_PROFILE_DIR, BAOYU_CHROME_PROFILE_DIR, GEMINI_WEB_CHROME_PATH
`);
}

export function parseArgs(argv: string[]): Args {
  const out: Args = {
    prompt: null,
    profileDir: null,
    profileEmail: null,
    sessionId: null,
    newSession: false,
    listSessions: false,
    listProfiles: false,
    waitMs: 5000,
    noSubmit: false,
    json: false,
    help: false,
  };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--json') out.json = true;
    else if (a === '--no-submit') out.noSubmit = true;
    else if (a === '--list-sessions') out.listSessions = true;
    else if (a === '--list-profiles') out.listProfiles = true;
    else if (a === '--new-session') out.newSession = true;
    else if (a === '-p' || a === '--prompt') {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
    } else if (a === '--profile-dir') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --profile-dir');
      out.profileDir = v;
    } else if (a === '--profile-email') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --profile-email');
      out.profileEmail = v;
    } else if (a === '--sessionId') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --sessionId');
      out.sessionId = v;
    } else if (a === '--wait-ms') {
      const v = Number.parseInt(argv[++i] ?? '', 10);
      if (!Number.isFinite(v) || v < 0) throw new Error('Invalid value for --wait-ms');
      out.waitMs = v;
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }

  if (!out.prompt && positional.length > 0) out.prompt = positional.join(' ');
  return out;
}

function resolveSessionsDir(): string {
  return path.join(resolveGeminiWebDataDir(), 'deep-research-sessions');
}

function resolveSessionPath(id: string): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(resolveSessionsDir(), `${sanitized}.json`);
}

async function loadSession(id: string): Promise<SessionRecord | null> {
  try {
    const raw = await readFile(resolveSessionPath(id), 'utf8');
    const parsed = JSON.parse(raw) as Partial<SessionRecord>;
    return {
      id,
      conversationUrl: typeof parsed.conversationUrl === 'string' ? parsed.conversationUrl : null,
      profileEmail: typeof parsed.profileEmail === 'string' ? parsed.profileEmail : null,
      profileDir: typeof parsed.profileDir === 'string' ? parsed.profileDir : null,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter((item): item is SessionRecord['messages'][number] =>
            (item?.role === 'user' || item?.role === 'assistant') &&
            typeof item.content === 'string' &&
            typeof item.timestamp === 'string',
          )
        : [],
    };
  } catch {
    return null;
  }
}

async function saveSession(record: SessionRecord): Promise<void> {
  await mkdir(resolveSessionsDir(), { recursive: true });
  await writeFile(resolveSessionPath(record.id), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

async function listSessions(): Promise<SessionRecord[]> {
  try {
    const dir = resolveSessionsDir();
    const names = fs.readdirSync(dir).filter((name) => name.endsWith('.json'));
    const records: SessionRecord[] = [];
    for (const name of names) {
      const id = name.replace(/\.json$/, '');
      const rec = await loadSession(id);
      if (rec) records.push(rec);
    }
    records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return records;
  } catch {
    return [];
  }
}

function createSessionId(): string {
  return `deep-research-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

function matchesSessionSelector(
  session: SessionRecord,
  selector: { profileDir: string | null; profileEmail: string | null },
): boolean {
  if (!session.conversationUrl) return false;
  if (session.conversationUrl === GEMINI_APP_URL) return false;
  if (selector.profileEmail) {
    return (session.profileEmail ?? '').toLowerCase() === selector.profileEmail.toLowerCase();
  }
  if (selector.profileDir) {
    return !!session.profileDir && path.resolve(session.profileDir) === path.resolve(selector.profileDir);
  }
  return true;
}

export function pickLatestSession(
  sessions: SessionRecord[],
  selector: { profileDir?: string | null; profileEmail?: string | null },
): SessionRecord | null {
  return sessions.find((session) => matchesSessionSelector(session, {
    profileDir: selector.profileDir ?? null,
    profileEmail: selector.profileEmail ?? null,
  })) ?? null;
}

async function resolveInitialSession(args: Args): Promise<SessionRecord | null> {
  if (args.newSession) return null;
  if (args.sessionId) return await loadSession(args.sessionId);
  return pickLatestSession(await listSessions(), {
    profileDir: args.profileDir ?? null,
    profileEmail: args.profileEmail ?? null,
  });
}

function findChromeExecutable(): string {
  const chromePath = findChromeExecutableBase({
    candidates: CHROME_CANDIDATES,
    envNames: ['GEMINI_WEB_CHROME_PATH'],
  });
  if (!chromePath) throw new Error('Chrome executable not found. Set GEMINI_WEB_CHROME_PATH.');
  return chromePath;
}

export function parseChromeProfiles(localStateRaw: string, userDataDir: string): ChromeProfile[] {
  const parsed = JSON.parse(localStateRaw) as {
    profile?: {
      info_cache?: Record<string, {
        name?: string;
        user_name?: string;
      }>;
      last_used?: string;
    };
  };

  const infoCache = parsed.profile?.info_cache ?? {};
  const lastUsed = parsed.profile?.last_used ?? '';
  const profiles = Object.entries(infoCache).map(([profileKey, value]) => {
    const name = typeof value?.name === 'string' && value.name.trim() ? value.name.trim() : profileKey;
    const email = typeof value?.user_name === 'string' && value.user_name.trim() ? value.user_name.trim() : null;
    return {
      profileKey,
      profileDir: path.join(userDataDir, profileKey),
      userDataDir,
      name,
      email,
      isLastUsed: profileKey === lastUsed,
      isSignedIn: email !== null,
    };
  });

  profiles.sort((a, b) => {
    if (a.isLastUsed !== b.isLastUsed) return a.isLastUsed ? -1 : 1;
    if (a.isSignedIn !== b.isSignedIn) return a.isSignedIn ? -1 : 1;
    return a.profileKey.localeCompare(b.profileKey);
  });
  return profiles;
}

async function discoverChromeProfiles(): Promise<ChromeProfile[]> {
  const roots = getDefaultChromeUserDataDirs(['stable', 'beta', 'canary', 'dev']).map((item) => path.resolve(item));

  for (const root of roots) {
    const localStatePath = path.join(root, 'Local State');
    if (!fs.existsSync(localStatePath)) continue;
    try {
      const profiles = parseChromeProfiles(await readFile(localStatePath, 'utf8'), root);
      if (profiles.length > 0) return profiles;
    } catch {
      // Try next Chrome channel.
    }
  }
  return [];
}

export function pickProfile(
  profiles: ChromeProfile[],
  options: { profileDir?: string | null; profileEmail?: string | null },
): ChromeProfile | null {
  if (options.profileDir?.trim()) {
    const wanted = path.resolve(options.profileDir.trim());
    const existing = profiles.find((profile) => path.resolve(profile.profileDir) === wanted);
    if (existing) return existing;
    return {
      profileKey: path.basename(wanted),
      profileDir: wanted,
      userDataDir: path.dirname(wanted),
      name: path.basename(wanted),
      email: null,
      isLastUsed: false,
      isSignedIn: false,
    };
  }

  if (options.profileEmail?.trim()) {
    const wanted = options.profileEmail.trim().toLowerCase();
    const existing = profiles.find((profile) => profile.email?.toLowerCase() === wanted);
    if (!existing) throw new Error(`No Chrome profile found for email: ${options.profileEmail}`);
    return existing;
  }

  return null;
}

function launchChromeForProfile(chromePath: string, profile: ChromeProfile, port: number): void {
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    '--remote-allow-origins=*',
    `--user-data-dir=${profile.userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    '--disable-popup-blocking',
    GEMINI_APP_URL,
  ];
  if (profile.profileKey) args.splice(4, 0, `--profile-directory=${profile.profileKey}`);
  const child = spawn(chromePath, args, { stdio: 'ignore', detached: true });
  child.unref();
}

function cleanChromeSingletonArtifacts(userDataDir: string): void {
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie'] as const) {
    try {
      fs.unlinkSync(path.join(userDataDir, name));
    } catch {
      // Ignore missing files.
    }
  }
}

function shouldMirrorUserDataDir(userDataDir: string): boolean {
  const defaults = new Set(
    getDefaultChromeUserDataDirs(['stable', 'beta', 'canary', 'dev']).map((item) => path.resolve(item)),
  );
  return defaults.has(path.resolve(userDataDir));
}

async function createMirroredProfile(source: ChromeProfile): Promise<ChromeProfile> {
  const targetUserDataDir = path.join(resolveGeminiWebDataDir(), 'runtime-profiles', source.profileKey);
  await rm(targetUserDataDir, { recursive: true, force: true });
  await mkdir(targetUserDataDir, { recursive: true });

  const copyIfExists = async (from: string, to: string): Promise<void> => {
    if (!fs.existsSync(from)) return;
    await cp(from, to, { recursive: true, force: true });
  };

  await copyIfExists(path.join(source.userDataDir, 'Local State'), path.join(targetUserDataDir, 'Local State'));
  await copyIfExists(source.profileDir, path.join(targetUserDataDir, source.profileKey));
  await copyIfExists(path.join(source.userDataDir, 'First Run'), path.join(targetUserDataDir, 'First Run'));
  await copyIfExists(path.join(source.userDataDir, 'Variations'), path.join(targetUserDataDir, 'Variations'));
  await copyIfExists(path.join(source.userDataDir, 'NativeMessagingHosts'), path.join(targetUserDataDir, 'NativeMessagingHosts'));

  cleanChromeSingletonArtifacts(targetUserDataDir);
  return {
    ...source,
    profileDir: path.join(targetUserDataDir, source.profileKey),
    userDataDir: targetUserDataDir,
  };
}

function isChromeUsingUserDataDir(userDataDir: string): boolean {
  if (process.platform === 'win32') return false;
  try {
    const result = spawnSync('ps', ['aux'], { encoding: 'utf8', timeout: 5000 });
    if (result.status !== 0 || !result.stdout) return false;
    return result.stdout
      .split('\n')
      .some((line) => line.includes('--user-data-dir=') && line.includes(userDataDir));
  } catch {
    return false;
  }
}

async function connectBrowser(profile: ChromeProfile | null): Promise<BrowserHandle> {
  if (profile) {
    if (shouldMirrorUserDataDir(profile.userDataDir)) {
      profile = await createMirroredProfile(profile);
    }

    const existingPort = await findExistingChromeDebugPort({ profileDir: profile.userDataDir });
    const port = existingPort ?? await getFreePort('GEMINI_WEB_DEBUG_PORT');
    if (!existingPort && isChromeUsingUserDataDir(profile.userDataDir)) {
      throw new Error(
        `Chrome profile is already open without a usable CDP port: ${profile.profileDir}. ` +
        `Close that Chrome window, or restart Chrome with --remote-debugging-port=${port} and --profile-directory="${profile.profileKey}".`,
      );
    }
    if (!existingPort) launchChromeForProfile(findChromeExecutable(), profile, port);
    const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
    return {
      cdp: await CdpConnection.connect(wsUrl, 15_000),
      port,
      launched: !existingPort,
    };
  }

  const discovered = await discoverRunningChromeDebugPort();
  if (discovered) {
    return {
      cdp: await CdpConnection.connect(discovered.wsUrl, 15_000),
      port: discovered.port,
      launched: false,
    };
  }

  const profileDir = resolveGeminiWebChromeProfileDir();
  const existingPort = await findExistingChromeDebugPort({ profileDir });
  const port = existingPort ?? await getFreePort('GEMINI_WEB_DEBUG_PORT');
  if (!existingPort) {
    const pseudoProfile: ChromeProfile = {
      profileKey: '',
      profileDir,
      userDataDir: profileDir,
      name: path.basename(profileDir),
      email: null,
      isLastUsed: false,
      isSignedIn: false,
    };
    launchChromeForProfile(findChromeExecutable(), pseudoProfile, port);
  }

  const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
  return {
    cdp: await CdpConnection.connect(wsUrl, 15_000),
    port,
    launched: !existingPort,
  };
}

async function evaluate<T>(cdp: CdpConnection, sessionId: string, expression: string, timeoutMs = 30_000): Promise<T> {
  const result = await cdp.send<{
    result?: { value?: T };
    exceptionDetails?: { text?: string; exception?: { description?: string } };
  }>(
    'Runtime.evaluate',
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
    },
    { sessionId, timeoutMs },
  );

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime.evaluate failed');
  }
  return result.result?.value as T;
}

function jsString(value: string): string {
  return JSON.stringify(value);
}

function buildAutomationScript(prompt: string, noSubmit: boolean, enableDeepResearch: boolean): string {
  return `
(async () => {
  const prompt = ${jsString(prompt)};
  const noSubmit = ${noSubmit ? 'true' : 'false'};
  const enableDeepResearch = ${enableDeepResearch ? 'true' : 'false'};
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const labels = ['Deep Research', 'Deep research', 'deep research', 'DeepResearch'];
  const toolLabels = ['Tools', 'Open tools', 'Search tools', 'More tools', '工具'];

  const visible = (el) => {
    if (!el || !(el instanceof HTMLElement)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };

  const textOf = (el) => [
    el.getAttribute?.('aria-label'),
    el.getAttribute?.('title'),
    el.textContent,
  ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();

  const click = (el) => {
    el.scrollIntoView?.({ block: 'center', inline: 'center' });
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click();
  };

  const candidateSelector = [
    'button',
    '[role="button"]',
    'a',
    '[tabindex]',
    'mat-chip',
    'mat-option',
    '[aria-label]',
    '[title]',
  ].join(',');

  const isWanted = (text, wanted) => {
    const haystack = text.toLowerCase();
    return wanted.some((label) => {
      const needle = label.toLowerCase();
      if (needle === 'tools') {
        return /^tools$/.test(haystack) || /\\bopen tools\\b/.test(haystack) || /\\btools menu\\b/.test(haystack);
      }
      return haystack.includes(needle);
    });
  };

  const findClickableByLabels = (wanted) => {
    const nodes = Array.from(document.querySelectorAll(candidateSelector)).filter((node) => {
      if (!visible(node)) return false;
      const tag = node.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return false;
      if (node.getAttribute?.('role') === 'textbox') return false;
      if (node.getAttribute?.('contenteditable') === 'true') return false;
      return true;
    }).filter((node) => isWanted(textOf(node), wanted));

    nodes.sort((a, b) => {
      const ta = textOf(a).toLowerCase();
      const tb = textOf(b).toLowerCase();
      const exactA = wanted.some((label) => ta === label.toLowerCase()) ? 0 : 1;
      const exactB = wanted.some((label) => tb === label.toLowerCase()) ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;
      return ta.length - tb.length;
    });
    return nodes[0] || null;
  };

  const clickByLabels = async (wanted) => {
    const node = findClickableByLabels(wanted);
    if (!node) return null;
    click(node);
    await sleep(1200);
    return textOf(node);
  };

  const waitClickByLabels = async (wanted, attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
      const clicked = await clickByLabels(wanted);
      if (clicked) return clicked;
      await sleep(500);
    }
    return null;
  };

  let deepResearchClick = null;
  let openedTools = null;
  if (enableDeepResearch) {
    deepResearchClick = await waitClickByLabels(labels, 4);
  }
  if (enableDeepResearch && !deepResearchClick) {
    openedTools = await waitClickByLabels(toolLabels, 4);
    if (openedTools) deepResearchClick = await waitClickByLabels(labels, 4);
  }

  const textboxSelectors = [
    'textarea',
    'div[contenteditable="true"]',
    '[contenteditable="true"]',
    '[role="textbox"]',
  ];

  const findTextbox = () => {
    for (const selector of textboxSelectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).filter(visible);
      const node = nodes.find((el) => !el.getAttribute?.('aria-hidden'));
      if (node) return node;
    }
    return null;
  };

  let textbox = null;
  for (let i = 0; i < 20 && !textbox; i++) {
    textbox = findTextbox();
    if (!textbox) await sleep(500);
  }
  if (!textbox) {
    return { ok: false, stage: 'find-textbox', deepResearchClick, openedTools, url: location.href };
  }

  if (enableDeepResearch && !deepResearchClick && !openedTools) {
    openedTools = await waitClickByLabels(toolLabels, 6);
    if (openedTools) deepResearchClick = await waitClickByLabels(labels, 6);
  }

  textbox.focus();
  if (textbox instanceof HTMLTextAreaElement || textbox instanceof HTMLInputElement) {
    textbox.value = prompt;
  } else {
    document.execCommand?.('selectAll', false);
    document.execCommand?.('insertText', false, prompt);
    if (!textbox.textContent?.includes(prompt)) textbox.textContent = prompt;
  }
  textbox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
  textbox.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(800);

  if (enableDeepResearch && !deepResearchClick) {
    openedTools = openedTools || await waitClickByLabels(toolLabels, 10);
    if (openedTools) deepResearchClick = await waitClickByLabels(labels, 10);
  }

  let submitted = false;
  let submitText = null;
  if (!noSubmit) {
    const submitCandidates = Array.from(document.querySelectorAll('button,[role="button"],[aria-label]')).filter(visible);
    const submit = submitCandidates.find((node) => {
      const haystack = textOf(node).toLowerCase();
      const disabled = node.hasAttribute?.('disabled') || node.getAttribute?.('aria-disabled') === 'true';
      return !disabled && (
        haystack.includes('send') ||
        haystack.includes('submit') ||
        haystack.includes('start') ||
        haystack.includes('run') ||
        haystack.includes('发送') ||
        haystack.includes('提交') ||
        haystack.includes('开始')
      );
    }) || submitCandidates.reverse().find((node) => !node.hasAttribute?.('disabled') && node.getAttribute?.('aria-disabled') !== 'true');

    if (submit) {
      submitText = textOf(submit);
      click(submit);
      submitted = true;
    } else {
      textbox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', ctrlKey: true }));
      textbox.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter', ctrlKey: true }));
      submitted = true;
      submitText = 'keyboard:ctrl-enter';
    }
  }

  await sleep(1500);
  const candidateTexts = Array.from(document.querySelectorAll(candidateSelector))
    .filter(visible)
    .map(textOf)
    .filter(Boolean)
    .slice(0, 80);

  return {
    ok: true,
    stage: 'complete',
    deepResearchClick,
    openedTools,
    candidateTexts,
    submitted,
    submitText,
    url: location.href,
    title: document.title,
  };
})()
`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }
  if (args.listSessions) {
    for (const session of await listSessions()) {
      const last = session.messages.at(-1)?.content.replace(/\s+/g, ' ').slice(0, 80) ?? '';
      console.log(`${session.id}\t${session.updatedAt}\t${session.profileEmail ?? '-'}\t${session.conversationUrl ?? '-'}\t${last}`);
    }
    return;
  }
  const profiles = await discoverChromeProfiles();
  if (args.listProfiles) {
    for (const profile of profiles) {
      const mark = profile.isLastUsed ? '*' : ' ';
      console.log(`${mark}\t${profile.profileKey}\t${profile.email ?? '-'}\t${profile.name}\t${profile.profileDir}`);
    }
    return;
  }
  if (!args.prompt) throw new Error('Prompt is required.');

  const existingSession = await resolveInitialSession(args);
  const profile = pickProfile(profiles, {
    profileDir: args.profileDir ?? existingSession?.profileDir ?? null,
    profileEmail: args.profileEmail ?? existingSession?.profileEmail ?? null,
  });
  const browser = await connectBrowser(profile);
  const targetUrl = existingSession?.conversationUrl || GEMINI_APP_URL;
  const enableDeepResearch = !existingSession?.conversationUrl;

  try {
    const page = await openPageSession({
      cdp: browser.cdp,
      reusing: true,
      url: targetUrl,
      matchTarget: (target) => target.type === 'page' && target.url.includes('gemini.google.com'),
      enablePage: true,
      enableRuntime: true,
      enableDom: true,
      activateTarget: true,
    });

    await sleep(4000);

    const result = await evaluate<Record<string, unknown>>(
      browser.cdp,
      page.sessionId,
      buildAutomationScript(args.prompt, args.noSubmit, enableDeepResearch),
      60_000,
    );

    if (args.waitMs > 0) await sleep(args.waitMs);
    const finalLocation = await evaluate<{ url: string; title: string }>(
      browser.cdp,
      page.sessionId,
      `(() => ({ url: location.href, title: document.title }))()`,
      10_000,
    );

    let savedSession: SessionRecord | null = null;
    if (!args.noSubmit || args.sessionId) {
      const now = new Date().toISOString();
      savedSession = existingSession ?? {
        id: args.sessionId ?? createSessionId(),
        conversationUrl: null,
        profileEmail: profile?.email ?? args.profileEmail ?? null,
        profileDir: profile?.profileDir ?? args.profileDir ?? null,
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      savedSession.conversationUrl = finalLocation.url || (typeof result.url === 'string' ? result.url : null);
      savedSession.profileEmail = profile?.email ?? args.profileEmail ?? savedSession.profileEmail;
      savedSession.profileDir = profile?.profileDir ?? args.profileDir ?? savedSession.profileDir;
      savedSession.updatedAt = now;
      savedSession.messages.push({ role: 'user', content: args.prompt, timestamp: now });
      await saveSession(savedSession);
    }

    const output = {
      ...result,
      url: finalLocation.url || result.url,
      title: finalLocation.title || result.title,
      profileDir: profile?.profileDir ?? resolveGeminiWebChromeProfileDir(),
      profileEmail: profile?.email ?? args.profileEmail ?? null,
      sessionId: savedSession?.id ?? null,
      sessionUrl: savedSession?.conversationUrl ?? null,
      continuedSession: !!existingSession?.conversationUrl,
      port: browser.port,
      launched: browser.launched,
    };

    if (args.json) console.log(JSON.stringify(output, null, 2));
    else {
      console.log(`Gemini Deep Research automation: ${output.ok ? 'ok' : 'failed'}`);
      console.log(`URL: ${output.url ?? GEMINI_APP_URL}`);
      console.log(`Deep Research click: ${output.deepResearchClick ?? 'not found'}`);
      console.log(`Submitted: ${output.submitted ?? false}`);
    }
  } finally {
    browser.cdp.close();
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
