# AI pattern catalog

Pre-planned diagram starters for recurring multi-agent coordination shapes — research orchestrators, message buses, shared-state stores, agent-with-skills composition. Each file here is a thin wrapper around one specific pattern: a one-line description, the diagram type baoyu prefers for it, the ramp palette that works, a reference mermaid block (industry-standard shorthand you can sanity-check against), and a pre-cooked baoyu SVG plan that saves you a planning pass.

## How to use this directory

1. **Check the index below** for a pattern name matching the user's topic. Exact matches are rare — usually the user says *"agents coordinating through a shared channel"* and you recognize *message-bus*, or *"agents building on each other's findings in a store"* and you recognize *shared-state*.
2. **If a pattern matches**, open its file and read end-to-end. The mermaid block tells you *what* to draw (structurally), the baoyu SVG plan tells you *how* (coordinates, widths, arrow routing).
3. **If no pattern matches**, fall back to the normal Step 4 planning flow in `SKILL.md`. Do not force a near-miss — two coordination patterns that share a surface name often have different topologies (message bus ≠ shared state, even though both put a central element between agents).

The mermaid reference is **authoritative for structure**, not for rendering. Never emit mermaid as the final output; always convert to a hand-written baoyu SVG using the plan in the same file.

## Scope

This directory covers **AI-system topologies**, not generic software patterns. For flowchart / sequence / structural / illustrative / class diagram techniques, stay in the top-level references files. If an AI-system pattern needs a technique that isn't documented in those files yet, add the technique upstream — not here.

## Index

| Pattern                  | Default type    | One-line hook                                                                                       |
|--------------------------|-----------------|-----------------------------------------------------------------------------------------------------|
| [multi-agent-research](multi-agent-research.md)   | flowchart     | Lead agent + memory sidecar + parallel search subagents (each looping) + citation stage (Anthropic) |
| [message-bus](message-bus.md)                     | structural    | N agents coordinate via a central publish/subscribe bar — no direct agent-to-agent edges            |
| [shared-state](shared-state.md)                   | structural    | N peer agents read/write a central store — no orchestrator, findings immediately visible to all     |
| [agent-skills](agent-skills.md)                   | structural    | Agent loop + runtime + MCP servers (left) + skills library on filesystem (right) — composition view |
| [contextual-retrieval](contextual-retrieval.md)   | flowchart     | Contextualizer LLM prepends 50–100 tokens to each chunk → dual-track (embedding + BM25) + rank fusion |

## Adding a new pattern

Keep each file under ~80 lines. A pattern file has six sections in this order:

1. **Name + 1-line description**
2. **Default diagram type** — plus when to pick an alternate type
3. **Palette** — which ramps, tied to which roles
4. **Sub-pattern** — the specific section in a top-level reference file that does the heavy lifting
5. **Mermaid reference** — the canonical industry-standard sketch, in a ` ```mermaid` block
6. **Baoyu SVG plan** — node list with widths, arrow list, viewBox dimensions, any gotchas

When you add a new pattern, update this README's index table in the same commit. Do not create orphan files — if you can't write a one-line hook for the index, the pattern isn't well-defined yet.
