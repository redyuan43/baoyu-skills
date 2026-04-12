# Layout Math

SVG has no auto-layout. Every coordinate, width, and height is hand-computed. Most diagram failures trace back to text overflowing its container or elements landing outside the viewBox. This file is the arithmetic you run *before* writing any `<rect>`.

## The coordinate system

- **viewBox**: `0 0 680 H`. Width is always 680. Compute H from content.
- **Safe area**: `x ∈ [40, 640]`, `y ∈ [40, H - 40]`. Leave 40px of breathing room on every edge.
- **Usable width**: 600 px (640 − 40).
- **Pixel units are 1:1.** The `width="100%"` with `viewBox="0 0 680 H"` means the browser scales the whole coordinate space to fit the container. A 14px font is really 14px. Character widths below assume this 1:1 ratio.

## Text width estimation

SVG `<text>` never auto-wraps. If you put more characters in a box than it can hold, they overflow visibly. Use these character-to-pixel multipliers, calibrated on Anthropic Sans:

| Case                                     | Approx. width per character |
|------------------------------------------|-----------------------------|
| 14px latin, weight 500 (`th`, titles)    | ~8 px                        |
| 14px latin, weight 400 (`t`, body)       | ~8 px                        |
| 12px latin, weight 400 (`ts`, subtitles) | ~7 px                        |
| 14px CJK (Chinese, Japanese, Korean)     | ~15 px (~2× Latin)           |
| 12px CJK                                 | ~13 px (~1.9× Latin)         |

**Special characters:** chemical formulas (C₆H₁₂O₆), math symbols (∑ ∫ √), subscripts, superscripts all take the same horizontal space as normal characters — don't assume subscripts are narrower. For labels that mix Latin and formulas, add 30–50% padding to your width estimate.

### Empirical calibration samples

Real measurements of Anthropic Sans at the sizes this skill uses. The multipliers above are the safe ceilings derived from these samples — not the averages. Letter composition matters: narrow letters like `l`/`i`/`f` push the per-char average down, tall letters like `B`/`J`/`P`/`Q` push it up.

| Text                                    | Chars | Weight | Size  | Measured width | Per-char |
|-----------------------------------------|-------|--------|-------|----------------|----------|
| `Authentication Service`                | 22    | 500    | 14 px | 167 px         | ~7.6     |
| `Background Job Processor`              | 24    | 500    | 14 px | 201 px         | ~8.4     |
| `Detects and validates incoming tokens` | 37    | 400    | 14 px | 279 px         | ~7.5     |
| `forwards request to`                   | 19    | 400    | 12 px | 123 px         | ~6.5     |
| `データベースサーバー接続`               | 12    | 400    | 14 px | 181 px         | ~15.1    |

The formula uses **8** for 14px Latin and **7** for 12px Latin because those are the safe ceilings, not the average. A label like "Background Job Processor" at 8.4 px/char would overflow a box sized from a 7.6 px/char average — always round up, never down.

**Worked sanity check**: `"Detects and validates incoming tokens"` (37 chars, `ts` class at 12px) → formula gives `37 × 7 + 24 = 283 px`. Measured 279 px + 24 px padding = 303 px. The formula is ~7% conservative, which is the correct direction for rect sizing — bias toward extra padding, never toward clipping.

### Rect sizing formula

For a two-line node (title + subtitle) the width must fit whichever line is longer:

```
width_needed = max(title_chars × 8, subtitle_chars × 7) + 24
```

The `+ 24` is 12px of horizontal padding on each side. If the text is centered, that's 12px of clear air between the text edge and the rect stroke — looks balanced.

For a single-line node:

```
width_needed = title_chars × 8 + 24
```

For CJK content, replace the 8 with 15 and the 7 with 13.

**Round up to the nearest 10px** for cleaner coordinates. A box that "needs" 167px becomes 170px.

### Worked examples

