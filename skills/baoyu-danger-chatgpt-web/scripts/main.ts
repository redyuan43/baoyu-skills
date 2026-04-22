import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";

import {
  CdpConnection,
  findChromeExecutable as findChromeExecutableBase,
  findExistingChromeDebugPort,
  getDefaultChromeUserDataDirs,
  getFreePort,
  gracefulKillChrome,
  openPageSession,
  sleep,
  waitForChromeDebugPort,
  type PlatformCandidates,
} from "../../../packages/baoyu-chrome-cdp/src/index.ts";

const DISCLAIMER_VERSION = "1.0";
const CHATGPT_URL = "https://chatgpt.com/";
const LOGIN_TIMEOUT_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 1_000;

const CHROME_CANDIDATES_FULL: PlatformCandidates = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  default: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/usr/bin/microsoft-edge",
  ],
};

export type CliArgs = {
  prompt: string | null;
  json: boolean;
  sessionId: string | null;
  listSessions: boolean;
  login: boolean;
  profileDir: string | null;
  profileEmail: string | null;
  listProfiles: boolean;
  responseTimeoutMs: number | null;
  help: boolean;
};

export type ConsentRecord = {
  version: number;
  accepted: true;
  acceptedAt: string;
  disclaimerVersion: string;
};

export type ChromeProfile = {
  profileKey: string;
  profileDir: string;
  name: string;
  email: string | null;
  isLastUsed: boolean;
  isSignedIn: boolean;
};

type SessionMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type SessionRecord = {
  id: string;
  profileDir: string;
  profileEmail: string | null;
  conversationUrl: string | null;
  messages: SessionMessage[];
  createdAt: string;
  updatedAt: string;
};

type ChatPromptResult = {
  text: string;
  conversationUrl: string | null;
  assistantTurnCount: number;
};

function isTransientAssistantText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return true;
  return [
    "流传输中断，正在等待完整消息…",
    "流传输中断，正在等待完整消息...",
    "Stream interrupted, waiting for the full message…",
    "Stream interrupted, waiting for the full message...",
  ].includes(normalized);
}

type BrowserSession = {
  cdp: CdpConnection;
  sessionId: string;
  port: number;
  chrome: ChildProcess | null;
  profile: ChromeProfile;
};

function formatScriptCommand(fallback: string): string {
  const raw = process.argv[1];
  const displayPath = raw
    ? (() => {
        const relative = path.relative(process.cwd(), raw);
        return relative && !relative.startsWith("..") ? relative : raw;
      })()
    : fallback;
  const quotedPath = displayPath.includes(" ")
    ? `"${displayPath.replace(/"/g, '\\"')}"`
    : displayPath;
  return `npx -y bun ${quotedPath}`;
}

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    prompt: null,
    json: false,
    sessionId: null,
    listSessions: false,
    login: false,
    profileDir: null,
    profileEmail: null,
    listProfiles: false,
    responseTimeoutMs: null,
    help: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (a === "--json") {
      out.json = true;
      continue;
    }
    if (a === "--list-sessions") {
      out.listSessions = true;
      continue;
    }
    if (a === "--list-profiles") {
      out.listProfiles = true;
      continue;
    }
    if (a === "--login") {
      out.login = true;
      continue;
    }
    if (a === "--prompt" || a === "-p") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
      continue;
    }
    if (a === "--sessionId") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --sessionId");
      out.sessionId = v;
      continue;
    }
    if (a === "--profile-dir") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --profile-dir");
      out.profileDir = v;
      continue;
    }
    if (a === "--profile-email") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --profile-email");
      out.profileEmail = v;
      continue;
    }
    if (a === "--response-timeout-ms") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --response-timeout-ms");
      const parsed = Number.parseInt(v, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Invalid value for --response-timeout-ms");
      }
      out.responseTimeoutMs = parsed;
      continue;
    }
    if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a}`);
    }
    positional.push(a);
  }

  if (!out.prompt && positional.length > 0) {
    out.prompt = positional.join(" ");
  }

  return out;
}

async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const value = Buffer.concat(chunks).toString("utf8").trim();
  return value.length > 0 ? value : null;
}

function resolveDataDir(): string {
  const override = process.env.CHATGPT_WEB_DATA_DIR?.trim();
  if (override) return path.resolve(override);

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "baoyu-skills", "chatgpt-web");
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "baoyu-skills", "chatgpt-web");
  }
  return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "baoyu-skills", "chatgpt-web");
}

export function resolveConsentPath(): string {
  return path.join(resolveDataDir(), "consent.json");
}

function resolveSessionsDir(): string {
  return path.join(resolveDataDir(), "sessions");
}

function resolveRuntimeProfilesDir(): string {
  return path.join(resolveDataDir(), "runtime-profiles");
}

function resolveSessionPath(id: string): string {
  return path.join(resolveSessionsDir(), `${id}.json`);
}

function isValidConsent(value: unknown): value is ConsentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ConsentRecord>;
  return (
    record.accepted === true &&
    record.disclaimerVersion === DISCLAIMER_VERSION &&
    typeof record.acceptedAt === "string" &&
    record.acceptedAt.length > 0
  );
}

async function promptYesNo(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  process.stderr.write(question);
  const answer = await new Promise<string>((resolve) => {
    process.stdin.once("data", (chunk) => resolve(String(chunk)));
  });
  const normalized = answer.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}

async function ensureConsent(): Promise<void> {
  const consentPath = resolveConsentPath();
  try {
    if (fs.existsSync(consentPath) && fs.statSync(consentPath).isFile()) {
      const raw = await readFile(consentPath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (isValidConsent(parsed)) {
        console.error(
          `⚠️  Warning: Using reverse-engineered ChatGPT Web access (not official). Accepted on: ${(parsed as ConsentRecord).acceptedAt}`
        );
        return;
      }
    }
  } catch {
    // fall through
  }

  console.error(`⚠️  DISCLAIMER

