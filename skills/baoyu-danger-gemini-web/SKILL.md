---
name: baoyu-danger-gemini-web
description: Generates images and text via reverse-engineered Gemini Web API. Supports text generation, image generation from prompts, reference images for vision input, and multi-turn conversations. Use when other skills need image generation backend, or when user requests "generate image with Gemini", "Gemini text generation", or needs vision-capable AI generation.
version: 1.56.1
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills#baoyu-danger-gemini-web
    requires:
      anyBins:
        - bun
        - npx
---

# Gemini Web Client

Text/image generation via Gemini Web API. Supports reference images and multi-turn conversations.

## Codex Positioning

Use this as a local Codex skill for Gemini Web access.

- It is intended for direct use from Codex as a local workflow
- It is not a web UI
- It is not an MCP server
- It is not a Codex app-server integration
- It depends on local browser authentication and cookie refresh

## User Input Tools

When this skill prompts the user, follow this tool-selection rule (priority order):

1. **Prefer built-in user-input tools** exposed by the current agent runtime — e.g., `AskUserQuestion`, `request_user_input`, `clarify`, `ask_user`, or any equivalent.
2. **Fallback**: if no such tool exists, emit a numbered plain-text message and ask the user to reply with the chosen number/answer for each question.
3. **Batching**: if the tool supports multiple questions per call, combine all applicable questions into a single call; if only single-question, ask them one at a time in priority order.

Concrete `AskUserQuestion` references below are examples — substitute the local equivalent in other runtimes.

## Skill Evolution Confirmation

When extending this skill or changing its default behavior, prefer safe, explicit confirmation over guessing.

Proceed directly only for small, backward-compatible fixes, such as adding help text, adding a non-default option, fixing a selector bug, or documenting an existing command.

Ask the user before making changes that affect defaults or user workflow, including:

- Default Chrome profile or account selection
- Default model selection
- Whether Gemini Deep Research should be enabled automatically
- Whether an existing `--sessionId` should be resumed or replaced
- Whether browser windows or Chrome processes should be closed
- Session storage location or session migration
- UI selector behavior when multiple possible buttons/menu items are visible
- Any behavior that could submit prompts, trigger paid/limited features, or alter account state

If Gemini UI automation is uncertain, first collect observable state, such as visible button labels, current URL, selected tools, account email, and prompt box status. Then ask the user how to adapt the skill before changing broad matching rules or defaults.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Script path = `{baseDir}/scripts/<script-name>.ts`
3. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun
4. Replace all `{baseDir}` and `${BUN_X}` in this document with actual values

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | CLI entry point for text/image generation |
| `scripts/deep-research.ts` | Chrome CDP UI automation for opening Gemini Deep Research and submitting a prompt |
| `scripts/gemini-webapi/*` | TypeScript port of `gemini_webapi` (GeminiClient, types, utils) |

## Consent Check (REQUIRED)

Before first use, verify user consent for reverse-engineered API usage.

**Consent file locations**:
- macOS: `~/Library/Application Support/baoyu-skills/gemini-web/consent.json`
- Linux: `~/.local/share/baoyu-skills/gemini-web/consent.json`
- Windows: `%APPDATA%\baoyu-skills\gemini-web\consent.json`

**Flow**:
1. Check if consent file exists with `accepted: true` and `disclaimerVersion: "1.0"`
2. If valid consent exists → print warning with `acceptedAt` date, proceed
3. If no consent → show disclaimer, ask user via `AskUserQuestion`:
   - "Yes, I accept" → create consent file with ISO timestamp, proceed
   - "No, I decline" → output decline message, stop
4. Consent file format: `{"version":1,"accepted":true,"acceptedAt":"<ISO>","disclaimerVersion":"1.0"}`

---

## Preferences (EXTEND.md)

Check EXTEND.md in priority order — the first one found wins:

| Priority | Path | Scope |
|----------|------|-------|
| 1 | `.baoyu-skills/baoyu-danger-gemini-web/EXTEND.md` | Project |
| 2 | `${XDG_CONFIG_HOME:-$HOME/.config}/baoyu-skills/baoyu-danger-gemini-web/EXTEND.md` | XDG |
| 3 | `$HOME/.baoyu-skills/baoyu-danger-gemini-web/EXTEND.md` | User home |

If none found, use defaults.

**EXTEND.md supports**: Default model, proxy settings, custom data directory.

## Usage

