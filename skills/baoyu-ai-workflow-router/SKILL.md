---
name: baoyu-ai-workflow-router
description: Routes user requests between Codex local file/webpage generation, ChatGPT Web conversation, and Gemini Web text/image/Deep Research workflows with stable account and session defaults.
version: 0.1.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills#baoyu-ai-workflow-router
    requires:
      anyBins:
        - bun
        - npx
---

# AI Workflow Router

Lightweight routing rules for choosing the right local workflow when the user asks to create images, files, webpages, or continue an external AI conversation.

## Fixed Accounts

- ChatGPT Web: always pass `--profile-email redyuan43@gmail.com`.
- Gemini Web: always pass `--profile-email ivanfeng3333@gmail.com`.
- Treat `ivanfeng3333@gamil.com` as a typo for `ivanfeng3333@gmail.com` when the local Chrome profile confirms the Gmail address.

## Session Policy

Continue the most recent compatible session by default.

- ChatGPT text: `baoyu-danger-chatgpt-web/scripts/main.ts` continues the latest saved ChatGPT session unless `--new-session` is passed.
- Gemini text: `baoyu-danger-gemini-web/scripts/main.ts` continues the latest saved `mode: "text"` session unless `--new-session` is passed.
- Gemini image: `baoyu-danger-gemini-web/scripts/main.ts --image` continues the latest saved `mode: "image"` session unless `--new-session` is passed.
- Gemini Deep Research: `baoyu-danger-gemini-web/scripts/deep-research.ts` continues the latest saved Deep Research session unless `--new-session` is passed.

Only start a fresh external conversation when the user explicitly says "new session", "new conversation", "新对话", "重新开一个对话", or equivalent.

## Output Routing

### Generate Image

Use Gemini Web by default:

```bash
${BUN_X} {repo}/skills/baoyu-danger-gemini-web/scripts/main.ts \
  --profile-email ivanfeng3333@gmail.com \
  --prompt "..." \
  --image "outputs/images/<timestamp>-<slug>.png"
```

If the user does not specify an output path, save to `outputs/images/<timestamp>-<slug>.png`. Do not run image generation automatically when it could consume limited/paid quota unless the user clearly requested image generation.

Do not route through `baoyu-imagine` or `baoyu-image-gen`. Those legacy image-generation paths are deprecated for this workflow because they do not provide the required ChatGPT-backed API path.

### Generate File

Use Codex local file editing. If no path is specified, save under `outputs/files/`.

Ask before writing only when the requested file type, destination, or content boundary is unclear enough that guessing would likely produce the wrong artifact.

### Generate Webpage

Generate a local static webpage by default. If no path is specified, save to:

```text
outputs/web/<timestamp>-<slug>/index.html
```

Do not use ChatGPT Canvas automatically. If the user explicitly asks for Canvas, confirm before attempting UI automation.

### Output Conversation

- If the user names ChatGPT, use `baoyu-danger-chatgpt-web/scripts/main.ts --profile-email redyuan43@gmail.com`.
- If the user names Gemini, use `baoyu-danger-gemini-web/scripts/main.ts --profile-email ivanfeng3333@gmail.com`.
- If external conversation is needed but the entry is not specified, ask which entry to use before sending the prompt.

## Deep Research

Use Gemini Deep Research only when the user explicitly asks for Deep Research, research mode, or equivalent.

```bash
${BUN_X} {repo}/skills/baoyu-danger-gemini-web/scripts/deep-research.ts \
  --profile-email ivanfeng3333@gmail.com \
  --prompt "..."
```

For smoke tests, prefer:

```bash
${BUN_X} {repo}/skills/baoyu-danger-gemini-web/scripts/deep-research.ts \
  --profile-email ivanfeng3333@gmail.com \
  --prompt "..." \
  --no-submit \
  --json
```

## Browser Policy

Prefer reusing an existing Chrome/CDP session and leaving the browser running. Only close browser processes when the user explicitly asks to close them or a script exposes a dedicated close option.

## Ambiguity Policy

Ask a concise clarification when the routing decision would change side effects:

- ChatGPT vs Gemini external conversation
- New conversation vs continuing context
- Canvas vs local webpage
- Paid/limited generation features
- Missing output file type or target path for file generation