This tool uses reverse-engineered ChatGPT Web automation, NOT an official OpenAI API.

Risks:
- May break without notice if the website changes
- No official support or guarantees
- Your browser session/profile is used locally
- Use at your own risk
`);

  if (!process.stdin.isTTY) {
    throw new Error(
      `Consent required. Run in a TTY or create ${consentPath} with accepted: true and disclaimerVersion: ${DISCLAIMER_VERSION}`
    );
  }

  const accepted = await promptYesNo("Do you accept these terms and wish to continue? (y/N): ");
  if (!accepted) {
    throw new Error("User declined the disclaimer. Exiting.");
  }

  await mkdir(path.dirname(consentPath), { recursive: true });
  const payload: ConsentRecord = {
    version: 1,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    disclaimerVersion: DISCLAIMER_VERSION,
  };
  await writeFile(consentPath, JSON.stringify(payload, null, 2), "utf8");
  console.error(`[chatgpt-web] Consent saved to: ${consentPath}`);
}

function findChromeExecutable(): string | null {
  return findChromeExecutableBase({
    candidates: CHROME_CANDIDATES_FULL,
    envNames: ["CHATGPT_WEB_CHROME_PATH"],
  }) ?? null;
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
  const lastUsed = parsed.profile?.last_used ?? "";
  const profiles: ChromeProfile[] = Object.entries(infoCache).map(([profileKey, value]) => {
    const name = typeof value?.name === "string" && value.name.trim() ? value.name.trim() : profileKey;
    const email = typeof value?.user_name === "string" && value.user_name.trim() ? value.user_name.trim() : null;
    return {
      profileKey,
      profileDir: path.join(userDataDir, profileKey),
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

async function readChromeProfilesFromUserDataDir(userDataDir: string): Promise<ChromeProfile[]> {
  const localStatePath = path.join(userDataDir, "Local State");
  const raw = await readFile(localStatePath, "utf8");
  return parseChromeProfiles(raw, userDataDir);
}

async function discoverChromeProfiles(): Promise<ChromeProfile[]> {
  const roots = getDefaultChromeUserDataDirs(["stable", "beta", "canary", "dev"])
    .map((candidate) => path.resolve(candidate));

  for (const root of roots) {
    const localStatePath = path.join(root, "Local State");
    if (!fs.existsSync(localStatePath)) continue;
    try {
      const profiles = await readChromeProfilesFromUserDataDir(root);
      if (profiles.length > 0) return profiles;
    } catch {
      // try next root
    }
  }

  return [];
}

export function pickProfile(
  profiles: ChromeProfile[],
  options: { profileDir?: string | null; profileEmail?: string | null },
): ChromeProfile {
  if (options.profileDir?.trim()) {
    const wanted = path.resolve(options.profileDir.trim());
    const existing = profiles.find((profile) => path.resolve(profile.profileDir) === wanted);
    if (existing) return existing;
    return {
      profileKey: path.basename(wanted),
      profileDir: wanted,
      name: path.basename(wanted),
      email: null,
      isLastUsed: false,
      isSignedIn: false,
    };
  }

  if (options.profileEmail?.trim()) {
    const wanted = options.profileEmail.trim().toLowerCase();
    const existing = profiles.find((profile) => profile.email?.toLowerCase() === wanted);
    if (!existing) {
      throw new Error(`No Chrome profile found for email: ${options.profileEmail}`);
    }
    return existing;
  }

  const signedIn = profiles.filter((profile) => profile.isSignedIn);
  if (signedIn.length === 1) return signedIn[0]!;
  const lastUsedSignedIn = signedIn.find((profile) => profile.isLastUsed);
  if (lastUsedSignedIn) return lastUsedSignedIn;
  if (profiles.length === 1) return profiles[0]!;

  throw new Error("Multiple Chrome profiles detected. Pass --profile-email or --profile-dir.");
}

async function loadSession(id: string): Promise<SessionRecord | null> {
  const sessionPath = resolveSessionPath(id);
  try {
    const raw = await readFile(sessionPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SessionRecord>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      id: typeof parsed.id === "string" && parsed.id.trim() ? parsed.id : id,
      profileDir: typeof parsed.profileDir === "string" ? parsed.profileDir : "",
      profileEmail: typeof parsed.profileEmail === "string" ? parsed.profileEmail : null,
      conversationUrl: typeof parsed.conversationUrl === "string" && parsed.conversationUrl.trim() ? parsed.conversationUrl : null,
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter((item): item is SessionMessage =>
            !!item &&
            typeof item === "object" &&
            ((item as SessionMessage).role === "user" || (item as SessionMessage).role === "assistant") &&
            typeof (item as SessionMessage).content === "string" &&
            typeof (item as SessionMessage).timestamp === "string"
          )
        : [],
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function saveSession(session: SessionRecord): Promise<void> {
  await mkdir(resolveSessionsDir(), { recursive: true });
  const sessionPath = resolveSessionPath(session.id);
  const tempPath = `${sessionPath}.tmp.${Date.now()}`;
  await writeFile(tempPath, JSON.stringify(session, null, 2), "utf8");
  await fs.promises.rename(tempPath, sessionPath);
}

async function listSessions(): Promise<SessionRecord[]> {
  const sessionsDir = resolveSessionsDir();
  try {
    const names = await readdir(sessionsDir);
    const items: Array<{ session: SessionRecord; mtimeMs: number }> = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const sessionPath = path.join(sessionsDir, name);
      const loaded = await loadSession(path.basename(name, ".json"));
      if (!loaded) continue;
      const info = await stat(sessionPath);
      items.push({ session: loaded, mtimeMs: info.mtimeMs });
    }
    items.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return items.map((item) => item.session);
  } catch {
    return [];
  }
}

function printUsage(): void {
  const cmd = formatScriptCommand("scripts/main.ts");
  console.log(`Usage:
  ${cmd} --list-profiles
  ${cmd} --login --profile-email redyuan43@gmail.com
  ${cmd} --profile-email redyuan43@gmail.com "Summarize this project"
  ${cmd} --profile-email redyuan43@gmail.com --sessionId demo-1 "Continue"