- `"JWT authentication"` (18 chars, title) → `18 × 8 + 24 = 168` → round to **170**
- `"Validates user credentials"` (26 chars, subtitle) in a two-line box with title `"Login service"` (13 chars, 8-wide) → `max(13 × 8, 26 × 7) + 24 = max(104, 182) + 24 = 206` → round to **210**
- `"微服务架构"` (5 CJK chars, title) → `5 × 15 + 24 = 99` → round to **100**
- `"发送 HTTP 请求 forwards request"` (mixed, treat CJK chars as 15px and Latin as 8px) → `3×15 + 4×8 + 13×8 = 45 + 32 + 104 = 181 + spaces + 24 ≈ 220`

**Rule of thumb**: if you find yourself adding characters to a label, recheck the width. It's easy to write "Authentication" once, size the box to fit, then expand it to "Authentication service" and forget to resize.

## viewBox height calculation

After placing every element, compute max_y:

1. For every `<rect>`, compute `y + height`.
2. For every `<text>`, the bottom is `y + 4` (roughly — 4px descent below the baseline).
3. For every `<circle>`, it's `cy + r`.
4. `max_y` is the maximum across all of these.
5. `H = max_y + 20`

**Don't guess.** A 20px buffer below the last element keeps things tight without clipping descenders.

**Don't leave huge empty space at the bottom.** If the diagram ends at y=280, H should be 300 — not 560. Excess whitespace below the content feels like a rendering bug.

## Tier packing (horizontal rows)

When placing N boxes in a horizontal row, check total width before you start writing coordinates:

```
total = N × box_width + (N - 1) × gap
```

- `box_width`: chosen to fit the longest label in that row
- `gap`: 20px minimum between adjacent boxes

Required: `total ≤ 600` (the usable width). If not, one of three things must give:

1. **Shrink box_width** — cut subtitles, shorten titles
2. **Wrap to 2 rows**
3. **Split into an overview diagram + detail diagrams** (one per sub-flow)

### Worked example — four consumer boxes

- 4 boxes, each containing `"Consumer N"` (10 chars title) and `"Processes events"` (16 chars subtitle)
- Needed width per box: `max(10×8, 16×7) + 24 = max(80, 112) + 24 = 136` → round to **140**
- 4 boxes × 140 + 3 gaps × 20 = 560 + 60 = **620** → **overflows** by 20
- Fix: shrink to **130** each (check: `max(10×8, 16×7) + 24 = 136`, so 130 is tight — cut subtitle to 14 chars or drop it entirely)
- Or: drop to 3 boxes per row, stack the fourth below
- Or: 4 × 130 + 3 × 20 = 580, centered at `x = 40 + (600-580)/2 = 50` → boxes at x = 50, 200, 350, 500

## Swim-lane (sequence) layout

Sequence diagrams have their own coordinate system — actor columns ("lanes") along the top, dashed lifelines running down, numbered horizontal messages between them. The numbers below are fixed conventions so every sequence diagram in the skill feels consistent.

### Lane widths and centers

N = number of actors. Lane width `lane_w`, header rect width `header_w = lane_w − 20`, lifeline x = lane center. Gap between lanes = 20.

| N | lane_w | header_w | First offset | Lane centers (x)               |
|---|--------|----------|--------------|--------------------------------|
| 2 | 290    | 270      | 40           | 185, 495                       |
| 3 | 186    | 166      | 40           | 133, 340, 547                  |
| 4 | 140    | 120      | 30           | 100, 260, 420, 580             |
| 5 | 112    |  92      | 26           | 82, 214, 346, 478, 610         |
| 6 | 100    |  80      | 30           | 80, 190, 300, 410, 520, 630    |

Hard cap: **4 actors** (comfortable), **6 actors** (maximum). 5 is allowed only when every actor title is ≤12 characters and has no subtitle. 6 requires every title ≤9 characters (`9 × 8 + 24 = 96`, just inside `header_w=100`) and no subtitle. N=6 also collapses the intra-lane gap (the 20px padding between `lane_w` and `header_w` becomes 0 — the headers pack shoulder-to-shoulder) and borrows 10px of left-edge margin and all of the right-edge margin: the rightmost header rect sits flush against x=680. Use N=6 only when every actor is genuinely essential — otherwise merge actors or split the diagram. More than 6 doesn't fit 680px legibly.

### Vertical geometry (fixed for all sequence diagrams)

