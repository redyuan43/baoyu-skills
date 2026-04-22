---
name: baoyu-danger-chatgpt-web
description: Uses reverse-engineered ChatGPT Web access via a real Chrome profile and CDP automation. Supports profile discovery, login verification, single-turn prompts, and persisted multi-turn sessions via saved conversation URLs. Use when the user explicitly wants local ChatGPT Web automation rather than the official Apps SDK / MCP route.
version: 0.1.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills
    requires:
      anyBins:
        - bun
        - npx
---

# ChatGPT Web Client

Dangerous local ChatGPT Web automation via a real Chrome profile.

## Codex Positioning

Use this as a local Codex skill for ChatGPT Web access.

- It is intended for direct use from Codex as a local workflow
- It is not an official OpenAI API integration
- It is not an MCP server
- It is not a ChatGPT App / Apps SDK integration
- It depends on local browser authentication and Chrome profile access

## Official Route vs Dangerous Route

This skill is the non-official browser route.

If the user wants the official ChatGPT integration route, use OpenAI Apps SDK + MCP server instead of this skill.

## User Input Tools

When this skill prompts the user, follow this tool-selection rule (priority order):

1. **Prefer built-in user-input tools** exposed by the current agent runtime — e.g. `AskUserQuestion`, `request_user_input`, `clarify`, `ask_user`, or any equivalent.
2. **Fallback**: if no such tool exists, emit a numbered plain-text message and ask the user to reply with the chosen number/answer for each question.
3. **Batching**: if the tool supports multiple questions per call, combine all applicable questions into a single call; if only single-question, ask them one at a time in priority order.

## Script Directory

All scripts are in `scripts/`.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Script path = `{baseDir}/scripts/main.ts`
3. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun
4. Replace all `{baseDir}` and `${BUN_X}` in this document with actual values

## Consent Check (REQUIRED)

Before first use, verify user consent for reverse-engineered ChatGPT Web usage.

**Consent file locations**:
- macOS: `~/Library/Application Support/baoyu-skills/chatgpt-web/consent.json`
- Linux: `~/.local/share/baoyu-skills/chatgpt-web/consent.json`
- Windows: `%APPDATA%/baoyu-skills/chatgpt-web/consent.json`

**Flow**:
1. Check whether the consent file exists with `accepted: true` and `disclaimerVersion: "1.0"`
2. If consent exists → print warning with `acceptedAt`, then proceed
3. If no consent → show disclaimer, ask user for acceptance, save consent on accept
4. On decline → stop

## Preferences (EXTEND.md)

Check EXTEND.md in priority order — the first one found wins:

| Priority | Path | Scope |
|----------|------|-------|
| 1 | `.baoyu-skills/baoyu-danger-chatgpt-web/EXTEND.md` | Project |
| 2 | `${XDG_CONFIG_HOME:-$HOME/.config}/baoyu-skills/baoyu-danger-chatgpt-web/EXTEND.md` | XDG |
| 3 | `$HOME/.baoyu-skills/baoyu-danger-chatgpt-web/EXTEND.md` | User home |

If none found, use defaults.

**EXTEND.md supports**: custom data directory, custom Chrome path, default profile email.

## Usage

```bash
# List available Chrome profiles
${BUN_X} {baseDir}/scripts/main.ts --list-profiles

# Verify login with a specific Chrome account
${BUN_X} {baseDir}/scripts/main.ts --login --profile-email redyuan43@gmail.com

# Single-turn prompt
${BUN_X} {baseDir}/scripts/main.ts --profile-email redyuan43@gmail.com "Summarize this project"

# Resume a saved conversation
${BUN_X} {baseDir}/scripts/main.ts --profile-email redyuan43@gmail.com --sessionId demo-1 "Continue"

# JSON output
${BUN_X} {baseDir}/scripts/main.ts --profile-email redyuan43@gmail.com --json "What is the current page structure?"
```

## Options

| Option | Description |
|--------|-------------|
| `--prompt`, `-p` | Prompt text |
| `--sessionId` | Session ID for multi-turn conversation |
| `--list-sessions` | List saved sessions |
| `--json` | Output as JSON |
| `--login` | Open/attach ChatGPT and wait until the composer is ready |
| `--profile-email` | Resolve Chrome profile by signed-in email |
| `--profile-dir` | Explicit Chrome profile directory |
| `--list-profiles` | List detected Chrome profiles |
| `--help`, `-h` | Show help |

## Authentication

This skill uses a real Chrome profile. It does not use an OpenAI API key.

- `--profile-email` is the preferred path when Chrome already contains the right signed-in account
- `--profile-dir` forces a specific Chrome profile directory
- `--login` opens/attaches ChatGPT and waits for a usable composer

Supported browsers (auto-detected): Chrome, Chrome Canary/Beta, Chromium, Edge.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CHATGPT_WEB_DATA_DIR` | Data directory |
| `CHATGPT_WEB_CHROME_PROFILE_DIR` | Explicit Chrome profile directory |
| `CHATGPT_WEB_CHROME_PROFILE_EMAIL` | Preferred profile email |
| `CHATGPT_WEB_CHROME_PATH` | Chrome executable path |

## Sessions

Session files are stored under `sessions/<id>.json`.

v1 stores:
- selected profile path/email
- conversation URL when available
- prompt/response history
- timestamps