Options:
  -p, --prompt <text>       Prompt text
  --json                    Output JSON
  --sessionId <id>          Session ID for multi-turn conversation
  --list-sessions           List saved sessions
  --login                   Open ChatGPT and wait until the composer is ready
  --profile-email <email>   Resolve Chrome profile by signed-in email
  --profile-dir <path>      Explicit Chrome profile directory
  --list-profiles           List detected Chrome profiles
  --response-timeout-ms <n> Response wait timeout in ms (default: wait indefinitely; 0 = no timeout)
  -h, --help                Show help

Env overrides:
  CHATGPT_WEB_DATA_DIR, CHATGPT_WEB_CHROME_PROFILE_DIR, CHATGPT_WEB_CHROME_PROFILE_EMAIL, CHATGPT_WEB_CHROME_PATH, CHATGPT_WEB_RESPONSE_TIMEOUT_MS`);
}

function launchChromeForProfile(chromePath: string, userDataDir: string, profileKey: string, port: number, url: string): ChildProcess {
  const args = [
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    `--profile-directory=${profileKey}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    "--disable-popup-blocking",
    url,
  ];
  return spawn(chromePath, args, { stdio: "ignore" });
}

function shouldMirrorUserDataDir(userDataDir: string): boolean {
  const defaults = new Set(getDefaultChromeUserDataDirs(["stable", "beta", "canary", "dev"]).map((item) => path.resolve(item)));
  return defaults.has(path.resolve(userDataDir));
}