```
actor header box    y = 40..88       (height 48, rx 8)
title (th)          y = 60           (dominant-baseline="central")
role subtitle (ts)  y = 78           (optional, one line, ≤16 chars)
lifeline start      y = 92
first message row   arrow_y[0] = 120
message row pitch   44 px            → arrow_y[k] = 120 + 44 · k
lifeline tail       y = last_arrow_y + 24
```

### viewBox height

```
header_bottom    = 88
first_arrow_y    = 120
last_arrow_y     = 120 + 44 × (M − 1)          # M = number of messages
lifeline_bottom  = last_arrow_y + 24
note_bottom      = lifeline_bottom + 16 + 48   # only if side note is at the bottom
H                = max(lifeline_bottom, note_bottom) + 20
```

### Message arrows

Each message is a horizontal `<line>` at `y = arrow_y[k]`, running from the sender lifeline x to the receiver lifeline x with a 6px offset so the arrowhead doesn't touch the dashes:

- Left-to-right: `x1 = sender_x + 6`, `x2 = receiver_x − 6`
- Right-to-left: `x1 = sender_x − 6`, `x2 = receiver_x + 6`

Use `class="arr-{ramp}"` where `{ramp}` matches the sender's actor ramp. Always set `marker-end="url(#arrow)"`.

### Message labels

Label sits **above** the arrow at `y = arrow_y − 10` with `text-anchor="middle"`, `class="ts"`, and the number prefix baked into the text (`"1. Click login"`, not separate tspans). Label x is the midpoint of sender and receiver: `(sender_x + receiver_x) / 2`.

Max characters that fit in a label between two adjacent lanes (e.g. lanes 1↔2 for N=4):

```
label_chars_max ≈ (|sender_x − receiver_x| − 8) / 7
```

For N=4 adjacent lanes (|Δx|=160): ~21 chars. For the longest cross-diagram leap (lane 1↔4, |Δx|=480): ~67 chars. In practice, aim for ≤30 chars — short messages read faster, even when there's room.

### Self-messages

A self-message is a 16×24 `<rect>` using the actor's `c-{ramp}` class, horizontally centered on the lifeline: `rect_x = lifeline_x − 8`, `rect_y = arrow_y − 12`. The label sits **to the left** of the rect (so it stays inside the diagram for the rightmost lane) at `x = rect_x − 8` with `text-anchor="end"`, `class="ts"`, `dominant-baseline="central"`, and the same numbered format.

### Side note

A `class="box"` rect with a `th` title and optional `ts` subtitle. Default size 240×48, `rx="10"`. Placement depends on N:

- **N ≤ 3**: top-left at `(40, 40)` — tucks beside the first actor header, no overlap because `first_offset ≥ 40`.
- **N ≥ 4**: bottom-left at `(40, lifeline_bottom + 16)` — the top is packed tight against the leftmost header, so use the bottom margin.

### Worked example — OAuth 2.0 (N=4, M=10)

```
lane centers     100, 260, 420, 580     (lane_w=140, header_w=120)
header_bottom    88
first_arrow_y    120
last_arrow_y     120 + 44×9 = 516       (10 messages)
lifeline_bottom  540
note_bottom      540 + 16 + 48 = 604    (note at bottom)
H                604 + 20 = 624
viewBox          "0 0 680 624"
```

Label budgets: adjacent lanes (|Δx|=160) fit ~21 chars; "Redirect with client_id, scope" at 30 chars needs `|Δx| ≥ 218`, so it must span at least 2 lanes — put it between Client app (260) and Auth server (420), |Δx|=160 — **too tight**. Shorten to "Redirect (client_id + scope)" (28 chars, still over). Shorten further to "Redirect + client_id" (20 chars). Always verify every label against its span before finalizing.

## Centering inside the safe area

For N boxes of width `w` with gap `g`:

```
total = N × w + (N - 1) × g
offset = 40 + (600 - total) / 2
box[i].x = offset + i × (w + g)
```

Centered content feels deliberate. Left-aligned content feels incomplete.

## Sibling subsystem containers (2-up)

The structural subsystem-architecture pattern (see `structural.md` → "Subsystem architecture pattern") places **two sibling dashed-border containers** side by side, each holding a short internal flow. The 2-up layout sacrifices the default 40px horizontal safe margin in exchange for a usable container interior wide enough to hold 3–4 flowchart nodes.

