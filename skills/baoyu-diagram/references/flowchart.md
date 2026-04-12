# Flowchart

For sequential processes, decision trees, cause-and-effect chains. The classic "what happens when X" / "walk me through Y" diagram. Boxes and arrows.

## When to use

- "Walk me through the process" / "what are the steps"
- Approval workflows, request lifecycles, build pipelines
- "What happens when I click submit"
- State machines with clear transitions
- TCP handshake sequences, auth flows

**When not to use:** if the reader wants to feel *why* something works rather than read the steps, reach for an illustrative diagram instead (see `illustrative.md`). Route on the verb — "what are the training steps" is flowchart, "how does gradient descent work" is illustrative.

## Planning before you write SVG

**Count the nouns first.** Before listing any nodes, count the distinct nouns in the user's prompt. If the prompt names 6+ components ("draw me auth, products, orders, payments, gateway, queue"), **do not try to fit them into one diagram** — you will get overlapping boxes and arrows routed through labels, every time. Decompose up front:

1. A stripped overview diagram with the components only and at most one or two arrows showing the main flow — no fan-outs, no N-to-N meshes.
2. One detail diagram per interesting sub-flow ("what happens when an order is placed"), each with 3–4 nodes and room to breathe.

The user asked for completeness — deliver it across several diagrams, not crammed into one. This is the **proactive** version of the advice; `pitfalls.md#9` catches the same failure retrospectively after you've already laid out too many boxes and run out of width.

Once the decomposition question is settled, plan one diagram at a time:

1. **List the nodes.** 3–5 total. More than 5 and you should either split the diagram or collapse related steps.
2. **For each node, write its full label text.** Title and (optionally) subtitle.
3. **Choose direction.** Top-down is the default for most narratives. Left-to-right works for timelines and short flows. Never mix directions in one diagram.
4. **Pick colors.** Gray for most nodes. One accent color for whatever node is the main character of the story (a decision point, the entry/exit, the piece under discussion). Never rainbow.
5. **Compute box widths** using `layout-math.md`. Every box in the same "tier" (same role) should be the same width for rhythm.
6. **Map out the arrows.** Simple A→B connections when possible. L-bends when a direct line would cross another box.

## Node templates

### Single-line node (44px tall)

Title only. Use when the label is self-explanatory or when space is tight.

```svg
<g class="c-gray">
  <rect x="250" y="40" width="180" height="44" rx="6"/>
  <text class="th" x="340" y="62" text-anchor="middle" dominant-baseline="central">User login</text>
</g>
```

Rules:
- Height is always 44 when the row contains only single-line nodes.
- `text y = rect y + 22` (centered vertically, with `dominant-baseline="central"`).
- `text x = rect x + width/2` with `text-anchor="middle"`.

### Two-line node (56px tall)

Title + subtitle. Use when the title alone doesn't carry enough meaning.

```svg
<g class="c-blue">
  <rect x="250" y="120" width="200" height="56" rx="6"/>
  <text class="th" x="350" y="140" text-anchor="middle" dominant-baseline="central">Login service</text>
  <text class="ts" x="350" y="160" text-anchor="middle" dominant-baseline="central">Validates credentials</text>
</g>
```

Rules:
- Height is 56 whenever the row contains any two-line node (mix single-line and two-line within the same row and the rhythm breaks — match heights).
- Title `text y = rect y + 20`.
- Subtitle `text y = rect y + 40`.
- Subtitle must be ≤ 5 words. If you can't fit your idea in 5 words, it belongs in prose next to the diagram, not in the box.

### Neutral "box" node

For generic boxes with no color emphasis. Uses the `box` class from the template (light gray fill, subtle stroke).

```svg
<rect class="box" x="40" y="40" width="180" height="44" rx="6"/>
<text class="t" x="130" y="62" text-anchor="middle" dominant-baseline="central">Start</text>
```

Use for start, end, and generic steps. This is the default — reach for color only when a specific node deserves the reader's attention.

### Pill terminal node (44px tall)

For **boundary nodes** — external inputs, external outputs, and early-exit terminals. The capsule shape visually distinguishes "where the flow enters/leaves the system" from "what happens inside the system". Same height as a single-line node (44px), but with `rx = height / 2 = 22` to produce a fully rounded capsule.

```svg
<rect class="box" x="40" y="40" width="80" height="44" rx="22"/>
<text class="t" x="80" y="62" text-anchor="middle" dominant-baseline="central">In</text>
```

Or with a color ramp, the same shape inside a `c-{ramp}` group:

```svg
<g class="c-gray">
  <rect x="560" y="40" width="80" height="44" rx="22"/>
  <text class="th" x="600" y="62" text-anchor="middle" dominant-baseline="central">Out</text>
</g>
```

Rules:
- **Only for boundary nodes**: In, Out, Exit, Human, Environment, Stop. Do not use pill shapes for internal steps, decisions, or services — those stay rounded rects (`rx="6"`).
- **Height is always 44**. `rx` must equal `height / 2`. If you change the height, change `rx` to match — a 56px pill with `rx="22"` looks like a lozenge, not a capsule.
- **Width follows the text-width formula** (`label × 8 + 24`), but keep labels to 1–2 words. A pill with "Request received" inside it reads as a button, not a terminal.
- **Default neutral**: use the `box` class. Reach for a color ramp only when the terminal carries meaning — the active input of a highlighted pipeline, the success output of a gate, etc.
- **At most 2 pills per diagram**. More than that and the capsules start to compete with the flowchart boxes for the reader's attention. The pill is meant to be a visual *anchor*, not a pattern.

