import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import {
  getDefaultChromeUserDataDirs,
} from 'baoyu-chrome-cdp';

import { GeminiClient, GeneratedImage, Model, type ModelOutput } from './gemini-webapi/index.js';
import { resolveGeminiWebChromeProfileDir, resolveGeminiWebCookiePath, resolveGeminiWebSessionPath, resolveGeminiWebSessionsDir } from './gemini-webapi/utils/index.js';

type CliArgs = {
  prompt: string | null;
  promptFiles: string[];
  modelId: string;
  json: boolean;
  imagePath: string | null;
  referenceImages: string[];
  sessionId: string | null;
  newSession: boolean;
  listSessions: boolean;
  login: boolean;
  cookiePath: string | null;
  profileDir: string | null;
  profileEmail: string | null;
  closeBrowser: boolean;
  help: boolean;
};

type SessionRecord = {
  id: string;
  metadata: Array<string | null>;
  profileEmail: string | null;
  profileDir: string | null;
  mode: 'text' | 'image';
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string; error?: string }>;
  createdAt: string;
  updatedAt: string;
};

type LegacySessionV1 = {
  version?: number;
  sessionId?: string;
  updatedAt?: string;
  conversationId?: string | null;
  responseId?: string | null;
  choiceId?: string | null;
  chatMetadata?: unknown;
};

function normalizeSessionMetadata(input: unknown): Array<string | null> {
  if (Array.isArray(input)) {
    const out: Array<string | null> = [];
    for (const v of input.slice(0, 3)) out.push(typeof v === 'string' ? v : null);
    return out.length > 0 ? out : [null, null, null];
  }

  if (input && typeof input === 'object') {
    const v1 = input as LegacySessionV1;
    if (Array.isArray(v1.chatMetadata)) return normalizeSessionMetadata(v1.chatMetadata);

    const conv = typeof v1.conversationId === 'string' ? v1.conversationId : null;
    const rid = typeof v1.responseId === 'string' ? v1.responseId : null;
    const rcid = typeof v1.choiceId === 'string' ? v1.choiceId : null;
    if (conv || rid || rcid) return [conv, rid, rcid];
  }

  return [null, null, null];
}

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

function printUsage(cookiePath: string, profileDir: string): void {
  const cmd = formatScriptCommand("scripts/main.ts");
  console.log(`Usage:
  ${cmd} --prompt "Hello"
  ${cmd} "Hello"
  ${cmd} --prompt "A cute cat" --image generated.png
  ${cmd} --promptfiles system.md content.md --image out.png

Multi-turn conversation (agent generates unique sessionId):
  ${cmd} "Remember 42" --sessionId abc123
  ${cmd} "What number?" --sessionId abc123

Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from one or more files (concatenated in order)
  -m, --model <id>          gemini-3-pro | gemini-3-flash | gemini-3-flash-thinking | gemini-3.1-pro-preview (default: gemini-3-pro)
  --json                    Output JSON
  --image [path]            Generate an image and save it (default: ./generated.png)
  --reference <files...>    Reference images for vision input
  --ref <files...>          Alias for --reference
  --sessionId <id>          Session ID for multi-turn conversation (agent should generate unique ID)
  --new-session             Start a new saved conversation instead of continuing the latest session
  --list-sessions           List saved sessions (max 100, sorted by update time)
  --login                   Only refresh cookies, then exit
  --cookie-path <path>      Cookie file path (default: ${cookiePath})
  --profile-dir <path>      Chrome profile dir (default: ${profileDir})
  --profile-email <email>   Resolve Chrome profile by signed-in email
  --close-browser           Close Chrome if this script launched it for login/cookie refresh
  -h, --help                Show help

Env overrides:
  GEMINI_WEB_DATA_DIR, GEMINI_WEB_COOKIE_PATH, GEMINI_WEB_CHROME_PROFILE_DIR, GEMINI_WEB_CHROME_PATH

Notes:
  By default cookie refresh may reuse an already-running local Chrome/Chromium debugging session.
  Set --profile-dir or GEMINI_WEB_CHROME_PROFILE_DIR to force a dedicated profile and skip existing-session reuse.
  This reuse path is separate from Chrome DevTools MCP's prompt-based --autoConnect flow.`);
}

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    prompt: null,
    promptFiles: [],
    modelId: 'gemini-3-pro',
    json: false,
    imagePath: null,
    referenceImages: [],
    sessionId: null,
    newSession: false,
    listSessions: false,
    login: false,
    cookiePath: null,
    profileDir: null,
    profileEmail: null,
    closeBrowser: false,
    help: false,
  };

  const positional: string[] = [];

  const takeMany = (i: number): { items: string[]; next: number } => {
    const items: string[] = [];
    let j = i + 1;
    while (j < argv.length) {
      const v = argv[j]!;
      if (v.startsWith('-')) break;
      items.push(v);
      j++;
    }
    return { items, next: j - 1 };
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === '--help' || a === '-h') {
      out.help = true;
      continue;
    }

    if (a === '--json') {
      out.json = true;
      continue;
    }

    if (a === '--list-sessions') {
      out.listSessions = true;
      continue;
    }

    if (a === '--new-session') {
      out.newSession = true;
      continue;
    }

    if (a === '--login') {
      out.login = true;
      continue;
    }

    if (a === '--close-browser') {
      out.closeBrowser = true;
      continue;
    }

    if (a === '--prompt' || a === '-p') {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
      continue;
    }

    if (a === '--promptfiles') {
      const { items, next } = takeMany(i);
      if (items.length === 0) throw new Error('Missing files for --promptfiles');
      out.promptFiles.push(...items);
      i = next;
      continue;
    }

    if (a === '--model' || a === '-m') {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.modelId = v;
      continue;
    }

    if (a === '--sessionId') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --sessionId');
      out.sessionId = v;
      continue;
    }

    if (a === '--cookie-path') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --cookie-path');
      out.cookiePath = v;
      continue;
    }

    if (a === '--profile-dir') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --profile-dir');
      out.profileDir = v;
      continue;
    }

    if (a === '--profile-email') {
      const v = argv[++i];
      if (!v) throw new Error('Missing value for --profile-email');
      out.profileEmail = v;
      continue;
    }

    if (a === '--image' || a.startsWith('--image=')) {
      let v: string | null = null;
      if (a.startsWith('--image=')) {
        v = a.slice('--image='.length).trim();
      } else {
        const maybe = argv[i + 1];
        if (maybe && !maybe.startsWith('-')) {
          v = maybe;
          i++;
        }
      }

      out.imagePath = v && v.length > 0 ? v : 'generated.png';
      continue;
    }

    if (a === '--reference' || a === '--ref') {
      const { items, next } = takeMany(i);
      if (items.length === 0) throw new Error(`Missing files for ${a}`);
      out.referenceImages.push(...items);
      i = next;
      continue;
    }

    if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    }

    positional.push(a);
  }

  if (!out.prompt && out.promptFiles.length === 0 && positional.length > 0) {
    out.prompt = positional.join(' ');
  }

  return out;
}