Standard 2-up geometry at viewBox width 680:

```
container_w      = 315               # each sibling
container_gap    =  10                # space between siblings
left_margin      =  20                # leaner than the usual 40
container_A.x    =  20
container_B.x    = 345               # left_margin + container_w + container_gap
rightmost edge   = 345 + 315 = 660   # leaves 20px to x=680
interior_w       = 315 − 40 = 275    # after 20px padding on each side
interior_A.x     =  40
interior_B.x     = 365
```

Inside each 275-wide interior, node widths follow the normal text-width formula but should cap at ~235 so the L-bend connectors have clear vertical channels on both sides. Typical nodes are 180 wide centered, or 150 wide for a 2-column row.

A **labeled cross-system arrow** bridges the 10px container gap:

```
from B_right_node.right_edge  → to A_left_node.left_edge
arrow_x1 = interior_B.rightmost_node.x + 10
arrow_x2 = interior_A.leftmost_node.x  − 10
arrow_y  = matching row y                 # both nodes on the same tier
label at (x_mid, arrow_y − 6), class="ts", text-anchor="middle"
```

The cross-system arrow label is the one place where a flowchart-style connector *must* have a label — the reader cannot infer the relationship from the container titles alone. Keep the label to ≤3 words.

Dashed container borders use **inline `stroke-dasharray="4 4"`** on the `<rect>` rather than a CSS class — dashed is a one-off container-styling concern, not a reusable shape property, so the template's class list stays stable.

### Worked example — Pi session + Background analyzer

Two siblings, each with 3 internal nodes stacked vertically:

```
container A "Pi session"           container B "Background analyzer"
x=20, y=40, w=315, h=260            x=345, y=40, w=315, h=260
rx=20, stroke-dasharray="4 4"       same styling

Inside A (x_center = 177):           Inside B (x_center = 502):
  [ User input     ] y=96           [ Analyze patterns ] y=96
  [ Pi responds    ] y=170          [ Write summary    ] y=170
  [ (session ends) ] y=244          [ Update memory    ] y=244

Cross-system arrow: B top row → A top row at y=118
  x1 = 347 (container B left edge + 2)? No — from interior node B₁ left edge
  Actually: from B₁.x − 10 (headed right-to-left pointing at A₁)

Details below in structural.md's worked example.
```

viewBox H for 3 stacked rows: last node bottom y = 244 + 44 = 288; container bottom 40 + 260 = 300; H = 300 + 20 = **320**.

## Sub-pattern coordinate tables

Fixed coordinate tables for the sub-patterns introduced in `structural.md`, `illustrative.md`, and `sequence.md`. Use these values verbatim — they're tuned so each sub-pattern respects the 680 viewBox and the 40 safe margin.

### Bus topology geometry

For `structural.md` → "Bus topology sub-pattern". A central horizontal bar bridges N agents above it and N agents below it.

| Element                    | Coordinates                              |
|----------------------------|------------------------------------------|
| Bus bar                    | `x=40 y=280 w=600 h=40 rx=20`            |
| Bus label baseline         | `y=304`, `text-anchor="middle"` at x=340 |
| Top agent row (box top)    | `y=80`, `h=60`                           |
| Bottom agent row (box top) | `y=400`, `h=60`                          |
| Default viewBox H          | 500                                      |

Agent centers by row count:

| Agents per row | Box width | Centers (x)                                |
|----------------|-----------|--------------------------------------------|
| 2              | 180       | 180, 500                                   |
| 3              | 140       | 170, 340, 510                              |
| 4              | 110       | 120, 260, 420, 560                         |

Publish/subscribe arrow pair: two vertical lines per agent, offset by 8px horizontally (one at `agent_cx − 8`, one at `agent_cx + 8`). Publish goes down from agent to bar; Subscribe goes up from bar to agent. Labels sit at the channel midpoint y, `text-anchor="end"` (Publish on left) and `text-anchor="start"` (Subscribe on right).

### Radial star geometry (3 / 4 / 5 / 6 satellites)

For `structural.md` → "Radial star topology sub-pattern". A central hub surrounded by N peripheral satellites, each bidirectionally connected.

