# AI Agent Bootstrap Guide

This document is written for an AI agent setting up this repository on a new machine.

Goal: clone `baoyu-skills`, install all repository skills as user-level Codex skills, verify that Codex can load them, and avoid keeping stale legacy copies.

## Scope

Use this guide when the user says:

- "move this project to another machine"
- "install these skills for Codex"
- "make the skills available globally"
- "remove old baoyu skills and use this repo"

Default target runtime: Codex CLI.

Other runtimes may use the same `skills/<skill-name>/SKILL.md` directories, but their installation mechanism can differ.

## Preconditions

Check these first:

```bash
command -v git
command -v node
command -v npx
command -v codex || true
```

Many script-backed skills run through `bun` or `npx -y bun`. If native `bun` is absent, `npx -y bun` is acceptable:

```bash
command -v bun || npx -y bun --version
```

Chrome is required for browser/CDP-backed skills such as:

- `baoyu-danger-gemini-web`
- `baoyu-danger-chatgpt-web`
- `baoyu-danger-x-to-markdown`
- `baoyu-url-to-markdown`
- `baoyu-post-to-x`
- `baoyu-post-to-wechat`
- `baoyu-post-to-weibo`

## Clone Or Update The Repository

Prefer the user's fork if they have one. For this machine/user, the fork is:

```bash
mkdir -p "$HOME/github"
cd "$HOME/github"

if [ ! -d "baoyu-skills/.git" ]; then
  git clone "https://github.com/redyuan43/baoyu-skills.git" "baoyu-skills"
fi

cd "$HOME/github/baoyu-skills"
git fetch --all --prune
git status --short
```

If the user wants the upstream repository instead, use:

```bash
git clone "https://github.com/JimLiu/baoyu-skills.git" "baoyu-skills"
```

## Install All Skills For Codex

Recommended installation shape: symlink every `skills/baoyu-*` directory into `~/.codex/skills`.

This keeps the installed skills tied to the checked-out repository, so future `git pull` updates are visible after restarting Codex.

```bash
set -euo pipefail

repo="$HOME/github/baoyu-skills"
codex_skills="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$codex_skills"

find "$repo/skills" -maxdepth 1 -mindepth 1 -type d -name 'baoyu-*' -print0 \
  | sort -z \
  | while IFS= read -r -d '' src; do
      name="$(basename "$src")"
      dest="$codex_skills/$name"
      if [ -e "$dest" ] || [ -L "$dest" ]; then
        rm -rf "$dest"
      fi
      ln -s "$src" "$dest"
    done
```

## Optional: Remove Legacy Copies

Only do this if the user explicitly wants to stop loading old `baoyu-*` skills from legacy locations.

This removes stale copies under `~/.agents/skills` while keeping non-baoyu skills intact.

```bash
set -euo pipefail

legacy="$HOME/.agents/skills"

if [ -d "$legacy" ]; then
  find "$legacy" -maxdepth 1 -mindepth 1 \( -name 'baoyu-*' -o -name 'release-skills' \) -print -exec rm -rf {} +
fi
```

## Verify Installation

Run:

```bash
find "${CODEX_HOME:-$HOME/.codex}/skills" -maxdepth 1 -mindepth 1 -name 'baoyu-*' -printf '%f -> %l\n' | sort
```

Expected:

- Every listed path points to `$HOME/github/baoyu-skills/skills/<skill-name>`.
- `baoyu-danger-chatgpt-web` is present if the current fork contains the Codex ChatGPT Web skill.
- Legacy check is empty if old copies were removed:

```bash
find "$HOME/.agents/skills" -maxdepth 1 -mindepth 1 \( -name 'baoyu-*' -o -name 'release-skills' \) -printf '%f -> %l\n' 2>/dev/null | sort
```

## Restart Codex

Codex reads available skills at session startup. After installing or changing skill paths, restart Codex before testing.

## Quick Smoke Tests

After restart, ask Codex to list or use a skill. Good minimal checks:

```text
$baoyu-danger-gemini-web 你好
```

```text
$baoyu-comic 把“边缘 AI 工作站”解释成 4 格漫画分镜，不要生成图片，只生成分镜
```

```text
$baoyu-danger-chatgpt-web --list-profiles
```

For image workflows in Codex:

- Use consumer skills such as `baoyu-comic`, `baoyu-infographic`, `baoyu-slide-deck` for planning and prompt preparation.
- Use Codex built-in `$imagegen` for final bitmap output when requested.
- Use `baoyu-danger-gemini-web` for Gemini Web text/image generation and web/HTML drafts.
- Do not default to `baoyu-imagine` for Codex unless the user explicitly wants API/provider-based generation.

## Troubleshooting

If a skill does not appear:

1. Confirm the symlink exists under `~/.codex/skills`.
2. Confirm the target contains `SKILL.md`.
3. Restart Codex.
4. Check whether another runtime is loading `~/.agents/skills` instead of `~/.codex/skills`.

If a browser-backed skill fails:

1. Confirm Chrome is installed.
2. Run the skill's `--login` flow if available.
3. Avoid killing all Chrome processes. Only stop browser instances launched for CDP automation when the skill documentation says to.

If dependencies fail:

```bash
cd "$HOME/github/baoyu-skills"
npx -y bun --version
```

Then run the exact command documented in that skill's `SKILL.md`.

## Agent Safety Rules

- Do not delete user files outside skill installation directories.
- Do not run `git reset --hard` unless the user explicitly requests it.
- Do not push to upstream `JimLiu/baoyu-skills` unless the user explicitly asks and has permission.
- Prefer pushing user changes to the user's fork.
- Always show the target repository and branch before pushing.