## Connector templates

### Straight connector

When source and target share an x (vertical flow) or a y (horizontal flow):

```svg
<line x1="340" y1="84" x2="340" y2="120" class="arr" marker-end="url(#arrow)"/>
```

Leave a 10px gap between the arrow endpoint and the target box's edge so the arrowhead doesn't touch the stroke.

### L-bend connector

When the direct line would cross an unrelated box:

```svg
<path d="M 160 84 L 160 102 L 340 102 L 340 120" class="arr" fill="none" marker-end="url(#arrow)"/>
```

Pick the bend coordinate (102 here) so the horizontal segment runs cleanly through the gap between rows. Double-check that the horizontal segment doesn't cross another box — if it does, you need a three-bend route or a different layout.

### Dashed "returns to" indicator for a loop

Instead of drawing a literal ring for a cycle, label the endpoint with a small return glyph:

```svg
<text class="ts" x="340" y="320" text-anchor="middle">↻ returns to start</text>
```

This is cleaner than trying to route a physical arrow from the bottom box back to the top box around the entire layout.

## Layout patterns

**Cycles: your instinct will be a ring. Resist it.** If the last stage feeds back to the first (Krebs cycle, event loop, GC mark-and-sweep, TCP retransmit), your first instinct will be to arrange the stages around a circle with arrows on the outside. Don't. Every spacing rule in this skill is Cartesian — there is no collision check for "input box orbits stage box on a ring" — so ring layouts ship with labels sitting on the ring line, satellite boxes overlapping the stages they feed, and tangential arrows pointing at nothing. Lay the stages out linearly (horizontal or vertical) and convey the loop with the `↻ returns to start` glyph described under "Dashed 'returns to' indicator for a loop" above, or with a single curved return arrow along the margin. The loop is conveyed by the return marker, not by literal ring geometry. `pitfalls.md#10` catches this retrospectively — this note is here so you don't reach for the ring in the first place.

### Linear top-down (the default)

Four single-line boxes centered at x=250, heights aligned, spaced 60px apart vertically:

```
y=40   [  Node 1  ]   height 44, y ends at 84
y=120  [  Node 2  ]   (60px gap from y=84)
y=200  [  Node 3  ]
y=280  [  Node 4  ]
```

Arrows at y=84→120, y=164→200, y=244→280 (using 10px arrow-to-box gap), each with a length of 26px.

### Horizontal timeline

Four nodes in a row, centered in the 600px usable width:

```
  x=50        x=200       x=350       x=500
 [Node 1] →  [Node 2] →  [Node 3] →  [Node 4]
```

Width per box: 130px. Gap: 20px. Total: 4×130 + 3×20 = 580. Centered offset: 40 + (600−580)/2 = 50. Arrows go between `x = x_i + 130 + 5` and `x = x_{i+1} - 5`.

### Branching decision

A single entry box at the top, two or three children below fanning out. Use a single bend point so the arrows meet cleanly:

```
        [ Decision ]
             |
    +--------+--------+
    |        |        |
[ Yes ]  [ Maybe ]  [ No ]
```

Compute the fan midpoint as the horizontal center of the three children. Draw three arrows from the decision box to each child, bending at a common ymid.

### Gate (pass / fail split)

A variant of branching decision where one outbound arrow is the **primary** flow and the other is an **alternative** exit. Use a solid arrow for Pass (continues into the main pipeline) and a dashed `.arr-alt` arrow for Fail (routes to an exit terminal). Both arrows get a short 1–3 word label.

```
  [ In ] → [ LLM Call 1 ] → [ Gate ] --Pass-→ [ LLM Call 2 ] → [ LLM Call 3 ] → [ Out ]
                                   \--Fail (dashed)-→ [ Exit ]
```

Pills on `In`, `Out`, and `Exit`; rounded rects on the LLM calls. Gate takes a color ramp (purple is the convention for a judge/evaluator) so the decision point stands out. Route the Fail arrow as a downward L-bend into a lower row, with the Exit pill right-aligned or below the Gate. See the Gate worked example below.

### Fan-out + aggregator (simple mode)

When N branches run in parallel from a single hub and their results flow into a single aggregator, lay them out as a horizontal row between two single boxes. This is the simple-mode equivalent of the poster flowchart's fan-out + judge pattern — same shape, no title / eyebrow / loop rail / annotation column.

Three variants, same skeleton:

| Variant          | Hub label           | Branch arrows        | Aggregator label | When to use                                                 |
|------------------|---------------------|----------------------|------------------|-------------------------------------------------------------|
| **Parallelization** | `In` (pill)       | all solid            | `Aggregator`     | All N branches run; results merged                          |
| **Router**        | `LLM Call Router`  | **1 solid, N−1 dashed** | `Out` (pill)     | Exactly 1 branch runs per invocation; dashed = other options |
| **Orchestrator**  | `Orchestrator`      | all dashed           | `Synthesizer`    | Orchestrator dynamically chooses a subset; dashed = "maybe"   |

Suggested coordinates for 3 branches, each 160 wide:

```
viewBox         0 0 680 340
In/hub (pill)   x=60,  y=140, w=80,  h=44           center at (100, 162)
Branch row y    = 140 (same tier as hub)
Branch 1 box    x=175, y=140, w=160, h=44           center (255, 162)
Branch 2 box    x=175, y=200, w=160, h=44           center (255, 222)
Branch 3 box    x=175, y=260, w=160, h=44           center (255, 282)

Hub → Branch 1  L-bend: (140, 162) → (155, 162) → (175, 162) ... straight
Hub → Branch 2  L-bend: (100, 162) → (100, 222) → (175, 222)
Hub → Branch 3  L-bend: (100, 162) → (100, 282) → (175, 282)

Branch 1 → Aggregator  straight right: (335, 162) → (365, 162) ... merge channel
Branch 2 → Aggregator  L-bend:        (335, 222) → (355, 222) → (355, 162) → (365, 162)
Branch 3 → Aggregator  L-bend:        (335, 282) → (355, 282) → (355, 162) → (365, 162)

Aggregator pill x=365, y=140, w=160, h=44           center (445, 162)
Out pill        x=560, y=140, w=80,  h=44           center (600, 162)
Aggregator → Out  straight: (525, 162) → (550, 162)
```

For the **router variant**, one branch arrow stays `class="arr"` and the other two use `class="arr-alt"`. Same for the return half — the selected branch's arrow into the aggregator is solid, the others dashed. The visual says "at runtime, one path lights up".

The hub and aggregator typically get a **purple** ramp (they are the control points). Branches stay gray unless a specific branch carries meaning.

**Do not upgrade this into a poster flowchart** unless ≥3 of the poster triggers in the "Poster flowchart pattern" section apply — the upgrade criteria are title + phases + loop + annotations, not "has fan-out". A standalone router / parallelization diagram is at its best as a 5–7 node simple flowchart.

## Rich flowchart sub-patterns

Four optional sub-patterns that a simple or poster flowchart can drop into individual pieces of the layout: a loop container that frames the whole diagram, status circles on decision branches, queue glyphs inside a box, and a vertical fan-out variant. Each is designed to co-exist with the patterns above — you can use a loop container around a vertical fan-out that contains queue-glyph nodes and emits status-circle-tagged arrows, and every individual rule still holds.

### Loop container

A rounded outer rect, captioned with a title and subtitle, that wraps the whole flowchart to signal "this entire thing is a loop" or "this is a named subsystem". Used in Generator-Verifier (image #2) and Agent Teams (image #6) where the diagram is *the* loop body, not one phase inside a larger poster.

**When to reach for it.** If the whole flowchart represents a single named mechanism that the reader should remember as one thing — Generator-Verifier, a worker-pool protocol, a retry loop — and you're not already in poster mode. If you've already committed to poster mode, use eyebrow-divided phases instead; nesting a loop container inside a poster layout is over-dressed.

**Geometry.**

| Element            | Coordinates                                               |
|--------------------|-----------------------------------------------------------|
| Container rect     | `x=20 y=40 w=640 h=H−60 rx=20`, class `box`               |
| Container title    | `(340, 72)`, class `th`, `text-anchor="middle"`           |
| Container subtitle | `(340, 92)`, class `ts`, `text-anchor="middle"`           |
| First inner box    | `y ≥ 116` (gives the title a 24px buffer above the inner flow) |
| Inner safe area    | `x ∈ [40, 620]` (20px interior padding on each side)      |

The container is a single `box`-class rect — its stroke is subtle in both modes and doesn't fight for attention. The title and subtitle sit inside the container, aligned to the container's horizontal center. Interior boxes follow normal simple-flowchart geometry, just shifted so the first row's top lands at `y=116` instead of `y=40`.

**viewBox budget.** The container adds roughly 76px to the top (title + subtitle + padding) and 20px to the bottom (interior padding) — build the inner flow normally, then `H = inner_bottom + 40`. Don't forget to recompute the container's `h` attribute to match.

**Mixing with the normal 680 canvas.** The container shrinks the usable width from 600 to 580 (20..620 interior, minus the 20px interior padding each side). If your inner flow was designed at the full 600 budget and no longer fits, either widen nothing and recenter at x=320 instead of x=340, or accept a slightly narrower inner layout.

**Color.** The container itself is always the neutral `box` class — never a ramp — so the interior nodes can still use ramps without double-coloring. If the mechanism has a clear *owner* (e.g., "the verifier's loop"), you can add a small colored pill-label at the container's top-left to tag ownership, but don't tint the whole container.

**Dashed "until X" caption.** If the loop has a termination mechanic ("loop until verifier accepts", "loop until streak = 2"), write it as a `ts` subtitle of the container — that's what the subtitle slot is for. Don't add a separate `↻` marker inside the container when the whole container *is* the loop.

```svg
<!-- Container -->
<rect class="box" x="20" y="40" width="640" height="360" rx="20"/>
<text class="th" x="340" y="72" text-anchor="middle">Generator-verifier</text>
<text class="ts" x="340" y="92" text-anchor="middle">Loops until the verifier accepts</text>

<!-- Inner flow starts at y=116 -->
<g class="c-purple">
  <rect x="80"  y="180" width="160" height="56" rx="6"/>
  <text class="th" x="160" y="200" text-anchor="middle">Generator</text>
  <text class="ts" x="160" y="220" text-anchor="middle">Proposes candidate</text>
</g>
<!-- … verifier node, status circles, return arrow … -->
```

### Status-circle junctions

A decision branch tagged with a visible status circle (✓ / ✗ / ●) from `glyphs.md` instead of a bare `Pass` / `Fail` label. Used when the semantics of the branch are *binary outcomes of a judge*, not just control-flow alternatives.

**When to prefer status circles over the Gate pattern's text labels.** Status circles work when each branch carries a single-word outcome (accept / reject / done / blocked) and no additional condition text. The Gate pattern from "Gate (pass / fail split)" above stays the default for conditions that need more than one word (*"retry if rate-limited"*, *"escalate if amount > $10k"*) — don't try to cram that into a glyph.

**Geometry — replacing a Gate's two arrows.** Start from the existing Gate worked example. Instead of labeling the two outbound arrows with text, split each arrow at a point 14px before its target and place a status-circle glyph in the gap:

```
  [ Judge ] ──arr──→ ◎✓ ──arr──→ [ Next stage ]
              \
               ──arr-alt──→ ◎✗ ──arr-alt──→ [ Exit ]
```

- Accept branch: solid arrow + `status-circle-check` (green) + solid arrow.
- Reject branch: dashed `arr-alt` arrow + `status-circle-x` (coral) + dashed `arr-alt` arrow.
- In-progress branch (rare — use only when the judge returns "still thinking"): solid arrow + `status-circle-dot` (amber) + solid arrow looping back.

Each arrow segment stops 14px before the status-circle center (the glyph's radius is 12, so 14 gives a 2px visual gap between the arrowhead and the circle's border).

**Status circle anchor math.** For a branch from source `(sx, sy)` to target `(tx, ty)` where the branch would normally be a straight arrow, place the status circle's **center** at `(cx, cy)` = the arrow's midpoint. Split the arrow:

```svg
<!-- arrow segment 1: source → status circle -->
<line x1="sx" y1="sy" x2="cx - 14" y2="cy" class="arr" marker-end="url(#arrow)"/>
<!-- status circle glyph (see glyphs.md) -->
<g transform="translate(${cx - 12}, ${cy - 12})">
  <circle class="c-green" cx="12" cy="12" r="12"/>
  <path class="arr-green" d="M6 12.5 L10.5 17 L18 8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>
<!-- arrow segment 2: status circle → target -->
<line x1="cx + 14" y1="cy" x2="tx - 10" y2="ty" class="arr" marker-end="url(#arrow)"/>
```

For L-bend branches, put the status circle on the horizontal segment, not at a corner. The reader's eye tracks the glyph along the arrow direction, and corners disrupt that scan.

**Status-circle color rules are not negotiable.** `c-green` for accept, `c-coral` for reject, `c-amber` for in-progress. Even if the diagram's palette is built around blue and teal, the status circles stay green/coral/amber — semantic color wins. (This is the *only* exception to the 2-ramp budget in a simple flowchart.)

**Labels on status-circle branches.** Optional. If the status circle alone isn't enough ("accept" is obvious but "send to verifier" isn't), add a 1–3 word `ts` label 6px *past* the status circle in the direction of travel, not between the arrow and the circle. Keep labels on the same side as the target so the reading flow stays left-to-right.