**Hub (always fixed):**

| Element       | Coordinates                |
|---------------|----------------------------|
| Hub rect      | `x=260 y=280 w=160 h=80 rx=10` |
| Hub center    | `(340, 320)`               |
| viewBox H     | 560                        |

**Satellite positions:**

| N | Satellites (box top-left → w=160 h=60)                                           |
|---|-----------------------------------------------------------------------------------|
| 3 | `(60, 120)`, `(460, 120)`, `(260, 460)`                                           |
| 4 | `(60, 120)`, `(460, 120)`, `(60, 460)`, `(460, 460)`                              |
| 5 | `(260, 60)`, `(60, 200)`, `(460, 200)`, `(60, 460)`, `(460, 460)`                 |
| 6 | `(20, 120)`, `(260, 60)`, `(500, 120)`, `(20, 460)`, `(260, 520)`, `(500, 460)`   |

Satellite centers: add `(80, 30)` to the box top-left to get `(cx, cy)`.

**Arrow pairs:** each satellite connects to the hub with two single-headed arrows offset by 8 px perpendicular to the arrow direction. For a satellite at `(sx, sy)` and hub center `(340, 320)`, compute the direction vector, normalize to unit length, then offset each line by `(+4dy, −4dx)` and `(−4dy, +4dx)` respectively (where `(dx, dy)` is the unit direction).

For straightforward placement, use these pre-computed endpoint offsets for N=4:

| Satellite center | Outbound start (satellite → hub) | Outbound end |
|------------------|----------------------------------|--------------|
| TL `(140, 150)`  | `(224, 176)`                     | `(264, 276)` |
| TR `(540, 150)`  | `(456, 176)`                     | `(416, 276)` |
| BL `(140, 490)`  | `(224, 464)`                     | `(264, 364)` |
| BR `(540, 490)`  | `(456, 464)`                     | `(416, 364)` |

Inbound (hub → satellite) is the reverse of each outbound, offset perpendicular by 8.

### Spectrum geometry

For `illustrative.md` → "Spectrum / continuum". A 1-D axis with end labels, tick points, option boxes, and italic captions.

**Fixed vertical positions:**

| Element                   | Coordinates                                |
|---------------------------|--------------------------------------------|
| Eyebrow (optional)        | `y=50`, `text-anchor="middle"` at x=340    |
| End labels (L / R)        | `y=120`, at `x=80` (start) / `x=600` (end) |
| Axis line                 | `x1=80 y1=140 x2=600 y2=140`               |
| Tick circles              | `cy=140`, `r=6`                            |
| Option box top            | `y=200`, `h=60`                            |
| Caption line 1            | `y=292`, italic `ts`                       |
| Caption line 2            | `y=308`, italic `ts`                       |
| Default viewBox H         | 332                                        |

**Tick and option-box x positions by tick count:**

| Ticks | Tick centers (x)            | Option box x (w=120)        |
|-------|-----------------------------|-----------------------------|
| 2     | 200, 480                    | 140, 420                    |
| 3     | 160, 340, 520               | 100, 280, 460               |
| 4     | 140, 280, 420, 560          | 80, 220, 360, 500           |
| 5     | 120, 240, 360, 480, 600 (w=100) | 70, 190, 310, 430, 550      |

Axis uses `marker-start` **and** `marker-end` (both ends arrowed to signal no natural direction). Axis stroke class is `arr` (neutral gray) — never a color ramp.

Sweet-spot tick and its option box use `c-green` or `c-amber`; all other ticks and boxes stay `c-gray`. Captions cap at 24 characters per line, 2 lines per option.

### Parallel rounds geometry

For `sequence.md` → "Parallel independent rounds". Stacked independent call/response rounds without shared lifelines.

**Stacked rounds variant (full-width):**

| Element              | Coordinates                            |
|----------------------|----------------------------------------|
| Source actor         | `x=60  y=120 w=120 h=60`               |
| Round k action box   | `x=340 y=100 + (k-1)×80 w=160 h=48`    |
| Round k call arrow   | `y = 124 + (k-1)×80`                   |
| Round k response     | `y = 134 + (k-1)×80`                   |
| Call label           | `y = 115 + (k-1)×80`                   |
| Response label       | `y = 145 + (k-1)×80`                   |
| Row pitch            | 80                                     |