async function createMirroredUserDataDir(profile: ChromeProfile): Promise<string> {
  const sourceUserDataDir = path.dirname(profile.profileDir);
  const profileKey = path.basename(profile.profileDir);
  const targetUserDataDir = path.join(resolveRuntimeProfilesDir(), profileKey);

  await fs.promises.rm(targetUserDataDir, { recursive: true, force: true });
  await mkdir(targetUserDataDir, { recursive: true });

  const copyIfExists = async (source: string, target: string): Promise<void> => {
    if (!fs.existsSync(source)) return;
    await fs.promises.cp(source, target, { recursive: true, force: true });
  };

  await copyIfExists(path.join(sourceUserDataDir, "Local State"), path.join(targetUserDataDir, "Local State"));
  await copyIfExists(profile.profileDir, path.join(targetUserDataDir, profileKey));
  await copyIfExists(path.join(sourceUserDataDir, "First Run"), path.join(targetUserDataDir, "First Run"));
  await copyIfExists(path.join(sourceUserDataDir, "Variations"), path.join(targetUserDataDir, "Variations"));
  await copyIfExists(path.join(sourceUserDataDir, "NativeMessagingHosts"), path.join(targetUserDataDir, "NativeMessagingHosts"));

  cleanChromeSingletonArtifacts(targetUserDataDir);
  return targetUserDataDir;
}

function isChromeUsingUserDataDir(userDataDir: string): boolean {
  if (process.platform === "win32") return false;
  try {
    const result = spawnSync("ps", ["aux"], { encoding: "utf8", timeout: 5_000 });
    if (result.status !== 0 || !result.stdout) return false;
    return result.stdout
      .split("\n")
      .some((line) => line.includes("--user-data-dir=") && line.includes(userDataDir));
  } catch {
    return false;
  }
}

function cleanChromeSingletonArtifacts(userDataDir: string): void {
  for (const name of ["SingletonLock", "SingletonSocket", "SingletonCookie"] as const) {
    try {
      fs.unlinkSync(path.join(userDataDir, name));
    } catch {
      // Ignore missing files.
    }
  }
}

async function evaluate<T>(cdp: CdpConnection, sessionId: string, expression: string): Promise<T> {
  const result = await cdp.send<{
    result: {
      value?: T;
      subtype?: string;
      description?: string;
    };
    exceptionDetails?: {
      text?: string;
      exception?: { description?: string };
    };
  }>("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, { sessionId });

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
      result.exceptionDetails.text ??
      "Runtime.evaluate failed"
    );
  }

  return result.result.value as T;
}

