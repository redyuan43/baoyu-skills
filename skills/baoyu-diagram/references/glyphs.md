# Glyph Library

Small, reusable SVG primitives that several sub-patterns draw *inside* their boxes or *on top of* their connectors: status circles on an arrow, checkboxes in a TODO list, queue slots inside a worker box, a document icon inside a shared-state store, a labeled annotation circle halfway along an arrow.

These are intentionally *shared across types*. A status circle belongs in a flowchart (Generator-Verifier) and also in a structural advisor diagram. A checkbox belongs in a structural "TODOs vs Tasks" comparison and also in an illustrative "agent task list" subject. Keeping them in one place keeps the visual vocabulary consistent across diagrams.

## Hard rules

Every glyph in this file obeys **all** of the design system's hard rules (`design-system.md` → "Hard rules"). In particular:

- **SVG primitives only.** Every glyph is composed of `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<path>`, or `<text>`. No `<image>`, no `<foreignObject>`, no emoji characters.
- **No hardcoded colors on text or strokes that need dark-mode response.** Every glyph uses the existing CSS classes (`c-{ramp}`, `arr-{ramp}`, `arr-alt`, `box`, `t`/`th`/`ts`). This means both light and dark mode are handled automatically — zero template changes required.
- **No rotated text.** (Glyphs are small enough that horizontal text always fits.)
- **Sentence case** on any labels.

If a new glyph seems to require a hardcoded color or a new CSS rule, stop and reconsider — the shape is probably wrong, or it belongs in one of the existing ramps.

## Coordinate convention

Every glyph block below is drawn with its **top-left anchor at (0, 0)**, then wrapped in a `<g transform="translate(x, y)">` to place it in the diagram. The glyph's *bounding box width × height* is listed in each subsection so you can reserve space and pick `x, y` from the parent layout.

```svg
<!-- Glyph in situ: place at (340, 200) -->
<g transform="translate(340, 200)">
  <!-- glyph body at origin (0, 0) -->
</g>
```

All `x`/`y`/`cx`/`cy`/`d` values in the snippets below are **relative to the glyph origin**, not the diagram origin. Don't edit them — just translate the wrapper group.

---

## Status circles

A circle placed on or near an arrow to tag the outcome of a decision. Three variants: ✓ success, ✗ failure, ● in-progress.

**Bounding box.** 24 × 24. Place the center of the circle at `(12, 12)` inside the glyph origin. When placed on a diagram, translate so that `(12, 12)` lands at the desired anchor — usually the midpoint of an arrow or just past a gate node.

**Where they're used.**
- Flowchart (Generator-Verifier, Agent Teams, gate patterns): tag the two branches out of a verifier or judge node.
- Structural (advisor, TODOs→Tasks): mark individual task outcomes inside a state box.

**Color rules.** Status carries semantic color — not negotiable:
- `check` → `c-green` / `arr-green` (accept, pass, done)
- `x` → `c-coral` / `arr-coral` (reject, fail, blocked)
- `dot` → `c-amber` / `arr-amber` (in-progress, busy, running)

**Dark mode.** All three use the existing ramp classes, so both the circle fill and the inner stroke invert automatically.

### status-circle-check

```svg
<g transform="translate(x, y)">
  <circle class="c-green" cx="12" cy="12" r="12"/>
  <path class="arr-green" d="M6 12.5 L10.5 17 L18 8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>
```

### status-circle-x

```svg
<g transform="translate(x, y)">
  <circle class="c-coral" cx="12" cy="12" r="12"/>
  <path class="arr-coral" d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5" stroke-linecap="round" fill="none"/>
</g>
```

### status-circle-dot

```svg
<g transform="translate(x, y)">
  <circle class="c-amber" cx="12" cy="12" r="12"/>
  <circle class="c-amber" cx="12" cy="12" r="4"/>
</g>
```