```bash
# Text generation
${BUN_X} {baseDir}/scripts/main.ts "Your prompt"
${BUN_X} {baseDir}/scripts/main.ts --prompt "Your prompt" --model gemini-3-flash
${BUN_X} {baseDir}/scripts/main.ts --profile-email ivanfeng3333@gmail.com "Your prompt"

# Image generation
${BUN_X} {baseDir}/scripts/main.ts --profile-email ivanfeng3333@gmail.com --prompt "A cute cat" --image cat.png
${BUN_X} {baseDir}/scripts/main.ts --promptfiles system.md content.md --image out.png

# Vision input (reference images)
${BUN_X} {baseDir}/scripts/main.ts --prompt "Describe this" --reference image.png
${BUN_X} {baseDir}/scripts/main.ts --prompt "Create variation" --reference a.png --image out.png

# Multi-turn conversation
${BUN_X} {baseDir}/scripts/main.ts "Remember: 42" --sessionId session-abc
${BUN_X} {baseDir}/scripts/main.ts "What number?" --sessionId session-abc
${BUN_X} {baseDir}/scripts/main.ts --profile-email ivanfeng3333@gmail.com "Continue latest text session"
${BUN_X} {baseDir}/scripts/main.ts --profile-email ivanfeng3333@gmail.com --new-session "Start a fresh topic"

# Gemini Deep Research UI automation
${BUN_X} {baseDir}/scripts/deep-research.ts --profile-email ivanfeng3333@gmail.com --sessionId demo-research "Research this topic"
${BUN_X} {baseDir}/scripts/deep-research.ts --sessionId demo-research "Follow up in the same Gemini conversation"
${BUN_X} {baseDir}/scripts/deep-research.ts --prompt "Research this topic" --no-submit
${BUN_X} {baseDir}/scripts/deep-research.ts --list-profiles
${BUN_X} {baseDir}/scripts/deep-research.ts --list-sessions

# JSON output
${BUN_X} {baseDir}/scripts/main.ts "Hello" --json
```

## Options

| Option | Description |
|--------|-------------|
| `--prompt`, `-p` | Prompt text |
| `--promptfiles` | Read prompt from files (concatenated) |
| `--model`, `-m` | Model: gemini-3-pro (default), gemini-3-flash, gemini-3-flash-thinking, gemini-3.1-pro-preview |
| `--image [path]` | Generate image (default: generated.png) |
| `--reference`, `--ref` | Reference images for vision input |
| `--sessionId` | Session ID for multi-turn conversation |
| `--new-session` | Start a new saved conversation instead of continuing the latest compatible session |
| `--list-sessions` | List saved sessions |
| `--json` | Output as JSON |
| `--login` | Refresh cookies, then exit |
| `--cookie-path` | Custom cookie file path |
| `--profile-dir` | Chrome profile directory |
| `--profile-email` | Resolve Chrome profile by signed-in email, e.g. `ivanfeng3333@gmail.com` |
| `--close-browser` | Close Chrome if this script launched it for login/cookie refresh; default is to keep Chrome available for reuse |

### Deep Research UI Automation Options

These options are for `scripts/deep-research.ts`, which uses Chrome CDP to operate the Gemini web UI.

| Option | Description |
|--------|-------------|
| `--prompt`, `-p` | Prompt text |
| `--profile-email` | Resolve Chrome profile by signed-in email, e.g. `ivanfeng3333@gmail.com` |
| `--profile-dir` | Explicit Chrome profile directory |
| `--sessionId` | Save or continue a Gemini Deep Research conversation |
| `--new-session` | Start a new saved Deep Research conversation instead of continuing the latest compatible session |
| `--list-profiles` | List detected Chrome profiles |
| `--list-sessions` | List saved Deep Research sessions |
| `--wait-ms` | Wait after submit before returning |
| `--no-submit` | Fill the prompt and select Deep Research without submitting |
| `--json` | Output JSON |

Deep Research sessions are stored separately from RPC chat sessions under `deep-research-sessions/<id>.json` in the Gemini web data directory. A saved session records the Gemini conversation URL and profile metadata so later calls with the same `--sessionId` continue the same web conversation.

## Models

| Model | Description |
|-------|-------------|
| `gemini-3-pro` | Default, latest 3.0 Pro |
| `gemini-3-flash` | Fast, lightweight 3.0 Flash |
| `gemini-3-flash-thinking` | 3.0 Flash with thinking |
| `gemini-3.1-pro-preview` | 3.1 Pro preview (empty header, auto-routed) |

## Authentication

First run opens browser for Google auth. Cookies cached automatically.

When no explicit profile dir is set, cookie refresh may reuse an already-running local Chrome/Chromium debugging session tied to a standard user-data dir.
Set `--profile-dir` or `GEMINI_WEB_CHROME_PROFILE_DIR` to force a dedicated profile and skip existing-session reuse.
This is a best-effort CDP session reuse path, not the Chrome DevTools MCP prompt-based `--autoConnect` flow described in Chrome's official docs.

Supported browsers (auto-detected): Chrome, Chrome Canary/Beta, Chromium, Edge.

Force refresh: `--login` flag. Override browser: `GEMINI_WEB_CHROME_PATH` env var.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_WEB_DATA_DIR` | Data directory |
| `GEMINI_WEB_COOKIE_PATH` | Cookie file path |
| `GEMINI_WEB_CHROME_PROFILE_DIR` | Chrome profile directory |
| `GEMINI_WEB_CHROME_PATH` | Chrome executable path |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy for Google access (set inline with command) |

## Sessions

Session files stored in data directory under `sessions/<id>.json`.

Prompt runs continue the latest saved compatible session by default unless `--new-session` is passed. Text and image conversations are isolated by `mode` (`text` or `image`) so image generation does not reuse ordinary text context.

Contains: `id`, `metadata` (Gemini chat state), `profileEmail`, `profileDir`, `mode`, `messages` array, timestamps.

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** section for paths and supported options.