Arrow x endpoints: `x1 = source_right_edge + 6 = 186`, `x2 = action_left_edge − 6 = 334` (going right); reverse for the return arrow.

**Script-wrapper variant:**

| Element              | Coordinates                            |
|----------------------|----------------------------------------|
| Source actor         | `x=60  y=120 w=120 h=60`               |
| Script wrapper       | `x=240 y=100 w=140 h=260 rx=6`         |
| `{ }` label          | `(310, 124)`, class `th`               |
| Divider line         | `x1=256 y1=140 x2=364 y2=140`          |
| Wrapped band k       | `x=252 y=152 + (k-1)×60 w=116 h=48`    |
| External action box  | `x=440 y=200 w=160 h=48` (optional)    |
| Default viewBox H    | 380                                    |

Up to 3 wrapped bands inside the script wrapper (with `script_h = 260`). Grow `script_h` by 60 for each additional band.

**Inside a 315-wide subsystem container** (half-width), scale the coordinates:

| Element            | Container A (x=20)              |
|--------------------|---------------------------------|
| Source actor       | `x=40 y=120 w=100 h=50`         |
| Round k action     | `x=200 y=104 + (k-1)×64 w=120 h=40` |
| Row pitch          | 64                              |

### Multi-line box body line heights

For `structural.md` → "Multi-line box body". A three-line box used for advisor-role labels: title + italic role + meta.

| Line       | y-offset from `rect_y`   | Class         |
|------------|--------------------------|---------------|
| Title      | `+22`                    | `th`          |
| Role       | `+42`                    | `ts` + italic |
| Meta       | `+62`                    | `ts` muted    |
| Min h      | 80                       |               |

Row pitch is 20. For a box at y=140, lines sit at `162, 182, 202`. Box height never drops below 80 — if the role or meta line is absent, use a standard 56-tall two-line box instead, don't shrink a three-line box.

### Annotation circle on connector geometry

For `illustrative.md` → "Annotation circle on connector". A labeled circle sitting above a pair of bidirectional arrows between two subjects.

| Element               | Coordinates                                  |
|-----------------------|----------------------------------------------|
| Subject A box         | `x=80  y=160 w=180 h=56`                     |
| Subject B box         | `x=440 y=160 w=180 h=56`                     |
| A → B arrow           | `(266, 184) → (434, 184)`, `arr`             |
| B → A arrow           | `(434, 204) → (266, 204)`, `arr`             |
| Arrow pair y midpoint | 194                                          |
| Annotation circle     | outer `c="box"` r=30 at `(cx, cy) = (350, 150)` |
| Inner pill            | `x=cx−28 y=cy+12 w=56 h=20 rx=10` (uses ramp)|
| Connector line        | `(cx, cy+30) → (cx, 194)`, `arr` (no marker) |

Label goes inside the pill at `(cx, cy+26)`, `th`, centered. Subject A/B labels use `th` at `(subject_cx, subject_cy)`.

### Container loop geometry (simple flowchart)

For `flowchart.md` → "Loop container". An outer rounded rect framing a simple flowchart.

| Element            | Coordinates                                |
|--------------------|--------------------------------------------|
| Container rect     | `x=20 y=40 w=640 h=H−60 rx=20`, class `box`|
| Title              | `(340, 72)`, class `th`                    |
| Subtitle           | `(340, 92)`, class `ts`                    |
| First inner box y  | ≥ 116                                      |
| Inner safe area    | `x ∈ [40, 620]`                            |
| Bottom padding     | 20px                                       |

After placing the inner flow, compute `inner_bottom = max y of any inner element`, then `H = inner_bottom + 40` and `container_h = H − 60`.

## Arrow routing

Every arrow has a start point (source box edge) and an end point (target box edge), with an optional bend in between.

**Direct arrow** — when source and target are aligned on an axis (same x for vertical, same y for horizontal):

```svg
<line x1="200" y1="76" x2="200" y2="120" class="arr" marker-end="url(#arrow)"/>
```