The nested small circle shares the ramp but is visually distinct because it sits on top of its own border stroke, reading as a filled dot against the paler ring.

### Placement on an arrow

A status circle placed *on* an arrow replaces that arrow's tail:

```
        status-circle-check (center at x=360, y=160)
                 │
(start)────arrow 1──→ ◎ ────arrow 2──→(end)
```

Split the original arrow into two segments, both with `marker-end="url(#arrow)"`. The circle sits in the gap. Arrow 1 stops at `circle_cx − 14` (2px before the circle border). Arrow 2 starts at `circle_cx + 14`.

**Pitfall.** Don't layer the circle on top of a single continuous line — the arrow renders behind the circle and looks as if it pierces straight through. Always split into two segments.

---

## Checkboxes

A 14 × 14 checkbox glyph for task lists. Two variants: checked (filled green with check) and empty (neutral outline).

**Bounding box.** 14 × 14.

**Where they're used.**
- Structural (TODOs → Tasks comparison, checklist interiors inside a subsystem container): one per task row.
- Illustrative (task list subject, sparingly): only if the task list is the whole mechanism being shown.

**Color rules.**
- `checked` → `c-green` (task done)
- `empty` → `c-gray` (task pending)

For an "in-progress" task, substitute `status-circle-dot` at half scale, or just leave it empty. Don't invent a third checkbox color.

### checkbox-checked

```svg
<g transform="translate(x, y)">
  <rect class="c-green" x="0" y="0" width="14" height="14" rx="2"/>
  <path class="arr-green" d="M3 7.5 L6 10.5 L11 5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>
```

### checkbox-empty

```svg
<g transform="translate(x, y)">
  <rect class="c-gray" x="0" y="0" width="14" height="14" rx="2"/>
</g>
```

### Checklist rows

A row of checklist items is laid out with the checkbox on the left and a 14px `t`-class label to its right:

```svg
<g transform="translate(40, 120)">
  <g transform="translate(0, 0)">
    <rect class="c-green" x="0" y="0" width="14" height="14" rx="2"/>
    <path class="arr-green" d="M3 7.5 L6 10.5 L11 5" stroke-linecap="round" fill="none"/>
  </g>
  <text class="t" x="22" y="11">Draft the outline</text>
</g>
```

Row pitch: 22px (14px checkbox height + 8px vertical gap). Label `y = checkbox_y + 11` for vertical centering against the 14px box.

**Row width budget.** Inside a 315-wide subsystem container with 20px interior padding, the label has `315 − 20 − 20 − 14 − 8 = 253` px of width. At 8px/char (14px Latin) that caps the label at **~31 characters**; at 15px/char (CJK) that caps at **~16 characters**. Longer labels must be truncated or wrapped across two rows.

---

## Queue slots

A row of small filled/empty squares that represents a work queue or a buffer. Not to be confused with checklists — queue slots are *undifferentiated items*, checklists are *named tasks*.

**Bounding box per slot.** 16 × 16. Row pitch: 20 (16 + 4 gap). Typical row: 6–8 slots max per row.

**Where they're used.**
- Flowchart (Agent Teams, task-queue hub node): show the queue of pending work *inside* a source node.
- Structural (any box representing a worker pool with a buffer): same purpose, different frame.

**Color rules.**
- `filled` → `c-amber` (work waiting in queue)
- `empty` → `c-gray` (slot available)

### queue-slot-filled

```svg
<rect class="c-amber" x="x" y="y" width="16" height="16" rx="2"/>
```

### queue-slot-empty

```svg
<rect class="c-gray" x="x" y="y" width="16" height="16" rx="2"/>
```

### Queue row inside a box

For a two-line box (`title + queue row`), the queue row goes at `rect_y + 28` (below the title baseline), starting at `rect_x + 12`:

```svg
<g>
  <rect class="c-gray" x="60" y="120" width="160" height="52" rx="6"/>
  <text class="th" x="140" y="138" text-anchor="middle">Task queue</text>
  <rect class="c-amber" x="72"  y="148" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="92"  y="148" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="112" y="148" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="132" y="148" width="16" height="16" rx="2"/>
  <rect class="c-gray"  x="152" y="148" width="16" height="16" rx="2"/>
  <rect class="c-gray"  x="172" y="148" width="16" height="16" rx="2"/>
</g>
```

Box height for this variant: **52px** (title row + queue row + vertical padding). Don't reuse the default 44 or 56 heights — the queue row needs its own budget.

**Row width budget.** `slots × 20 − 4 ≤ rect_width − 24`. For a 160-wide rect that's `(160 − 24 + 4) / 20 = 7` slots maximum. Above 7, split into two rows or widen the host rect.

---

## Document & terminal icons

Decorative icons that go *inside* a box (usually illustrative or structural) to hint at what kind of thing the box represents: a document store, a terminal/computer, a code script. These are **not allowed in flowchart or sequence diagrams** — label the rect instead.

**Why only illustrative / structural.** In a flowchart, the reader is tracking sequence; an icon is visual noise competing with the arrow flow. In a structural diagram showing containment, an icon inside a container cell reinforces *what that cell is* and doesn't interrupt any flow. In an illustrative diagram the icon *is* part of the intuition (a document glyph inside a "Shared state" box tells you it's storing artifacts, not messages).

### doc-icon

**Bounding box.** 24 × 28. Place it in the lower half of a box that's at least 80 tall.

```svg
<g transform="translate(x, y)">
  <path class="arr" d="M2 2 L16 2 L22 8 L22 26 L2 26 Z" fill="none"/>
  <path class="arr" d="M16 2 L16 8 L22 8" fill="none"/>
  <line class="arr" x1="6"  y1="14" x2="18" y2="14"/>
  <line class="arr" x1="6"  y1="18" x2="18" y2="18"/>
  <line class="arr" x1="6"  y1="22" x2="14" y2="22"/>
</g>
```

The outer silhouette is a rectangle with a folded corner; the three short horizontal lines suggest paragraphs.

**Placement inside a box.** For a box at `(box_x, box_y)` with width `box_w` and height `box_h ≥ 80`, place the icon's origin at `(box_x + box_w/2 − 12, box_y + box_h − 36)`. This centers horizontally and leaves 8px below.

### terminal-icon

**Bounding box.** 24 × 24.

```svg
<g transform="translate(x, y)">
  <rect class="box" x="0" y="0" width="24" height="24" rx="2"/>
  <path class="arr" d="M5 9 L9 12 L5 15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line class="arr" x1="11" y1="17" x2="19" y2="17"/>
</g>
```

A framed box containing a `>` prompt chevron and a short input line.

**Dark mode.** The `box` class provides a contrast frame that reads correctly in both modes; the inner chevron and cursor line use `arr` which also inverts.

### script-icon

**Not a fixed-size glyph.** The "script" pattern in image #12 (Programmatic tool calling) is a tall rect that contains multiple horizontal colored dividers and a `{ }` label at the top, representing an inline script that wraps several tool calls. Because the rect's height depends on how many tool calls it wraps, the script-icon is parameterized — build it inline using this recipe:

```svg
<g>
  <!-- outer script rect: height depends on wrapped-call count -->
  <rect class="c-gray" x="script_x" y="script_y" width="120" height="script_h" rx="6"/>
  <text class="th" x="script_x + 60" y="script_y + 22" text-anchor="middle">{ }</text>
  <line class="arr" x1="script_x + 16" y1="script_y + 40" x2="script_x + 104" y2="script_y + 40"/>
  <!-- one colored band per wrapped call: -->
  <rect class="c-teal"   x="script_x + 12" y="band1_y" width="96" height="28" rx="4"/>
  <rect class="c-purple" x="script_x + 12" y="band2_y" width="96" height="28" rx="4"/>
  <rect class="c-amber"  x="script_x + 12" y="band3_y" width="96" height="28" rx="4"/>
</g>
```

