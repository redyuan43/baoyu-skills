# Codex CLI Setup

This repository can be used from Codex CLI as a set of user-level global skills.

## Recommended setup

1. Clone this repository to a stable path, for example `~/github/baoyu-skills`
2. Register only the skills you want in `~/.codex/config.toml`
3. Keep them enabled as global personal skills

Example:

```toml
[[skills.config]]
path = "/home/yourname/github/baoyu-skills/skills/baoyu-imagine"
enabled = true

[[skills.config]]
path = "/home/yourname/github/baoyu-skills/skills/baoyu-danger-gemini-web"
enabled = true
```

Codex also documents global and repo-local skills conceptually, but explicit `skills.config` registration is the least ambiguous path when you mainly use Codex CLI on one machine.

## Image generation routing

Use these two routes deliberately:

- Codex built-in `$imagegen`
  Best for single-image interactive work inside Codex
- `baoyu-imagine`
  Best for explicit provider/model selection, API-key billing, batching, and provider-specific options

Both routes can use `gpt-image-2`, but they are not the same integration path.

## `gpt-image-2` paths

### 1. Codex built-in

Ask Codex naturally or use `$imagegen`.

Examples:

```text
$imagegen Create a landing-page hero illustration with a warm editorial style.
```

```text
Generate a square app icon for a note-taking product. Keep it simple and flat.
```

### 2. OpenAI API via `baoyu-imagine`

Examples:

```bash
/baoyu-imagine --prompt "A warm editorial hero illustration" --image hero.png --provider openai --model gpt-image-2
```

```bash
/baoyu-imagine --prompt "Make this product shot cleaner" --image out.png --provider openai --model gpt-image-2 --ref source.png
```

Requirements:

- `OPENAI_API_KEY` must be set
- Codex/ChatGPT account login does not automatically authorize the OpenAI Images API for this skill

## Gemini Web in Codex

`baoyu-danger-gemini-web` is a local Codex skill for browser-authenticated Gemini Web access.

It currently targets these local workflows:

- text generation
- image generation
- reference-image input
- multi-turn conversations via `--sessionId`
- structured output via `--json`
- cookie refresh via `--login`

Examples:

```bash
/baoyu-danger-gemini-web --prompt "Explain quantum computing simply"
```

```bash
/baoyu-danger-gemini-web --prompt "A cute cat in watercolor" --image cat.png
```

```bash
/baoyu-danger-gemini-web --prompt "Create a variation" --ref source.png --image out.png
```

```bash
/baoyu-danger-gemini-web "Remember 42" --sessionId demo-42
/baoyu-danger-gemini-web "What number?" --sessionId demo-42
```

```bash
/baoyu-danger-gemini-web --login
```

Important constraints:

- this is not an official Google API integration
- first use requires consent for reverse-engineered API usage
- it depends on local browser login state and cookie refresh
- it is not a web UI
- it is not an MCP server
- it is not a Codex app-server integration

## When to use MCP later

If you later want Gemini Web to be callable by remote clients, ChatGPT Apps, or multiple Codex clients over a network boundary, the next step should be an MCP server that wraps the local execution path. That is a different delivery shape from the current local-skill setup.