type ChromeProfile = {
  profileKey: string;
  profileDir: string;
  name: string;
  email: string | null;
  isLastUsed: boolean;
  isSignedIn: boolean;
};

export function parseChromeProfiles(localStateRaw: string, userDataDir: string): ChromeProfile[] {
  const parsed = JSON.parse(localStateRaw) as {
    profile?: {
      info_cache?: Record<string, { name?: string; user_name?: string }>;
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

export function pickProfileDirByEmail(profiles: ChromeProfile[], profileEmail: string): string {
  const wanted = profileEmail.trim().toLowerCase();
  const found = profiles.find((profile) => profile.email?.toLowerCase() === wanted);
  if (!found) throw new Error(`No Chrome profile found for email: ${profileEmail}`);
  return found.profileDir;
}

function resolveModel(id: string): Model {
  const k = id.trim();
  if (k === 'gemini-3-pro') return Model.G_3_0_PRO;
  if (k === 'gemini-3.0-pro') return Model.G_3_0_PRO;
  if (k === 'gemini-3-flash') return Model.G_3_0_FLASH;
  if (k === 'gemini-3.0-flash') return Model.G_3_0_FLASH;
  if (k === 'gemini-3-flash-thinking') return Model.G_3_0_FLASH_THINKING;
  if (k === 'gemini-3.0-flash-thinking') return Model.G_3_0_FLASH_THINKING;
  if (k === 'gemini-3.1-pro-preview') return Model.G_3_1_PRO_PREVIEW;
  return Model.from_name(k);
}

async function readPromptFromFiles(files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const f of files) {
    parts.push(await readFile(f, 'utf8'));
  }
  return parts.join('\n\n');
}

async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  try {
    // Bun provides Bun.stdin; Node-compatible read can be flaky across runtimes.
    const t = await Bun.stdin.text();
    const v = t.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function normalizeOutputImagePath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.png`;
}

async function loadSession(id: string): Promise<SessionRecord | null> {
  const p = resolveGeminiWebSessionPath(id);
  try {
    const raw = await readFile(p, 'utf8');
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== 'object') return null;

    const sid = (typeof (j as any).id === 'string' && (j as any).id.trim()) || (typeof (j as any).sessionId === 'string' && (j as any).sessionId.trim()) || id;
    const metadata = normalizeSessionMetadata((j as any).metadata ?? (j as any).chatMetadata ?? j);
    const messages = Array.isArray((j as any).messages) ? ((j as any).messages as SessionRecord['messages']) : [];
    const createdAt =
      typeof (j as any).createdAt === 'string'
        ? ((j as any).createdAt as string)
        : typeof (j as any).updatedAt === 'string'
          ? ((j as any).updatedAt as string)
          : new Date().toISOString();
    const updatedAt = typeof (j as any).updatedAt === 'string' ? ((j as any).updatedAt as string) : createdAt;

    return {
      id: sid,
      metadata,
      profileEmail: typeof (j as any).profileEmail === 'string' ? (j as any).profileEmail : null,
      profileDir: typeof (j as any).profileDir === 'string' ? (j as any).profileDir : null,
      mode: (j as any).mode === 'image' ? 'image' : 'text',
      messages,
      createdAt,
      updatedAt,
    };
  } catch {
    return null;
  }
}

async function saveSession(rec: SessionRecord): Promise<void> {
  const dir = resolveGeminiWebSessionsDir();
  await mkdir(dir, { recursive: true });
  const p = resolveGeminiWebSessionPath(rec.id);
  const tmp = `${p}.tmp.${Date.now()}`;
  await writeFile(tmp, JSON.stringify(rec, null, 2), 'utf8');
  await fs.promises.rename(tmp, p);
}

async function listSessions(): Promise<SessionRecord[]> {
  const dir = resolveGeminiWebSessionsDir();
  try {
    const names = await readdir(dir);
    const items: Array<{ path: string; st: number }> = [];
    for (const n of names) {
      if (!n.endsWith('.json')) continue;
      const p = path.join(dir, n);
      try {
        const s = await stat(p);
        items.push({ path: p, st: s.mtimeMs });
      } catch {}
    }

    items.sort((a, b) => b.st - a.st);
    const out: SessionRecord[] = [];
    for (const it of items.slice(0, 100)) {
      try {
        const raw = await readFile(it.path, 'utf8');
        const j = JSON.parse(raw) as any;
        const id =
          (typeof j?.id === 'string' && j.id.trim()) ||
          (typeof j?.sessionId === 'string' && j.sessionId.trim()) ||
          path.basename(it.path, '.json');
        out.push({
          id,
          metadata: normalizeSessionMetadata(j?.metadata ?? j?.chatMetadata ?? j),
          profileEmail: typeof j?.profileEmail === 'string' ? j.profileEmail : null,
          profileDir: typeof j?.profileDir === 'string' ? j.profileDir : null,
          mode: j?.mode === 'image' ? 'image' : 'text',
          messages: Array.isArray(j?.messages) ? j.messages : [],
          createdAt:
            typeof j?.createdAt === 'string'
              ? j.createdAt
              : typeof j?.updatedAt === 'string'
                ? j.updatedAt
                : new Date(it.st).toISOString(),
          updatedAt: typeof j?.updatedAt === 'string' ? j.updatedAt : new Date(it.st).toISOString(),
        });
      } catch {}
    }

    out.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return out.slice(0, 100);
  } catch {
    return [];
  }
}

function createSessionId(mode: 'text' | 'image'): string {
  return `${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

function matchesSessionSelector(
  session: SessionRecord,
  selector: { mode: 'text' | 'image'; profileDir: string | null; profileEmail: string | null },
): boolean {
  if (session.mode !== selector.mode) return false;
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
  selector: { mode: 'text' | 'image'; profileDir?: string | null; profileEmail?: string | null },
): SessionRecord | null {
  return sessions.find((session) => matchesSessionSelector(session, {
    mode: selector.mode,
    profileDir: selector.profileDir ?? null,
    profileEmail: selector.profileEmail ?? null,
  })) ?? null;
}

async function resolveInitialSession(
  args: CliArgs,
  mode: 'text' | 'image',
  selector: { profileDir: string | null; profileEmail: string | null },
): Promise<SessionRecord | null> {
  if (args.newSession) return null;
  if (args.sessionId) return await loadSession(args.sessionId);
  return pickLatestSession(await listSessions(), { mode, ...selector });
}

function formatJson(out: ModelOutput, extra?: Record<string, unknown>): string {
  const candidates = out.candidates.map((c) => ({
    rcid: c.rcid,
    text: c.text,
    thoughts: c.thoughts,
    images: c.images.map((img) => ({
      url: img.url,
      title: img.title,
      alt: img.alt,
      kind: img instanceof GeneratedImage ? 'generated' : 'web',
    })),
  }));

  return JSON.stringify(
    {
      text: out.text,
      thoughts: out.thoughts,
      metadata: out.metadata,
      chosen: out.chosen,
      candidates,
      ...extra,
    },
    null,
    2,
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.cookiePath) process.env.GEMINI_WEB_COOKIE_PATH = args.cookiePath;
  if (args.profileDir) process.env.GEMINI_WEB_CHROME_PROFILE_DIR = args.profileDir;
  if (args.closeBrowser) process.env.GEMINI_WEB_CLOSE_BROWSER = '1';
  if (args.profileEmail && !args.profileDir) {
    const profiles = await discoverChromeProfiles();
    process.env.GEMINI_WEB_CHROME_PROFILE_DIR = pickProfileDirByEmail(profiles, args.profileEmail);
  }

  const cookiePath = resolveGeminiWebCookiePath();
  const profileDir = resolveGeminiWebChromeProfileDir();

  if (args.help) {
    printUsage(cookiePath, profileDir);
    return;
  }

  if (args.listSessions) {
    const ss = await listSessions();
    for (const s of ss) {
      const n = s.messages.length;
      const last = s.messages.slice(-1)[0];
      const lastLine = last?.content ? String(last.content).split('\n')[0] : '';
      console.log(`${s.id}\t${s.updatedAt}\t${s.mode}\t${s.profileEmail ?? '-'}\t${n}\t${lastLine}`);
    }
    return;
  }

  if (args.login) {
    process.env.GEMINI_WEB_LOGIN = '1';
    const c = new GeminiClient();
    await c.init({ verbose: true });
    await c.close();
    if (!args.json) console.log(`Cookie refreshed: ${cookiePath}`);
    else console.log(JSON.stringify({ ok: true, cookiePath }, null, 2));
    return;
  }

  let prompt: string | null = args.prompt;
  if (!prompt && args.promptFiles.length > 0) prompt = await readPromptFromFiles(args.promptFiles);
  if (!prompt) prompt = await readPromptFromStdin();

  if (!prompt) {
    printUsage(cookiePath, profileDir);
    process.exitCode = 1;
    return;
  }

  const model = resolveModel(args.modelId);
  const mode: 'text' | 'image' = args.imagePath ? 'image' : 'text';
  const selectedProfileDir = args.profileDir ?? process.env.GEMINI_WEB_CHROME_PROFILE_DIR ?? null;
  const selectedProfileEmail = args.profileEmail ?? null;

  const c = new GeminiClient();
  await c.init({ verbose: false });
  try {
    let sess = await resolveInitialSession(args, mode, {
      profileDir: selectedProfileDir,
      profileEmail: selectedProfileEmail,
    });
    let chat = null as any;

    if (!sess) {
      sess = {
        id: args.sessionId ?? createSessionId(mode),
        metadata: [null, null, null],
        profileEmail: selectedProfileEmail,
        profileDir: selectedProfileDir,
        mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (sess) {
      chat = c.start_chat({ metadata: sess.metadata, model });
    }

    const files = args.referenceImages.length > 0 ? args.referenceImages : null;

    let out: ModelOutput;
    if (chat) out = await chat.send_message(prompt, files);
    else out = await c.generate_content(prompt, files, model);

    let savedImage: string | null = null;
    if (args.imagePath) {
      const p = normalizeOutputImagePath(args.imagePath);
      const dir = path.dirname(p);
      await mkdir(dir, { recursive: true });

      const img = out.images[0];
      if (!img) {
        throw new Error('No image returned in response.');
      }

      const fn = path.basename(p);
      const dp = dir;

      if (img instanceof GeneratedImage) {
        savedImage = await img.save(dp, fn, undefined, false, false, true);
      } else {
        savedImage = await img.save(dp, fn, c.cookies, false, false);
      }
    }

    if (sess) {
      const now = new Date().toISOString();
      sess.updatedAt = now;
      sess.metadata = (chat?.metadata ?? sess.metadata).slice(0, 3);
      sess.profileEmail = selectedProfileEmail ?? sess.profileEmail;
      sess.profileDir = selectedProfileDir ?? sess.profileDir;
      sess.mode = mode;
      sess.messages.push({ role: 'user', content: prompt, timestamp: now });
      sess.messages.push({ role: 'assistant', content: out.text ?? '', timestamp: now });
      await saveSession(sess);
    }

    if (args.json) {
      console.log(formatJson(out, { savedImage, sessionId: sess?.id ?? null, model: model.model_name, mode }));
    } else if (args.imagePath) {
      console.log(savedImage ?? '');
    } else {
      console.log(out.text);
    }
  } finally {
    await c.close();
  }
}

if (import.meta.main) {
  main().catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    process.exit(1);
  });
}