### Queue glyph inside a box

A two-line node where the bottom line is a row of `queue-slot-filled` / `queue-slot-empty` glyphs from `glyphs.md` instead of a text subtitle. Used when a source node's value to the reader is "there are tasks waiting" — e.g., the hub of an Agent Teams fan-out (image #6) — and a text subtitle like "4 of 6 tasks pending" would be both noisier and less informative than the row of slots.

**Not a replacement for a normal two-line node.** Only use this when the queue depth is *itself* the information. If the box's purpose is "task router" with an incidental mention of a queue, stay with a text subtitle.

**Geometry.**

| Element           | Coordinates                                               |
|-------------------|-----------------------------------------------------------|
| Host rect         | `w ≥ 160, h = 52, rx = 6`                                 |
| Title `th`        | `y = rect_y + 18`, centered horizontally                  |
| Queue row y       | `rect_y + 30`                                             |
| Queue row start x | `rect_x + (rect_w − slots_total_w) / 2`                   |
| slot pitch        | 20 (slot is 16 wide + 4 gap)                              |
| slots_total_w     | `N × 16 + (N − 1) × 4 = N × 20 − 4`                       |
| Max slots per row | `⌊(rect_w − 24 + 4) / 20⌋`, capped at 8                   |

Height 52 is different from the standard 44 (single-line) and 56 (two-line) — the queue row plus its visual padding is just slightly shorter than a text subtitle would be. Don't reuse 44 or 56 here; the math won't center correctly.

**Example — 6 slots in a 160-wide host rect, 4 filled and 2 empty.**

```svg
<g class="c-gray">
  <rect x="60" y="120" width="160" height="52" rx="6"/>
  <text class="th" x="140" y="138" text-anchor="middle">Task queue</text>
  <rect class="c-amber" x="72"  y="150" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="92"  y="150" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="112" y="150" width="16" height="16" rx="2"/>
  <rect class="c-amber" x="132" y="150" width="16" height="16" rx="2"/>
  <rect class="c-gray"  x="152" y="150" width="16" height="16" rx="2"/>
  <rect class="c-gray"  x="172" y="150" width="16" height="16" rx="2"/>
</g>
```