Leave **10px** between the arrow's endpoint and the target box's top edge so the arrowhead doesn't touch the border.

**L-bend arrow** — when the direct line would cross another box:

```svg
<path d="M x1 y1 L x1 ymid L x2 ymid L x2 y2" class="arr" fill="none" marker-end="url(#arrow)"/>
```

- `ymid` is a horizontal "channel" chosen to thread cleanly between the two levels
- Always include `fill="none"` on `<path>` used as a connector — SVG defaults to black fill

**Collision check.** Before finalizing every arrow, trace its path against every rect you've already placed:

```
for each rect R in the diagram:
  if rect R is not the source or target of this arrow:
    does the arrow's line segment intersect the interior of R?
    if yes: use an L-bend to route around R
```

This is the #1 diagram failure mode. Arrows slashing through unrelated boxes.

**Connection-point convention.** Every arrow anchors to the midpoint of a box edge (top, bottom, left, or right), never to a corner. With `rx="6"` or `rx="12"` rounded corners, the actual corner curve occupies the first ~6–12px of each edge — so stay **≥20px from any corner** when picking a connection point. An arrow that enters a box 4px from its corner reads as "touching the rounded curve" instead of "attached to the edge", and the arrowhead looks smeared. For a 180-wide rect, valid top-edge connection points sit at `x ∈ [rect_x + 20, rect_x + 160]`; the outer 20px on each side belong to the corner radius.

**Multi-arrow stagger.** When two or more arrows terminate on the same edge of the same box from different sources (three fan-in arrows hitting a single aggregator; two feedback lines returning to a start node), stagger their arrival points by **≥12px** along the target edge. Example: three arrows fanning into the top edge of a 180-wide box sit at `target_x − 24`, `target_x`, `target_x + 24`. Same rule applies to horizontal arrows converging on a left/right edge (stagger the y by ≥12px). Without the stagger, the arrowheads stack on top of each other and the reader can't tell how many incoming edges there are — a 3-to-1 fan-in reads as a single thick arrow.

## text-anchor safety

`text-anchor` controls which point of the text aligns to the `x` coordinate:

- `"start"` — x is the left edge. Text extends right.
- `"middle"` — x is the horizontal center. Text extends both ways.
- `"end"` — x is the right edge. Text extends left.

**Danger**: `text-anchor="end"` at low x values. If `x=50` and the label is 200px wide, the text starts at `x = -150` — outside the viewBox. Check: `label_chars × 8 < x` must hold for `text-anchor="end"` labels.

**Default to `text-anchor="start"` on the left side and `"middle"` in the center.** Use `"end"` only when you've verified the x coordinate is high enough.

## Vertical text centering inside a rect

Every `<text>` inside a rect needs `dominant-baseline="central"`. Without it, SVG treats `y` as the baseline — the glyph body sits ~4px above where you think and descenders hit the next line.

```svg
<rect x="100" y="20" width="180" height="44" rx="6" class="c-blue"/>
<text class="th" x="190" y="42" text-anchor="middle" dominant-baseline="central">Login</text>
```

For a rect at `(x, y, w, h)`:
- Single line centered: `text_x = x + w/2`, `text_y = y + h/2`, `dominant-baseline="central"`
- Two lines (44 + 14 layout inside a 56-tall box):
  - Title: `text_y = y + 20` (center of top 40px)
  - Subtitle: `text_y = y + 40` (center of bottom 16px)
  - Both use `dominant-baseline="central"`

## Quick-reference sizes

Standard dimensions that work well and keep the diagram rhythm consistent:

| Element                     | Size                 |
|-----------------------------|----------------------|
| Single-line node height     | 44 px                |
| Two-line node height        | 56 px                |
| Default node width          | 180 px (adjust up)   |
| Minimum gap between nodes   | 20 px horizontal, 60 px vertical |
| Container padding           | 20 px                |
| Rect corner radius          | `rx="6"` (subtle), `rx="12"` (container), `rx="20"` (outer container) |
| Connector stroke width      | 1.5 px (set by `.arr`) |
| Diagram border stroke       | 0.5 px                |
| Viewport safe margin        | 40 px on each edge    |

Stick to these unless you have a concrete reason to deviate.
