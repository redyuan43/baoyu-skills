# Codex CLI Setup

This repository can be used from Codex CLI as a set of user-level global skills.

## Recommended setup

1. Clone this repository to a stable path, for example `~/github/baoyu-skills`
2. Register only the skills you want in `~/.codex/config.toml`
3. Keep them enabled as global personal skills

Example:

```toml
[[skills.config]]
path = "/home/yourname/github/baoyu-skills/skills/baoyu-cover-image"
enabled = true

[[skills.config]]
path = "/home/yourname/github/baoyu-skills/skills/baoyu-danger-gemini-web"
enabled = true
```

Codex also documents global and repo-local skills conceptually, but explicit `skills.config` registration is the least ambiguous path when you mainly use Codex CLI on one machine.

## Visual output routing

For Codex, treat visual work as a two-stage workflow:

1. Prepare the content first: summarize the project, build the outline, write prompts, and collect any reference images.
2. Then choose the final terminal:
   - **Bitmap image terminal**: ask once between Codex built-in `$imagegen` and local `baoyu-danger-gemini-web`
   - **Web / HTML terminal**: use `baoyu-danger-gemini-web` to draft the HTML, then let Codex do the smallest possible cleanup and file placement

This means Codex work should not default to the OpenAI API path just because `gpt-image-2` exists there as well.

## Bitmap image terminal

Use this path when the final deliverable is a cover image, infographic, comic page, image-card series, slide image, or other raster visual.

Ask the user which rendering backend to use when the current request does not already name one:

- Codex built-in `$imagegen`
- `baoyu-danger-gemini-web`

In Codex, set `preferred_image_backend: ask` for visual skills if you want that question every run.

Example:

```text
$imagegen Create a landing-page hero illustration with a warm editorial style.
```

```text
/baoyu-danger-gemini-web --prompt "A cute cat in watercolor" --image cat.png
```

## Web / HTML terminal

Use this path when the final deliverable is a landing page, project page, webpage mockup, or a web adaptation of a visual skill's output.

Workflow:

1. Reuse the same preparation layer: summary, outline, prompt files, and reference images
2. Ask Gemini Web to generate the HTML directly
3. Let Codex do minimal cleanup only: remove escaping/code fences, fix broken links or syntax, and save the final file

Example:

```bash
/baoyu-danger-gemini-web --prompt "Create a polished landing page HTML for baoyu-skills" --reference mockup.png
```

## `baoyu-imagine` in Codex

Keep `baoyu-imagine` out of the Codex main path. In Codex, treat it as an optional API backend for:

- non-Codex runtimes
- explicit provider/API testing
- batch jobs
- provider-specific controls that do not fit `$imagegen` or Gemini Web

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