const GET_STATUS_EXPR = `(() => {
  const selectors = [
    'textarea[placeholder*="Message"]',
    'textarea[data-id]',
    'div[contenteditable="true"][data-lexical-editor="true"]',
    'div[contenteditable="true"][translate="no"]'
  ];
  const composer = selectors.map((sel) => document.querySelector(sel)).find(Boolean);
  const loginHints = Array.from(document.querySelectorAll('button, a'))
    .map((el) => (el.textContent || '').trim().toLowerCase())
    .filter(Boolean);
  const needsLogin = /\\/auth\\/|\\/login/.test(location.pathname) || loginHints.some((text) => text === 'log in' || text === 'sign in');
  return {
    url: location.href,
    ready: !!composer,
    needsLogin,
    reason: composer ? 'composer-ready' : needsLogin ? 'login-required' : 'composer-not-found',
  };
})()`;

const FOCUS_COMPOSER_EXPR = `(() => {
  const selectors = [
    'textarea[placeholder*="Message"]',
    'textarea[data-id]',
    'div[contenteditable="true"][data-lexical-editor="true"]',
    'div[contenteditable="true"][translate="no"]'
  ];
  const composer = selectors.map((sel) => document.querySelector(sel)).find(Boolean);
  if (!composer) return { ok: false, reason: 'composer-not-found' };
  if (composer instanceof HTMLTextAreaElement) {
    composer.focus();
    composer.value = '';
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '' }));
    return { ok: true, kind: 'textarea' };
  }
  if (composer instanceof HTMLElement) {
    composer.focus();
    composer.textContent = '';
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '' }));
    return { ok: true, kind: 'contenteditable' };
  }
  return { ok: false, reason: 'unsupported-composer' };
})()`;

const GET_ASSISTANT_TURNS_EXPR = `(() => {
  const normalize = (text) => String(text || '').replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim();
  const roots = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
  const turns = roots.map((root) => {
    const article = root.closest('article') || root;
    const textCandidates = [
      ...article.querySelectorAll('.markdown, [data-testid="markdown"], .prose, .whitespace-pre-wrap, p, pre, code')
    ].map((node) => normalize(node.innerText || node.textContent || ''));
    textCandidates.push(normalize(article.innerText || article.textContent || ''));
    const text = textCandidates.sort((a, b) => b.length - a.length)[0] || '';
    return { text };
  }).filter((turn) => turn.text.length > 0);
  return { count: turns.length, texts: turns.map((turn) => turn.text), url: location.href };
})()`;