`script_h = 48 + N × 36` for N wrapped calls; `bandK_y = script_y + 48 + (K-1) × 36`. See `sequence.md` → "Parallel independent rounds" for the full pattern this participates in.

---

## Code braces

Inline `{ }` as a label on a connector or inside a small label rect to signal "code" or "programmatic" handoff.

```svg
<text class="th" x="x" y="y" text-anchor="middle">{ }</text>
```

**Width estimate.** 14px, ~16 char-px. Treat as 2 chars when budgeting for a rect container.

**Where used.** Only in illustrative or structural diagrams that distinguish "data flow" from "code flow" — usually paired with a `script-icon` or a `c-gray` pill labeled "Programmatic".

---

## Annotation circle on connector

A labeled circle that sits on an arrow to name *the thing that mediates the exchange* — for example, "Skill" sitting on the Claude ↔ Environment arrow in image #13.

**Bounding box.** 64 × 64 around the circle. The inner pill is ~52 × 20.

**Where used.** Illustrative only. This is a "the action on this arrow is X" label, which in a flowchart or sequence would be a simple arrow label — in an illustrative diagram, we promote it to a visual node because the mediator *is* the subject.

```svg
<g transform="translate(x, y)">
  <!-- outer circle uses .box for the neutral background ring -->
  <circle class="box" cx="32" cy="32" r="30"/>
  <!-- inner pill with label, picks up its own ramp -->
  <g class="c-teal">
    <rect x="4" y="22" width="56" height="20" rx="10"/>
    <text class="th" x="32" y="36" text-anchor="middle">Skill</text>
  </g>
</g>
```

**Placement.** Center the glyph on the arrow's midpoint: `translate(arrow_midx − 32, arrow_midy − 32)`. The arrow must be split into two segments on either side of the glyph (same rule as status circles), each stopping 32px before the center.

**Label length.** The inner pill caps at ~8 Latin chars at 14px (`8 × 8 = 64`, minus 8px padding each side, gives ~48px of label room — 6 chars is a comfortable fit; "Skill" at 5 chars is ideal). For CJK, cap at 3 characters.

**Pitfall.** Don't use `c-teal` on the outer circle — that double-fills the ramp and the label pill disappears. Keep the outer ring on `box`, the inner pill on a ramp.

---

## Dashed future-state rect