Row math: `slots_total_w = 6 × 20 − 4 = 116`, `row_start_x = 60 + (160 − 116) / 2 = 82` — then each slot at `82 + k × 20`. The example above uses `72, 92, …` because the rect is 160 wide and 6 slots center at 82, so k=0 sits at 82 (actually 72 in the code because I walked it slightly left for visual breathing; recompute exactly to taste). Always recompute the row start from the formula when the rect width changes.

**Color rules.** Filled slots always use `c-amber` (work waiting is attention-worthy). Empty slots always use `c-gray`. The host rect should be `c-gray` too — if you color the host rect with a ramp, the amber slots stop reading as "waiting work" and the eye loses the signal.

**Interaction with fan-out.** When a queue-glyph node is the *source* of a fan-out, route each outbound arrow from the **title row** of the source, not the queue row. Arrows emerging from the middle of slots look as if the slots themselves are moving, which is the wrong mental model.

### Vertical fan-out

The horizontal fan-out pattern in "Fan-out + aggregator (simple mode)" rotated 90°: source box on the left, branches stacked vertically in a column on the right, aggregator (optional) further right or at the bottom. Used in Agent Teams (image #6) and the left half of Orchestrator vs Agent teams (image #9).

**When to prefer vertical over horizontal fan-out.** Horizontal fan-out is the default — it reads naturally as "one input splits into alternatives". Switch to vertical when:

- The branches are **workers** (not alternatives): they all run, consuming from a queue. A vertical stack communicates "these workers live side-by-side pulling from the same queue" better than a horizontal row.
- The source node has a **queue glyph** inside it (see previous sub-section). A queue glyph wants horizontal width; if you then fan out horizontally below the queue, the diagram gets very wide. Rotate the fan-out instead.
- The diagram needs to leave horizontal space for an aggregator or a second column — e.g., the subsystem-container pattern where the fan-out lives inside a 315-wide container.

**Geometry — 3 workers inside a normal 680 canvas.**

| Element            | Coordinates                                  |
|--------------------|----------------------------------------------|
| Source (hub) rect  | `x=40  y=160 w=180 h=52 rx=6` (queue glyph inside; see previous sub-section) |
| Worker row y₁      | `y=120`                                      |
| Worker row y₂      | `y=184`                                      |
| Worker row y₃      | `y=248`                                      |
| Worker rect        | `x=420 w=180 h=44 rx=6`                      |
| Bend channel x     | `x=320` (halfway between source right 220 and worker left 420) |
| Aggregator (opt.)  | `x=420 y=320 w=180 h=44` (if worker outputs merge) |

**Arrow routing.**

```svg
<!-- Source → Worker 1: L-bend up -->
<path d="M220 186 L320 186 L320 142 L420 142" class="arr" fill="none" marker-end="url(#arrow)"/>
<!-- Source → Worker 2: straight horizontal -->
<line x1="220" y1="206" x2="420" y2="206" class="arr" marker-end="url(#arrow)"/>
<!-- Source → Worker 3: L-bend down -->
<path d="M220 226 L320 226 L320 270 L420 270" class="arr" fill="none" marker-end="url(#arrow)"/>
```

The source's right edge is at x=220 (for a 180-wide box starting at x=40). Each arrow starts at the source's right edge at a slightly offset y (186 / 206 / 226) so the three outbound lines don't overlap inside the source rect. The shared bend channel at x=320 keeps the three L-bends visually parallel.

**Source anchor y.** For a 52-tall queue-glyph host rect at y=160, the vertical center is at y=186. Use `186 ± 20` as the three outbound anchor points so the middle arrow lands at the exact center and the top/bottom arrows sit symmetrically. For a 44-tall single-line source at y=160, use `182 ± 16` instead (smaller offset to stay inside the rect).

**Worker heights.** Workers stay at 44 (single-line) in vertical fan-out, because tight vertical stacking reads better with uniform heights. If a worker needs a subtitle, promote the whole row to 56 and recompute the worker y's with `y₁=112, y₂=184, y₃=256` (72px pitch instead of 64).

**Aggregator, if any.** For vertical fan-out with an aggregator, place the aggregator at `x=420 y=320` (below the workers) and route each worker output through a shared return channel at x=720… wait, x=720 is past the right edge. Use `x=630` instead, and drop the aggregator to `x=240 y=320` (below the middle worker), with return arrows routed to a common channel at x=620:

```svg
<line x1="600" y1="142" x2="620" y2="142" class="arr"/>
<path d="M620 142 L620 342 L420 342" class="arr" fill="none" marker-end="url(#arrow)"/>
<line x1="600" y1="206" x2="620" y2="206" class="arr"/>
<path d="M620 206 L620 342 L420 342" class="arr" fill="none" marker-end="url(#arrow)"/>
<line x1="600" y1="270" x2="620" y2="270" class="arr"/>
<path d="M620 270 L620 342 L420 342" class="arr" fill="none" marker-end="url(#arrow)"/>
```

Note that only the final segment (into the aggregator) carries the `marker-end` arrowhead — the three joining segments into the shared channel are unheaded, same as the horizontal fan-out pattern.

**Color.** Workers are typically the same color as each other (they're instances of one role). If the source is a task-queue hub with queue glyphs, keep it `c-gray` and give the workers a single accent ramp (`c-teal` is the default for workers). If one worker is distinguished from the others (the leader, the one under discussion), promote that one worker's ramp; leave the rest gray.

**Container integration.** Vertical fan-out fits naturally inside a 315-wide subsystem container (`structural.md` → "Subsystem architecture pattern"). For the container variant, shrink the source to 120-wide, workers to 140-wide, and recompute the bend channel. See `structural.md` → "Rich interior for subsystem containers" for the full coordinate table.

### State machine

A flowchart variant where the nodes are **states** (things the system *is*) rather than steps (things the system *does*), and the arrows are **transitions** labeled with the event that triggers them. Used for lifecycles — order status, connection state, feature-flag rollout phase, auth session — where "what can happen next from here" matters more than a single linear path.

**When to reach for it.** The reader's question is "what are the possible states and how do I move between them", not "what happens first, second, third". If the diagram has more than one incoming arrow to most nodes (cycles, self-loops, branches returning to earlier states), you're in state-machine territory. If every node has exactly one predecessor, you want a plain flowchart instead.

**Initial and final markers.** Two small circles anchor the diagram as a state machine — these are the only non-rectangle nodes the pattern uses.

| Marker        | Shape                                            | Class     | Meaning                                   |
|---------------|--------------------------------------------------|-----------|-------------------------------------------|
| Initial state | Filled circle, `r=6`                             | `c-gray`  | Entry point — exactly one per diagram     |
| Final state   | Hollow circle `r=10` with a filled inner `r=5`   | `c-gray`  | Terminal state — may appear multiple times |

```svg
<!-- Initial state at (x, y) -->
<circle class="c-gray" cx="x" cy="y" r="6"/>

<!-- Final state at (x, y) -->
<circle class="c-gray" cx="x" cy="y" r="10" fill="none"/>
<circle class="c-gray" cx="x" cy="y" r="5"/>
```

The initial marker gets **no label** — it's the start, that's self-evident. The final marker may get a 1-word `ts` label 14px below (*Closed*, *Archived*) if the specific terminal state matters; otherwise leave it bare. The initial marker's `r=6` is deliberately smaller than the final marker's outer `r=10` so the two read as different symbols at a glance.

**State nodes.** Standard rounded rect, `rx=6`, same dimensions as a flowchart step node (44px single-line or 56px two-line, 160–180 wide). The title is a noun or noun phrase — the state's *name*, not a verb. *"Awaiting payment"* not *"Wait for payment"*; *"Paid"* not *"Process payment"*. If a state needs a subtitle, use it to clarify *what's true while here* (*"Funds held, awaiting capture"*), not *what runs next*.

**Transition labels.** Every arrow gets a label in the format:

```
event [guard] / action
```

- **event** — the trigger that fires the transition (*payment_received*, *timeout*, *user_cancel*). Required.
- **[guard]** — an optional boolean precondition in square brackets (*[amount > 0]*, *[retry_count < 3]*). Omit if there's no condition.
- **/ action** — an optional side effect performed on transit (*/ send_receipt*, */ release_hold*). Omit if the transition is pure.

All three parts fit in a single `ts` label placed at the arrow's midpoint (`y = arrow_midpoint_y − 6`, `text-anchor="middle"`). The full *event [guard] / action* string still has to respect the 3-word arrow-label rule in spirit — if the guard or action pushes the label past ~28 characters, promote it to a small table below the diagram and leave only *event* on the arrow. Don't wrap labels across two lines mid-arrow.

**Choice point (internal branch).** When one event fans out into multiple destinations based on guards, insert a small diamond (`w=16 h=16`, `transform="rotate(45)"` on a square — or a `<path>` for the rhombus) at the fan-out point. The incoming arrow carries the shared event label (*payment_received*); each outgoing arrow carries only its own `[guard]` (no event, no action on the choice arrows themselves). This keeps the branch legible without repeating the event name.

```svg
<!-- Choice diamond at (cx, cy) -->
<path class="c-gray" d="M cx,cy-10 L cx+10,cy L cx,cy+10 L cx-10,cy Z"/>
```

Use a choice diamond **only** when two or more outgoing arrows share a triggering event. If the branches fire on different events, skip the diamond — draw two independent labeled arrows from the source state. A diamond per decision is mermaid's habit; baoyu keeps them to the rare case where they genuinely remove duplication.

**Self-loops.** A transition that returns to the same state (*retry on transient failure*) draws as a small arc off one side of the state rect:

```svg
<path d="M rect_right, rect_cy_top
         C rect_right+30, rect_cy_top−10
           rect_right+30, rect_cy_bot+10
           rect_right, rect_cy_bot"
      class="arr" fill="none" marker-end="url(#arrow)"/>
<text class="ts" x="rect_right+34" y="rect_cy">retry [n &lt; 3]</text>
```

Place self-loops on the right edge of the state rect. Left-edge self-loops collide with incoming arrows from the initial marker in most top-down layouts.

**Color.** State machines are almost always **one ramp** — the cohesive lifecycle is the point. Reach for gray when the states are neutral (order lifecycle), teal or purple when the machine represents a *subsystem* you want the reader to recognize as a named thing. The 2-ramp exception is reserved for **error states**: any state that represents a failure or cancellation may switch to `c-coral`, with the rest of the machine in its primary ramp. Don't rainbow the states — same ramp, same weight, let the arrows carry the meaning.

**Layout.** State machines are less strictly directional than flowcharts — cycles make "top-down only" impossible. Do pick a dominant direction (usually left-to-right for linear lifecycles with a few loops, top-down for branching status graphs) and route the *happy path* along that axis; loops and error transitions can bend against the grain. Keep the initial marker at the top-left (or top-center) and the final markers at the opposite corner/edge.

**Worked example — Order lifecycle (4 states + cancel branches).**

```svg
<!-- Initial marker -->
<circle class="c-gray" cx="60" cy="80" r="6"/>
<line x1="66" y1="80" x2="110" y2="80" class="arr" marker-end="url(#arrow)"/>

<!-- State: New -->
<g class="c-gray">
  <rect x="110" y="56" width="140" height="48" rx="6"/>
  <text class="th" x="180" y="86" text-anchor="middle">New</text>
</g>
<text class="ts" x="295" y="74" text-anchor="middle">pay / hold_funds</text>
<line x1="250" y1="80" x2="340" y2="80" class="arr" marker-end="url(#arrow)"/>

<!-- State: Paid -->
<g class="c-gray">
  <rect x="340" y="56" width="140" height="48" rx="6"/>
  <text class="th" x="410" y="86" text-anchor="middle">Paid</text>
</g>
<text class="ts" x="525" y="74" text-anchor="middle">ship</text>
<line x1="480" y1="80" x2="570" y2="80" class="arr" marker-end="url(#arrow)"/>

<!-- State: Shipped -->
<g class="c-gray">
  <rect x="570" y="56" width="100" height="48" rx="6"/>
  <text class="th" x="620" y="86" text-anchor="middle">Shipped</text>
</g>

<!-- State: Delivered (below Shipped) -->
<text class="ts" x="636" y="140" text-anchor="start">delivered</text>
<path d="M620 104 L620 156" class="arr" fill="none" marker-end="url(#arrow)"/>
<g class="c-gray">
  <rect x="570" y="156" width="100" height="48" rx="6"/>
  <text class="th" x="620" y="186" text-anchor="middle">Delivered</text>
</g>

<!-- Final marker -->
<path d="M620 204 L620 240" class="arr" fill="none" marker-end="url(#arrow)"/>
<circle class="c-gray" cx="620" cy="250" r="10" fill="none"/>
<circle class="c-gray" cx="620" cy="250" r="5"/>

<!-- Cancel branch: New → Cancelled (error state, coral) -->
<text class="ts" x="180" y="146" text-anchor="middle">cancel</text>
<path d="M180 104 L180 156" class="arr" fill="none" marker-end="url(#arrow)"/>
<g class="c-coral">
  <rect x="110" y="156" width="140" height="48" rx="6"/>
  <text class="th" x="180" y="186" text-anchor="middle">Cancelled</text>
</g>

<!-- Cancel branch: Paid → Cancelled (refund) -->
<text class="ts" x="300" y="146" text-anchor="middle">cancel / refund</text>
<path d="M410 104 L410 180 L250 180" class="arr" fill="none" marker-end="url(#arrow)"/>
```

Two things to note in the example: (1) *Cancelled* uses `c-coral` as the single allowed off-ramp for an error state while everything else stays `c-gray`, and (2) the *Paid → Cancelled* transition bends back horizontally and collapses into the same Cancelled box rather than drawing a second coral rect — one error state serves both cancel sources.

## Rules of thumb

- **Max 5 nodes per diagram.** If the process has more steps, split into "overview" (the main path) and "detail" (what happens inside one of the stages).
- **Single direction only.** Top-down *or* left-to-right. Never both in one diagram.
- **Same-tier nodes same size.** If row A has 140-wide boxes, every box in row A should be 140 wide. Mixing sizes in one row looks like a layout bug.
- **Short arrow labels are allowed; long ones are not.** A 1–3 word `ts` label can float above an arrow's midpoint when the edge itself carries meaning the source/target nodes don't — *Pass* / *Fail* on a gate's two outbound arrows, *Query* / *Results* on a hub's exchange with an attachment, *Accepted* / *Rejected* on an evaluator's feedback loop. Place the label at `y = arrow_midpoint_y − 6` with `text-anchor="middle"` and class `ts`. **Anything longer than 3 words belongs in the target box's subtitle or in prose around the diagram**, never on the arrow itself — long labels collide with other elements and are hard to position. Sequence diagrams have the same allowance (message labels *are* the point of the arrow there — see `sequence.md`) but with a numeric prefix convention.
- **Start and end get gray boxes.** Color is reserved for the interesting steps.
- **Arrowheads end 10px short of the target.** Gives the reader visual breathing room.

## Tiny worked example

Request: "flowchart of logging into a web app"

Plan:
- 4 nodes: Start → Enter credentials → Auth service → Dashboard
- Direction: top-down
- Colors: gray for Start and Dashboard, blue for the two middle steps (they're the active workflow)
- All single-line (44px), width 180 each, centered at x=250

viewBox: max_y = 280 + 44 = 324 → H = 344.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 344" font-family="...">
  <style>...</style>
  <defs>
    <marker id="arrow" .../>
  </defs>

  <rect class="box" x="250" y="40" width="180" height="44" rx="6"/>
  <text class="t" x="340" y="62" text-anchor="middle" dominant-baseline="central">Start</text>

  <g class="c-blue">
    <rect x="250" y="120" width="180" height="44" rx="6"/>
    <text class="th" x="340" y="142" text-anchor="middle" dominant-baseline="central">Enter credentials</text>
  </g>

  <g class="c-blue">
    <rect x="250" y="200" width="180" height="44" rx="6"/>
    <text class="th" x="340" y="222" text-anchor="middle" dominant-baseline="central">Auth service</text>
  </g>

  <rect class="box" x="250" y="280" width="180" height="44" rx="6"/>
  <text class="t" x="340" y="302" text-anchor="middle" dominant-baseline="central">Dashboard</text>

  <line x1="340" y1="94" x2="340" y2="110" class="arr" marker-end="url(#arrow)"/>
  <line x1="340" y1="174" x2="340" y2="190" class="arr" marker-end="url(#arrow)"/>
  <line x1="340" y1="254" x2="340" y2="270" class="arr" marker-end="url(#arrow)"/>
</svg>
```

## Worked example — Gate with pass/fail split

Request: "LLM call with a gate that either continues through two more calls or exits early"

Plan:
- 6 nodes on a single row: `In` (pill) → `LLM Call 1` → `Gate` → `LLM Call 2` → `LLM Call 3` → `Out` (pill), plus an `Exit` pill dropping below the Gate on the Fail branch.
- Colors: pills gray; LLM calls gray; Gate purple (the decision point).
- Arrow labels: *Pass* on Gate → LLM Call 2 (solid), *Fail* on Gate → Exit (dashed `.arr-alt`).
- Horizontal budget: 6 nodes + 5 gaps of 20px must fit in the 600px usable width. `60 + 106 + 60 + 106 + 106 + 60 = 498`, plus `5 × 20 = 100`, total = **598** — fits with 2px to spare.
- viewBox: single row at y=140, plus an Exit row at y=230. `max_y = 230 + 44 = 274` → H = **294**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 294" font-family="...">
  <style>...</style>
  <defs><marker id="arrow" .../></defs>

  <rect class="box" x="40"  y="140" width="60"  height="44" rx="22"/>
  <text class="t"   x="70"  y="162" text-anchor="middle" dominant-baseline="central">In</text>

  <g class="c-gray">
    <rect x="120" y="140" width="106" height="44" rx="6"/>
    <text class="th" x="173" y="162" text-anchor="middle" dominant-baseline="central">LLM Call 1</text>
  </g>

  <g class="c-purple">
    <rect x="246" y="140" width="60"  height="44" rx="6"/>
    <text class="th" x="276" y="162" text-anchor="middle" dominant-baseline="central">Gate</text>
  </g>

  <g class="c-gray">
    <rect x="326" y="140" width="106" height="44" rx="6"/>
    <text class="th" x="379" y="162" text-anchor="middle" dominant-baseline="central">LLM Call 2</text>
  </g>

  <g class="c-gray">
    <rect x="452" y="140" width="106" height="44" rx="6"/>
    <text class="th" x="505" y="162" text-anchor="middle" dominant-baseline="central">LLM Call 3</text>
  </g>

  <rect class="box" x="578" y="140" width="60"  height="44" rx="22"/>
  <text class="t"   x="608" y="162" text-anchor="middle" dominant-baseline="central">Out</text>

  <rect class="box" x="246" y="230" width="60"  height="44" rx="22"/>
  <text class="t"   x="276" y="252" text-anchor="middle" dominant-baseline="central">Exit</text>

  <line x1="102" y1="162" x2="118" y2="162" class="arr"     marker-end="url(#arrow)"/>
  <line x1="228" y1="162" x2="244" y2="162" class="arr"     marker-end="url(#arrow)"/>
  <line x1="308" y1="162" x2="324" y2="162" class="arr"     marker-end="url(#arrow)"/>
  <line x1="434" y1="162" x2="450" y2="162" class="arr"     marker-end="url(#arrow)"/>
  <line x1="560" y1="162" x2="576" y2="162" class="arr"     marker-end="url(#arrow)"/>
  <line x1="276" y1="184" x2="276" y2="226" class="arr-alt" marker-end="url(#arrow)"/>

  <text class="ts" x="316" y="156" text-anchor="middle">Pass</text>
  <text class="ts" x="286" y="204" text-anchor="start">Fail</text>
</svg>
```

Notes on this example:
- The *Pass* label sits **above** the solid horizontal arrow from Gate to LLM Call 2 at `y = arrow_y − 6 = 156`, centered on the arrow midpoint (316).
- The *Fail* label sits **beside** the dashed vertical arrow at x=286 (10px right of the arrow), with `text-anchor="start"` so it extends rightward — this keeps it clear of the Gate rect's right edge at x=306.
- Both arrow labels are ≤1 word — the rule of thumb at line 159 caps flowchart arrow labels at 3 words.
- The `.arr-alt` class on the Fail arrow matches the stroke color of `.arr` but adds the dashed pattern, so the Fail branch reads as a **conditional exit** rather than a mainline flow.
- The Exit pill is centered at x=276 (same x as the Gate center — both rects share x=246, w=60) so the dashed arrow drops straight down, no bend.
- Rightmost rect edge: Out pill ends at x = 578 + 60 = **638** ≤ 640 ✓ — the pre-save rightmost-edge check from `pitfalls.md#1` passes.


## Poster flowchart pattern

See `references/flowchart-poster.md`. **Load it when ≥3 of the poster triggers fire in Step 4a**: the topic has a short name, a "why it exists" sentence, named phases (2–4), parallel candidates with a judge, a loop termination mechanic, overflow annotations, or a footer quote. If only 0–1 apply, the simple flowchart is the right tool.