async function waitForComposer(cdp: CdpConnection, sessionId: string, timeoutMs: number): Promise<{ url: string }> {
  const start = Date.now();
  let lastReason = "unknown";
  while (Date.now() - start < timeoutMs) {
    const status = await evaluate<{ url: string; ready: boolean; needsLogin: boolean; reason: string }>(
      cdp,
      sessionId,
      GET_STATUS_EXPR,
    );
    if (status.ready) return { url: status.url };
    lastReason = status.reason;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ChatGPT composer (${lastReason}). If Chrome is already open, close it and retry.`);
}

async function navigateTo(cdp: CdpConnection, sessionId: string, url: string): Promise<void> {
  await cdp.send("Page.navigate", { url }, { sessionId, timeoutMs: 15_000 });
  await sleep(1_500);
}

async function getAssistantTurnCount(cdp: CdpConnection, sessionId: string): Promise<number> {
  const result = await evaluate<{ count: number }>(cdp, sessionId, GET_ASSISTANT_TURNS_EXPR);
  return result.count;
}

async function submitPrompt(cdp: CdpConnection, sessionId: string, prompt: string): Promise<void> {
  const focused = await evaluate<{ ok: boolean; reason?: string }>(cdp, sessionId, FOCUS_COMPOSER_EXPR);
  if (!focused.ok) throw new Error(`Unable to focus ChatGPT composer (${focused.reason ?? "unknown"}).`);

  await cdp.send("Input.insertText", { text: prompt }, { sessionId, timeoutMs: 15_000 });
  await sleep(200);
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  }, { sessionId });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  }, { sessionId });
}

async function waitForAssistantReply(
  cdp: CdpConnection,
  sessionId: string,
  previousCount: number,
  timeoutMs: number,
): Promise<ChatPromptResult> {
  const start = Date.now();
  let stableText = "";
  let stableCount = 0;
  const shouldTimeout = timeoutMs > 0;

  while (!shouldTimeout || Date.now() - start < timeoutMs) {
    const turns = await evaluate<{ count: number; texts: string[]; url: string }>(cdp, sessionId, GET_ASSISTANT_TURNS_EXPR);
    const latestText = turns.texts.at(-1) ?? "";

    if (turns.count > previousCount && latestText.length > 0 && !isTransientAssistantText(latestText)) {
      if (latestText === stableText) {
        stableCount += 1;
      } else {
        stableText = latestText;
        stableCount = 1;
      }

      if (stableCount >= 3) {
        return {
          text: latestText,
          conversationUrl: turns.url,
          assistantTurnCount: turns.count,
        };
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for ChatGPT response.");
}

function resolveResponseTimeoutMs(cliValue: number | null): number {
  if (cliValue !== null) return cliValue;
  const raw = process.env.CHATGPT_WEB_RESPONSE_TIMEOUT_MS?.trim();
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid CHATGPT_WEB_RESPONSE_TIMEOUT_MS value");
  }
  return parsed;
}

async function openChatGPTBrowser(profile: ChromeProfile, url: string): Promise<BrowserSession> {
  const chromePath = findChromeExecutable();
  if (!chromePath) throw new Error("Chrome executable not found.");

  const profileKey = path.basename(profile.profileDir);
  const sourceUserDataDir = path.dirname(profile.profileDir);
  const userDataDir = shouldMirrorUserDataDir(sourceUserDataDir)
    ? await createMirroredUserDataDir(profile)
    : sourceUserDataDir;

  if (!isChromeUsingUserDataDir(userDataDir)) {
    cleanChromeSingletonArtifacts(userDataDir);
  }

  const existingPort = await findExistingChromeDebugPort({ profileDir: userDataDir });
  const reusing = existingPort !== null;
  const port = existingPort ?? await getFreePort();
  const chrome = reusing ? null : launchChromeForProfile(chromePath, userDataDir, profileKey, port, url);

  let wsUrl: string;
  try {
    wsUrl = await waitForChromeDebugPort(port, 60_000, { includeLastError: true });
  } catch (error) {
    if (chrome) await gracefulKillChrome(chrome, port).catch(() => undefined);
    const suffix = reusing
      ? "Close the existing Chrome window for this profile and retry."
      : "If Chrome is already running on this profile, close it and retry.";
    throw new Error(`${error instanceof Error ? error.message : String(error)} ${suffix}`);
  }

  const cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 20_000 });

  try {
    const page = await openPageSession({
      cdp,
      reusing,
      url,
      matchTarget: (target) => target.type === "page" && target.url.includes("chatgpt.com"),
      enablePage: true,
      enableRuntime: true,
      enableNetwork: true,
      activateTarget: true,
    });
    await cdp.send("Input.setIgnoreInputEvents", { ignore: false }, { sessionId: page.sessionId });
    return {
      cdp,
      sessionId: page.sessionId,
      port,
      chrome,
      profile,
    };
  } catch (error) {
    cdp.close();
    if (chrome) await gracefulKillChrome(chrome, port);
    throw error;
  }
}

async function closeBrowserSession(session: BrowserSession): Promise<void> {
  session.cdp.close();
  if (session.chrome) {
    await gracefulKillChrome(session.chrome, session.port);
  }
}

function formatJson(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, null, 2);
}

async function resolveSelectedProfile(args: CliArgs, existingSession: SessionRecord | null): Promise<ChromeProfile> {
  const explicitProfileDir = args.profileDir ?? process.env.CHATGPT_WEB_CHROME_PROFILE_DIR ?? existingSession?.profileDir ?? null;
  const explicitProfileEmail = args.profileEmail ?? process.env.CHATGPT_WEB_CHROME_PROFILE_EMAIL ?? existingSession?.profileEmail ?? null;

  const discovered = await discoverChromeProfiles();
  return pickProfile(discovered, {
    profileDir: explicitProfileDir,
    profileEmail: explicitProfileEmail,
  });
}

async function runPromptFlow(
  browser: BrowserSession,
  prompt: string,
  existingSession: SessionRecord | null,
): Promise<ChatPromptResult> {
  const targetUrl = existingSession?.conversationUrl ?? CHATGPT_URL;
  await navigateTo(browser.cdp, browser.sessionId, targetUrl);
  await waitForComposer(browser.cdp, browser.sessionId, LOGIN_TIMEOUT_MS);

  const beforeCount = await getAssistantTurnCount(browser.cdp, browser.sessionId);
  await submitPrompt(browser.cdp, browser.sessionId, prompt);
  return await waitForAssistantReply(browser.cdp, browser.sessionId, beforeCount, RESPONSE_TIMEOUT_MS);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const responseTimeoutMs = resolveResponseTimeoutMs(args.responseTimeoutMs);
  if (args.help) {
    printUsage();
    return;
  }

  if (args.listProfiles) {
    const profiles = await discoverChromeProfiles();
    for (const profile of profiles) {
      const marker = profile.isLastUsed ? "*" : " ";
      console.log(`${marker}\t${profile.profileKey}\t${profile.email ?? "-"}\t${profile.name}\t${profile.profileDir}`);
    }
    return;
  }

  await ensureConsent();

  if (args.listSessions) {
    const sessions = await listSessions();
    for (const session of sessions) {
      const last = session.messages.at(-1)?.content.split("\n")[0] ?? "";
      console.log(`${session.id}\t${session.updatedAt}\t${session.profileEmail ?? "-"}\t${last}`);
    }
    return;
  }

  const existingSession = args.sessionId ? await loadSession(args.sessionId) : null;
  const profile = await resolveSelectedProfile(args, existingSession);

  if (args.login) {
    const browser = await openChatGPTBrowser(profile, existingSession?.conversationUrl ?? CHATGPT_URL);
    try {
      const status = await waitForComposer(browser.cdp, browser.sessionId, LOGIN_TIMEOUT_MS);
      if (args.json) {
        console.log(formatJson({
          ok: true,
          profileEmail: profile.email,
          profileDir: profile.profileDir,
          url: status.url,
        }));
      } else {
        console.log(`ChatGPT ready: ${status.url}`);
      }
      return;
    } finally {
      await closeBrowserSession(browser);
    }
  }

  let prompt = args.prompt;
  if (!prompt) prompt = await readPromptFromStdin();
  if (!prompt) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const browser = await openChatGPTBrowser(profile, existingSession?.conversationUrl ?? CHATGPT_URL);
  try {
    const result = await (async () => {
      const targetUrl = existingSession?.conversationUrl ?? CHATGPT_URL;
      await navigateTo(browser.cdp, browser.sessionId, targetUrl);
      await waitForComposer(browser.cdp, browser.sessionId, LOGIN_TIMEOUT_MS);

      const beforeCount = await getAssistantTurnCount(browser.cdp, browser.sessionId);
      await submitPrompt(browser.cdp, browser.sessionId, prompt);
      return await waitForAssistantReply(browser.cdp, browser.sessionId, beforeCount, responseTimeoutMs);
    })();
    let savedSession: SessionRecord | null = null;

    if (args.sessionId) {
      const now = new Date().toISOString();
      savedSession = existingSession ?? {
        id: args.sessionId,
        profileDir: profile.profileDir,
        profileEmail: profile.email,
        conversationUrl: null,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      savedSession.profileDir = profile.profileDir;
      savedSession.profileEmail = profile.email;
      savedSession.conversationUrl = result.conversationUrl;
      savedSession.updatedAt = now;
      savedSession.messages.push({ role: "user", content: prompt, timestamp: now });
      savedSession.messages.push({ role: "assistant", content: result.text, timestamp: now });
      await saveSession(savedSession);
    }

    if (args.json) {
      console.log(formatJson({
        text: result.text,
        conversationUrl: result.conversationUrl,
        sessionId: savedSession?.id ?? null,
        profileEmail: profile.email,
        profileDir: profile.profileDir,
      }));
    } else {
      console.log(result.text);
    }
  } finally {
    await closeBrowserSession(browser);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

export function __testAssertSessionRecord(record: SessionRecord): void {
  assert.ok(record.id.length > 0);
}