Used in "TODOs → Tasks" (image #4) to show a task that hasn't been scheduled yet — the node exists in the plan but not in the active DAG.

```svg
<rect class="arr-alt" x="x" y="y" width="w" height="h" rx="6"/>
```

Reuses the existing `arr-alt` class — it already provides `fill: none`, `stroke-width: 1.5`, `stroke-dasharray: 5 4`, and dark-mode stroke override. No inline attributes needed.

**Text inside.** Label with `ts` class (12px, muted) — future-state nodes are always visually demoted relative to active ones:

```svg
<g>
  <rect class="arr-alt" x="200" y="180" width="120" height="44" rx="6"/>
  <text class="ts" x="260" y="205" text-anchor="middle">Task 4</text>
</g>
```

**Pitfall.** Do *not* create a new `.box-future` CSS class. The `arr-alt` class handles it — adding a new class is template bloat.

**Pitfall.** Don't align the dashed rect's center with an active `c-{ramp}` rect's center if their heights differ — the visual baseline looks off. Match the top edge instead, or match the baseline of the label text.

---

## Publish/subscribe arrow pair

Two parallel offset arrows between a node and a bus bar — one labeled "Publish" going down, one labeled "Subscribe" going up. Used in the bus topology pattern (`structural.md` → "Bus topology").

**Not a static glyph.** It's a pair of straight arrows with an 8px horizontal offset between them, each with its own label. Write this inline where you use it:

```svg
<!-- agent_cx is the horizontal center of the agent box;
     bar_y_top and bar_y_bottom are the y-edges of the bus bar;
     agent_y_bottom is the bottom y of the top agent -->
<line class="arr" x1="agent_cx - 8" y1="agent_y_bottom" x2="agent_cx - 8" y2="bar_y_top" marker-end="url(#arrow)"/>
<line class="arr" x1="agent_cx + 8" y1="bar_y_top" x2="agent_cx + 8" y2="agent_y_bottom" marker-end="url(#arrow)"/>
<text class="ts" x="agent_cx - 14" y="(agent_y_bottom + bar_y_top) / 2 + 4" text-anchor="end">Publish</text>
<text class="ts" x="agent_cx + 14" y="(agent_y_bottom + bar_y_top) / 2 + 4">Subscribe</text>
```

The 8px offset is the documented spacing — wider looks like two unrelated arrows, narrower looks like a single fat arrow.

**Label placement.** The two labels go in the gap between the agent and the bar, one flush against the left arrow (anchor `end`) and one flush against the right arrow (anchor `start`). If the agent's bottom and the bar's top are closer than 40px, move the labels to the *side* of the pair rather than between them.

**Color.** Both arrows use `arr` (default gray). If the pattern needs to highlight one specific agent's channel, upgrade that pair to `arr-{ramp}` where `{ramp}` matches the agent's box — but only that one pair, not all of them.

---

## Concept-to-shape conventions

Before drawing any node, decide what shape it should be. baoyu-diagram is a **flat-rect aesthetic** — almost every concept maps to a labeled rectangle. The table below is the canonical lookup so you don't invent a new icon shape inline and so you don't reach for mermaid/plantuml-style iconography that clashes with the design system.

| Concept                    | Use this shape                                         | Notes                                                 |
|----------------------------|--------------------------------------------------------|-------------------------------------------------------|
| User / human / actor       | Labeled rect with `ts` subtitle "(user)" or similar    | No stick figure. In sequence, an actor header rect.    |
| LLM / model                | Labeled rect, optionally `c-teal` or `c-purple`        | No brain icon. Label with the model name.              |
| Agent / orchestrator       | Labeled rect, often the centerpiece of the diagram      | If it's the mechanism's name, use `.title` class for the whole diagram title instead. |
| Tool / function            | Labeled rect; or compact tool card with `tool-card-*` icon in phase-band diagrams | No gear icon in standard diagrams. Phase-band exception: see "Tool card icons" section. |
| API / gateway / endpoint   | Labeled rect                                           | No hexagon. Label with the route or service name.     |
| Memory (short-term)        | Rect with dashed border via `class="arr-alt"` inline   | Dashed = ephemeral. See `svg-template.md` → `.arr-alt`. |
| Memory (long-term) / DB    | Rect with `doc-icon` inside (structural/illustrative)   | No cylinder. In flowchart/sequence, label with "(DB)". |
| Vector store               | Rect labeled with dimensions ("768d") + doc-icon        | No cylinder with grid lines.                          |
| Queue / buffer             | Rect containing `queue-slot-filled` / `-empty` glyphs   | See glyphs → "Queue slots".                           |
| Task list / checklist      | Rect containing `checkbox-checked` / `-empty` rows      | See glyphs → "Checkboxes".                            |
| External service           | Labeled rect inside a dashed-border container           | The dashed container communicates "not ours".        |
| Decision point             | Rotated square (diamond), flowchart only                | See `flowchart.md` → diamond decision nodes.          |
| Process / step             | Rounded rect (`rx="6"`)                                | The default shape. Reach for this first.             |
| Start / End boundary       | Pill (rounded rect with `rx = height/2`)                | See `flowchart.md` → "Pill terminal node". ≤2 per diagram. |
| State in state machine     | Rounded rect with title                                | See `flowchart.md` → "State-machine sub-pattern".     |
| Initial / final state      | Filled 8px circle / 12px hollow circle with inner 8px  | State-machine exception to the "rect only" rule.      |
| Class (UML)                | 3-compartment rect (name / attrs / methods)            | See `class.md`.                                       |

### Rejected shapes — never use these

These shapes look great in mermaid/plantuml/fireworks-style diagrams but break baoyu's flat-rect aesthetic and its dark-mode color contract. If the diagram seems to demand one, the *label* is wrong — fix the label.

- **Stick figure** (for users / actors). Use a labeled rect.
- **Brain glyph** (for LLMs). Use a labeled rect with the model name.
- **Gear / cog glyph** (for tools). Use a labeled rect with the tool name.
- **Cylinder** (for databases). Use a rect with `doc-icon` or a "(DB)" suffix in the label.
- **Cloud silhouette** (for external services). Use a dashed-border container.
- **Disk / drum / tape-reel** (for storage). Same as cylinder — use a rect.
- **Briefcase, folder, envelope, magnifying glass** (for everything else). Use a rect.

The rationale for each: these glyphs all require either hardcoded fills (breaking dark mode), or non-rectangular paths that don't compose with the 44/56 row heights and the `c-{ramp}` stroke conventions, or visual weight that competes with the actual information in the box labels. baoyu's readability comes from consistent typography and color — not from pictograms.

**When in doubt, ask: "does the shape carry information the label doesn't?"** If the answer is no, it's decoration and you should drop it. If yes, the label is missing the information and you should add it.

## Glyph checklist before saving

When you include any glyph in a diagram, verify:

1. **Class check** — every shape in the glyph uses one of `c-{ramp}`, `arr-{ramp}`, `arr`, `arr-alt`, `box`, or a text class (`t`/`th`/`ts`). No inline `fill="#..."` or `stroke="#..."` on anything that needs dark-mode inversion.
2. **Positioning check** — the glyph is wrapped in `<g transform="translate(x, y)">` and the anchor math lands it where the parent layout expects (box center, arrow midpoint, checklist row).
3. **No-collision check** — for status circles and annotation circles, the arrow they sit on has been split into two segments leaving a gap for the glyph, not routed *through* it.
4. **Ramp meaning check** — status colors (`c-green` for pass, `c-coral` for fail, `c-amber` for in-progress) are not overridden by the surrounding diagram's color budget. Status semantics always win over the "≤2 ramps" rule.
5. **Icon scope check** — `doc-icon`, `terminal-icon`, and `script-icon` only appear in illustrative or structural diagrams. A flowchart that wants to show "this is a document" uses the label, not the icon. `tool-card-*` icons only appear inside compact tool cards in phase-band diagrams.

---

## Tool card icons

Small 24 × 24 icons for use **exclusively inside compact tool card nodes** in phase-band diagrams (see `references/flowchart-phase-bands.md`). Each icon supplements—never replaces—the text label on the card. Without the label the icon has no meaning; without the icon the label still works fine.

**Scope rule.** These icons are not allowed in any other diagram type. They require the compact tool card node template below — dropping a tool icon directly into a standard 44px flowchart node looks wrong and breaks the icon-to-card sizing contract.

**Dark-mode rule.** All strokes use `class="arr"` (inherits the template's stroke color). `fill="none"` on any outer shape is safe. No inline hex colors.

**Bounding box:** 24 × 24 for all icons. Place the icon origin so the glyph center lands at the top-center of the card (see compact tool card template below).

---

### icon-scan

Concentric target rings — communicates "scanning / finding".

```svg
<g transform="translate(x, y)">
  <circle class="arr" cx="12" cy="12" r="10" fill="none"/>
  <circle class="arr" cx="12" cy="12" r="6"  fill="none"/>
  <circle class="arr" cx="12" cy="12" r="2"  fill="none"/>
  <line   class="arr" x1="18" y1="6" x2="22" y2="2"/>
</g>
```

The small tick line at the top-right angle reads as "aim" without being a literal crosshair.

---

### icon-search

Document face with text lines — communicates "reading / querying" without using a magnifying glass (which is prohibited as a shape replacement for labels in standard diagrams).

```svg
<g transform="translate(x, y)">
  <rect class="arr" x="2" y="2"  width="20" height="20" rx="2" fill="none"/>
  <line class="arr" x1="5" y1="8"  x2="19" y2="8"/>
  <line class="arr" x1="5" y1="12" x2="19" y2="12"/>
  <line class="arr" x1="5" y1="16" x2="13" y2="16"/>
</g>
```

---

### icon-data

Three vertical bars of different heights — bar chart shape for "data analysis / metrics".

```svg
<g transform="translate(x, y)">
  <line class="arr" x1="2" y1="22" x2="22" y2="22"/>
  <rect class="arr" x="3"  y="14" width="4"  height="8" fill="none"/>
  <rect class="arr" x="10" y="7"  width="4"  height="15" fill="none"/>
  <rect class="arr" x="17" y="10" width="4"  height="12" fill="none"/>
</g>
```

---

### icon-code

Angle brackets with a slash — `</>` pattern for "code / script analysis".

```svg
<g transform="translate(x, y)">
  <path class="arr" d="M8 4 L3 12 L8 20"  fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path class="arr" d="M16 4 L21 12 L16 20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line class="arr" x1="14" y1="5" x2="10" y2="19" stroke-linecap="round"/>
</g>
```

---

### icon-exploit

Lightning bolt — communicates "attack / execution / injection".

```svg
<g transform="translate(x, y)">
  <path class="arr" d="M14 2 L9 12 L13 12 L10 22 L15 11 L11 11 Z" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
</g>
```

---

### icon-callback

Two arrows in a circle (↩ motif) — communicates "callback / round-trip / webhook".

```svg
<g transform="translate(x, y)">
  <path class="arr" d="M4 12 A8 8 0 1 1 12 20" fill="none" stroke-linecap="round"/>
  <path class="arr" d="M8 22 L12 20 L10 16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</g>
```

---

## Compact tool card node template

**Used only in phase-band diagrams.** A 80 × 80 node that shows a 24 × 24 icon above a two-line text label. The icon provides visual differentiation at a glance; the label provides the actual meaning.

**Bounding box:** 80 × 80 (or wider if the label is longer — see sizing rule below).

**Sizing rule:**
```
card_w = max(line1_chars × 7, line2_chars × 7, 24) + 24
card_w = round up to nearest 8, minimum 72, maximum 128
card_h = 80 (fixed)
```

For a single-line label (e.g., "Scan"):
```
card_w = max(4 × 7, 24) + 24 = max(28, 24) + 24 = 52 → round to 72 (minimum)
```

For a two-word label split over two lines (e.g., "Search" / "tool"):
```
card_w = max(6×7, 4×7) + 24 = 42 + 24 = 66 → round to 72 (minimum)
```

For a longer label (e.g., "Code" / "analysis"):
```
card_w = max(4×7, 8×7) + 24 = 56 + 24 = 80 → round to 80
```

**Template (two-line label, 80-wide card):**

```svg
<g class="c-gray" transform="translate(card_x, card_y)">
  <rect x="0" y="0" width="80" height="80" rx="6"/>
  <!-- icon: 24×24, top-center; origin = ((80−24)/2, 10) = (28, 10) -->
  <g transform="translate(28, 10)">
    <!-- paste icon glyph here (icon origin at 0,0) -->
  </g>
  <!-- two-line label: line 1 at y=50, line 2 at y=64 -->
  <text class="ts" x="40" y="50" text-anchor="middle" dominant-baseline="central">Scan</text>
  <text class="ts" x="40" y="64" text-anchor="middle" dominant-baseline="central">tool</text>
</g>
```

For a single-line label (when the full name fits in ≤10 chars):
```svg
  <text class="ts" x="40" y="57" text-anchor="middle" dominant-baseline="central">Scanner</text>
```

**Color rules.**
- Use `c-gray` for all tool cards by default. Color encodes meaning, not tool identity — don't give each tool a different ramp.
- If **one specific tool** is the subject of the diagram (e.g., the exploitation tool that's being analyzed), promote just that one card to a semantic ramp (`c-coral` for attack tools, `c-amber` for analysis tools). All other cards stay `c-gray`.

**Row packing.** Align cards in a horizontal row inside the phase band's main flow zone. The gap between cards is **8px minimum**:

```
row_width = N × card_w + (N−1) × 8
required: row_width ≤ 380   (main flow zone width inside a band)
```

| Cards | card_w | row_width | Fits? |
|-------|--------|-----------|-------|
| 4     | 80     | 352       | ✓     |
| 5     | 72     | 388       | ✗ — use card_w=72 with 6px gap: 5×72+4×6=384 ✓ |
| 6     | 64     | 408       | ✗ — split into two rows of 3             |

To center a row of N cards:
```
row_start_x = band_x + band_padding + (main_flow_w − row_width) / 2
card[i].x   = row_start_x + i × (card_w + gap)
```

---

## Operator icons

Larger icons (32 × 40) for the **left operator column** of a phase-band diagram — the human or AI actor that initiates the operation. These appear once per diagram, outside (to the left of) the phase band containers.

---

### operator-human

A simplified head + shoulders silhouette. 32 × 40.

```svg
<g transform="translate(x, y)">
  <circle class="arr" cx="16" cy="11" r="8" fill="none"/>
  <path   class="arr" d="M2 40 Q2 24 16 24 Q30 24 30 40" fill="none" stroke-linecap="round"/>
</g>
```

Place the icon's origin at `(operator_x, operator_y)`. The icon's visual center is at `(16, 24)`. Add a `ts` label below: `y = operator_y + 44`.

---

### operator-ai

An asterisk-in-circle — six spokes radiating from center, with an outer ring. 32 × 32.

```svg
<g transform="translate(x, y)">
  <circle class="arr" cx="16" cy="16" r="14" fill="none"/>
  <line class="arr" x1="16" y1="4"  x2="16" y2="28"/>
  <line class="arr" x1="4"  y1="16" x2="28" y2="16"/>
  <line class="arr" x1="7"  y1="7"  x2="25" y2="25"/>
  <line class="arr" x1="25" y1="7"  x2="7"  y2="25"/>
</g>
```

For a six-spoke variant (closer to the Anthropic asterisk):
```svg
<g transform="translate(x, y)">
  <circle class="arr" cx="16" cy="16" r="14" fill="none"/>
  <line class="arr" x1="16" y1="3"  x2="16" y2="29"/>
  <line class="arr" x1="4"  y1="10" x2="28" y2="22"/>
  <line class="arr" x1="4"  y1="22" x2="28" y2="10"/>
</g>
```

---

**Placement in a phase-band diagram:**

Both operator icons sit in the left margin at `x=20`, vertically positioned to align with the band they feed into (usually Phase 1):

```
operator-human:  x=20, y=phase1_band_y + (band_h / 2) − 20 − 44 − 16
operator-ai:     x=20, y=phase1_band_y + (band_h / 2) − 16 + 16

label under each: ts at (36, icon_y + icon_h + 8), text-anchor="middle"
```

The stacked human → ai pair is typical (human provides the target; ai runs the operation). Connect them with a short `arr` line, then connect the ai icon to the band's first card with an arrow entering the left edge of the band.

If any check fails, fix the SVG before saving. See `pitfalls.md` entries #19–#28 for the full list of glyph-related failure modes and their fixes.
