# Structural Diagram

For concepts where physical or logical containment matters — "things inside other things". A large outer container with smaller regions inside it, labeled, and optionally connected by arrows or external inputs and outputs.

## When to use

- "How is X organised" / "what's the architecture" / "where does Y live"
- File systems (blocks inside inodes inside partitions)
- Cloud topologies (instance inside subnet inside VPC)
- Biological containment (organelles inside cells)
- Service architectures with clear boundaries (microservices inside a service mesh inside a cluster)
- CPU cache hierarchies (L1 inside core, L2 shared between cores)

**When not to use:** if the explanation is about *what happens over time*, reach for a flowchart. Containment diagrams answer "where", flowcharts answer "what order".

## Container rules

### Outer container

- Large rounded rect
- `rx="20"` (or up to 24 if the diagram needs a softer feel)
- Light fill (stop 50) and 0.5px stroke (stop 600) — both come automatically from the `c-{ramp}` class
- Label sits at the top-center inside the container, 20–30px down from the top edge, as a `th` title
- A short subtitle can sit 18px below the title, as a `ts`

Example frame:

```svg
<g class="c-green">
  <rect x="60" y="40" width="560" height="300" rx="20"/>
  <text class="th" x="340" y="72" text-anchor="middle" dominant-baseline="central">VPC</text>
  <text class="ts" x="340" y="92" text-anchor="middle" dominant-baseline="central">us-east-1</text>
</g>
```

### Inner regions

- Medium rounded rects, `rx="10"` (8–12 range)
- Different color ramp from the parent (see "Color pairing" below)
- 20px minimum padding between the inner region edge and the container edge on all sides
- 16px minimum gap between adjacent inner regions
- Same dimensions as a flowchart node: 44px tall for single-line, 56px for two-line, or larger rects (100+ tall) to represent regions of space

### Nesting depth

Maximum **2–3 levels**. Deeper nesting gets unreadable at 680px width. If you need four levels, split into two diagrams: the outer two levels in one diagram, then a detail diagram zooming into one of the inner regions.

## Color pairing

When you nest containers, pick ramps that *relate* rather than clash. A library branch + circulation desk is clearly two parts of one building, so use related cool ramps (green outer, teal inner). A library branch + café is two functionally different spaces, so use one cool and one warm (green + amber).

**Rule of thumb**:
- Same-category nesting → related cool ramps (green + teal, blue + teal, purple + pink)
- Different-category nesting → one cool + one warm (green + amber, blue + coral)
- Structural/neutral containers → gray + any accent

The key point: don't reuse the same ramp on parent and child. The template's `c-{ramp}` classes resolve to fixed fill/stroke stops, so a nested `c-blue` inside a parent `c-blue` gives identical fills — the hierarchy flattens visually.

## Layout

Inner regions sit **side by side** inside the container, not stacked unless you have a tall narrow container (e.g., a CPU cache hierarchy with L1 on top of L2 on top of L3). Horizontal layout is the default because the viewBox is 680 wide — you have room for 2–3 regions across but only 1–2 stacked vertically before it gets too tall.

Example layout math for 2 inner regions inside a 560-wide container:

```
container: x=60, width=560
inner padding: 20 on each side → inner safe area is x=80 to x=600, width 520
gap between regions: 20
region width: (520 - 20) / 2 = 250
region A: x=80, width=250
region B: x=350, width=250
```

For 3 inner regions:

```
inner safe area: width 520
gaps: 2 × 20 = 40
region width: (520 - 40) / 3 ≈ 160
regions at x = 80, 260, 440 (all width 160)
```

## External inputs and outputs

Arrows entering or leaving the container represent external data, requests, or physical flows. They sit outside the container with arrows pointing in or out:

```svg
<text class="ts" x="40" y="185" text-anchor="middle">Request</text>
<line x1="40" y1="200" x2="58" y2="200" class="arr" marker-end="url(#arrow)"/>
```

Rules:
- External labels are ≤2 words ("Request", "Output", "Cold water", "Sunlight"). Long labels belong in prose around the diagram.
- Place the text label directly above the arrow, `text-anchor="middle"` aligned with the arrow's horizontal center.
- Leave 2px of gap between the arrow endpoint and the container edge.
- If you have multiple inputs/outputs, stack them vertically at the same x coordinate with 40–60px spacing between them.

## Internal arrows between regions

Sometimes two inner regions talk to each other. Draw an arrow between them with a short text label centered above or below:

```svg
<text class="ts" x="305" y="175" text-anchor="middle">Books</text>
<line x1="330" y1="185" x2="370" y2="185" class="arr" marker-end="url(#arrow)"/>
```

Keep these labels to 1–2 words. If the arrow's meaning is obvious from the region names (e.g., "Request Router" → "Auth Service"), skip the label entirely.

## What goes inside a region

Text only. A region is not a container for another flowchart — if you find yourself drawing a nested flowchart inside a region, you've reached the nesting limit. Split it into a separate diagram.

Each region has:
- A title (`th` class, 14px bold)
- An optional subtitle (`ts` class, 12px, ≤5 words) describing what happens there
- Nothing else. No icons, no illustrations, no mini-boxes inside

**Exception — subsystem architecture pattern.** When the topic is "two or three parallel subsystems cooperating" (see "Subsystem architecture pattern" below), each sibling container *may* contain a short internal flow of up to 5 flowchart-style nodes with arrows between them. This is the only structural layout where a region holds more than text, and the 5-node cap is a hard ceiling. If you need more than 5 nodes inside a region, the pattern isn't the right shape — split the inner flow into its own flowchart diagram and keep the structural diagram at the containment level.

## Worked example

Request: "AWS VPC with a web tier and a database tier"

Plan:
- Outer container: VPC (green, subtitle "us-east-1")
- Two inner regions side by side: "Public subnet" (teal, subtitle "Web servers") and "Private subnet" (blue, subtitle "Database")
- External input arrow: "Internet" → public subnet
- Internal arrow: public subnet → private subnet, labeled "SQL"

Layout:
- Container at x=80, y=40, width=540, height=280 → `rx="20"`
- Public subnet at x=120, y=140, width=220, height=140 → `rx="10"` (inside container with 40px padding from left, 60px below title)
- Private subnet at x=380, y=140, width=220, height=140
- Container title at y=72, subtitle at y=92
- External "Internet" arrow: from (48, 210) to (78, 210) pointing right, with text at (48, 196)
- Internal "SQL" arrow: from (350, 210) to (378, 210), with text at (364, 196)

viewBox: max_y = 40 + 280 = 320 → H = 340

## Subsystem architecture pattern

A variant for topics that have **two or three parallel subsystems cooperating** — the canonical shape is "two sibling dashed-border containers, each holding a short internal flow, with a labeled cross-system arrow linking them". Unlike the default structural diagram (outer container + inner regions), this pattern places the subsystems *side by side at the top level* and lets each one carry its own mini-flowchart.

**When to use**:

- "Pi session + background analyzer" — foreground conversation and a separate analyzer running in parallel
- "Prompt engineering vs. context engineering" — two frameworks shown side by side with their internal loops
- "Producer subsystem + consumer subsystem" — a queue-like split where each side has its own internal pipeline
- "Foreground + background" workflows — any time you're comparing two pipelines that share data across a boundary

**When not to use**:

- Containment — one thing is *inside* another. Use the default outer-container pattern instead.
- A single pipeline with no peer system. That's just a flowchart.
- More than 3 siblings. Three is the hard ceiling; four already blows the horizontal budget.

### Sibling containers

Each sibling is a **dashed-border** rounded rect. Use **inline `stroke-dasharray="4 4"`** on the rect rather than a CSS class — dashed is a one-off container style, not a reusable shape property, so the template's class list stays stable. The stroke color still comes from a `c-{ramp}` class on the wrapping `<g>` so dark mode works.

```svg
<g class="c-gray">
  <rect x="20" y="40" width="315" height="260" rx="20"
        fill="none" stroke-dasharray="4 4"/>
  <text class="th" x="40" y="64" dominant-baseline="central">Pi session</text>
  <text class="ts" x="40" y="82" dominant-baseline="central">Foreground conversation</text>
</g>
```

Rules:
- **Fill is `none`.** The dashed border reads as "this is a schematic region", not "this is a solid box". A filled sibling container fights with its internal nodes for the reader's attention.
- **Stroke comes from the `c-{ramp}` class.** Dark-mode handling is automatic.
- **Title at top-left**, not top-center — siblings compete for the top-center axis, so pull each title to the inside corner. Title at `(container_x + 20, container_y + 24)`, `text-anchor="start"`.
- **Optional subtitle** (`ts`) directly below the title at `y = title_y + 18`, also left-anchored. ≤5 words.
- **Pick ramps so the siblings feel related but distinct.** Same-category (foreground + background → gray + teal). Different-category (prompt engineering + context engineering → purple + teal). Never use the same ramp on both siblings.

### Layout math (2-up)

See `layout-math.md` → "Sibling subsystem containers (2-up)" for the full formula. The standard geometry:

```
container A    x=20,  y=40, w=315, h=260,  rx=20
container B    x=345, y=40, w=315, h=260,  rx=20
gap            = 10 px
interior A     x=40  to x=315    (width 275)
interior B     x=365 to x=640    (width 275)
```

### Internal nodes inside a sibling

A sibling container may hold **up to 5 flowchart-style nodes** with arrows between them — this is the explicit exception to the "region is text only" rule in the "What goes inside a region" section above. Use the standard flowchart node templates (`c-{ramp}` rect 44 or 56 tall). Center each node at the interior x (`container_x + container_w/2`) unless there's a specific left-to-right sub-flow.

Keep the internal flow **vertical** inside each sibling. The 275px interior width isn't enough for a horizontal pipeline of 3+ nodes with proper breathing room, and a vertical stack gives the cross-system arrow somewhere clean to land.

Rules:
- **≤5 nodes per sibling**. Hard cap. More than that and the pattern isn't the right shape.
- **Same title color as the container** — the internal nodes inherit the sibling's ramp unless one specific node deserves a second accent color.
- **Node width ≤ 235** (interior 275 minus 20px padding each side), typically 180.
- **No nested sibling containers.** A sibling cannot itself be a subsystem architecture diagram.

### Cross-system arrows

The point of the pattern is usually the **labeled arrows** crossing between siblings. Draw them across the 10px container gap. Unlike the external-input arrows at the top of this file, cross-system arrows get a label above (not beside) and use the solid `.arr` class.

```svg
<text class="ts" x="340" y="136" text-anchor="middle">Event</text>
<line x1="315" y1="146" x2="345" y2="146" class="arr" marker-end="url(#arrow)"/>
```

Rules:
- **Label ≤3 words.** "Event", "Session context", "Summary write-back". Anything longer belongs in prose.
- **Label position**: centered horizontally at the gap midpoint (`x=340` for the 20-345 layout), `y = arrow_y − 10`, `text-anchor="middle"`, `class="ts"`.
- **Arrow row**: `y` matches the row of the source and target nodes so the line is flat. If the source is on row 1 and the target on row 2, pick the row closer to where the reader's eye lands (usually the target).
- **Bidirectional exchanges**: draw two separate single-headed arrows at slightly offset y values (`y` and `y + 12`), each with its own label. Never use a double-headed marker — the asymmetry of the two labels *is* the information.

### Worked example — Pi session + Background analyzer

Two siblings: a foreground conversation (`Pi session`, gray) and a background analyzer (`Background analyzer`, teal). The session emits events to the analyzer; the analyzer writes summaries back into the session's memory.

Plan:
- Container A "Pi session" at x=20, w=315, h=260
- Container B "Background analyzer" at x=345, w=315, h=260
- Three internal nodes in each sibling, stacked vertically
- Two cross-system arrows: row 1 left→right labeled "Event", row 3 right→left labeled "Summary"
- viewBox: `max_y = 40 + 260 = 300` → H = 320

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" font-family="...">
  <style>...</style>
  <defs><marker id="arrow" .../></defs>

  <g class="c-gray">
    <rect x="20" y="40" width="315" height="260" rx="20"
          fill="none" stroke-dasharray="4 4"/>
    <text class="th" x="40" y="64" dominant-baseline="central">Pi session</text>
    <text class="ts" x="40" y="82" dominant-baseline="central">Foreground conversation</text>
  </g>

  <g class="c-teal">
    <rect x="345" y="40" width="315" height="260" rx="20"
          fill="none" stroke-dasharray="4 4"/>
    <text class="th" x="365" y="64" dominant-baseline="central">Background analyzer</text>
    <text class="ts" x="365" y="82" dominant-baseline="central">Runs in parallel</text>
  </g>

  <g class="c-gray">
    <rect x="87"  y="118" width="180" height="44" rx="6"/>
    <text class="th" x="177" y="140" text-anchor="middle" dominant-baseline="central">User turn</text>
  </g>
  <g class="c-gray">
    <rect x="87"  y="180" width="180" height="44" rx="6"/>
    <text class="th" x="177" y="202" text-anchor="middle" dominant-baseline="central">Pi responds</text>
  </g>
  <g class="c-gray">
    <rect x="87"  y="242" width="180" height="44" rx="6"/>
    <text class="th" x="177" y="264" text-anchor="middle" dominant-baseline="central">Memory updated</text>
  </g>

  <g class="c-teal">
    <rect x="412" y="118" width="180" height="44" rx="6"/>
    <text class="th" x="502" y="140" text-anchor="middle" dominant-baseline="central">Analyze turn</text>
  </g>
  <g class="c-teal">
    <rect x="412" y="180" width="180" height="44" rx="6"/>
    <text class="th" x="502" y="202" text-anchor="middle" dominant-baseline="central">Write summary</text>
  </g>
  <g class="c-teal">
    <rect x="412" y="242" width="180" height="44" rx="6"/>
    <text class="th" x="502" y="264" text-anchor="middle" dominant-baseline="central">Push to memory</text>
  </g>

  <line x1="177" y1="162" x2="177" y2="180" class="arr" marker-end="url(#arrow)"/>
  <line x1="177" y1="224" x2="177" y2="242" class="arr" marker-end="url(#arrow)"/>
  <line x1="502" y1="162" x2="502" y2="180" class="arr" marker-end="url(#arrow)"/>
  <line x1="502" y1="224" x2="502" y2="242" class="arr" marker-end="url(#arrow)"/>

  <text class="ts" x="340" y="130" text-anchor="middle">Event</text>
  <line x1="267" y1="140" x2="412" y2="140" class="arr" marker-end="url(#arrow)"/>

  <text class="ts" x="340" y="254" text-anchor="middle">Summary</text>
  <line x1="412" y1="264" x2="267" y2="264" class="arr" marker-end="url(#arrow)"/>
</svg>
```

Notes on this example:
- The two sibling containers are drawn **first** in source order so every internal node paints on top of the dashed border.
- The cross-system arrows are labeled above and span the 10px gap plus the 20px padding on each side (so the actual horizontal run is 267 → 412 = 145px).
- The "Event" label sits above the top cross-system arrow, the "Summary" label above the bottom one — both ≤2 words, both `class="ts"`, both `text-anchor="middle"` centered at x=340 (the midpoint of the 10px gap).
- Row-to-row internal arrows inside each sibling are standard vertical `.arr` lines between node top/bottom edges with a 10px stand-off.

## Bus topology sub-pattern

For topics where N agents all publish to and subscribe from a **shared message bus** — *"multiple workers coordinating via a central channel"*, image #7 (Message Bus) in the Anthropic reference set. A central horizontal bar represents the bus; agents sit in a row above and below it, each connected via a pair of offset arrows (see `glyphs.md` → "Publish/subscribe arrow pair").

**When to use.**

- "Message bus / event bus coordination"
- "Pub/sub topology with N publishers and N subscribers"
- "Shared queue everyone reads and writes"
- The reader needs to feel that *no agent talks to another agent directly* — all coordination passes through the bus.

**When not to use.** If the coordination is point-to-point (agent A only talks to agent B), it's just a structural arrow. If there's a clear orchestrator controlling the workers, use the "Rich interior for subsystem containers" fan-out variant below (image #9 left half), not the bus topology.

### Geometry

The bus bar is the visual spine of the diagram. Agents fan out above and below it. See also `layout-math.md` → "Bus topology geometry".

| Element              | Coordinates                                               |
|----------------------|-----------------------------------------------------------|
| Bus bar              | `x=40 y=280 w=600 h=40 rx=20`, class `c-amber` or `c-gray`|
| Bus label            | `(340, 304)`, class `th`, `text-anchor="middle"`          |
| Top agent row y      | `80` (box top); `h=60` (two-line)                         |
| Bottom agent row y   | `400` (box top); `h=60`                                   |
| Agent row box width  | 140 (three agents) or 180 (two agents) or 110 (four)      |

For **N=3 agents per row** (6 total), center the three agents at `x = 170, 340, 510` with `w=140`. For N=4 per row (8 total), center at `x = 120, 260, 420, 560` with `w=110`. For N=2 per row (4 total), center at `x = 180, 500` with `w=180`.

The bus bar uses `c-amber` when it's the "shared channel" of a message-bus system (amber = attention, the central thing everyone looks at) or `c-gray` when it's just structural scaffolding. Never use a cool ramp for the bus bar — the bus should feel active.

### Arrow pairs

Each agent connects to the bus with a **pair** of offset arrows: Publish (agent → bus) and Subscribe (bus → agent). The pair uses an 8px horizontal offset so the two arrows read as parallel, not concentric. See `glyphs.md` → "Publish/subscribe arrow pair" for the exact template.

For the top row, each agent's bottom edge is at `y=140`, the bus top is at `y=280`, so the arrow channel is 140px tall. Place the Publish/Subscribe labels at the channel midpoint (y=210):

```svg
<!-- Top agent at center x=340, publishing down and subscribing up -->
<line class="arr" x1="332" y1="140" x2="332" y2="280" marker-end="url(#arrow)"/>
<line class="arr" x1="348" y1="280" x2="348" y2="140" marker-end="url(#arrow)"/>
<text class="ts" x="324" y="214" text-anchor="end">Publish</text>
<text class="ts" x="356" y="214">Subscribe</text>
```

For the bottom row, mirror the y coordinates: agent top at `y=400`, bus bottom at `y=320`. The Subscribe arrow now goes up out of the bus into the agent; Publish goes down out of the agent into the bus.

### Labels on the bus bar

The bus bar is **always labeled** — a reader who can't tell if the central bar is "a bus" or "a queue" or "a shared log" will read the diagram wrong. Put a single `th` label at the bar's center: "Message bus", "Event bus", "Shared log", "Task queue". If the bus semantics need a second word, use a `ts` subtitle below the label (still inside the 40px-tall bar, `y = bar_y + 28`).

### Dark mode

All the bus-topology elements use `c-{ramp}` classes and stock `arr` utilities, so dark mode is automatic. The only thing to watch: if you used inline `stroke="#..."` on the Publish/Subscribe arrows, they won't invert. Use the unadorned `.arr` class and let the template's dark-mode override handle color.

## Radial star topology sub-pattern

For topics where a **central hub** is surrounded by N peripheral satellites that all talk to it bidirectionally — *"shared state with four workers"*, image #8 (Shared State). The hub is a single labeled box in the center; the satellites are smaller boxes at the four corners (or at radial offsets for N≠4).

**When to use.**

- "Shared state store with multiple accessors"
- "Central coordinator with N workers" where coordinator semantics are read/write, not command/control
- "Hub-and-spoke" architectures

**When not to use.** If the hub is the orchestrator *and* issues commands (one-way), it's a fan-out, not a radial star. If the satellites talk to each other (not just to the hub), the topology is a mesh, not a radial star — that's usually a sign to switch to a bus topology instead.

### Geometry (N=4)

See also `layout-math.md` → "Radial star geometry (3 / 4 / 5 / 6 satellites)".

| Element              | Coordinates                                |
|----------------------|--------------------------------------------|
| Hub                  | `x=260 y=280 w=160 h=80 rx=10`             |
| Satellite TL         | `x=60  y=120 w=160 h=60`                   |
| Satellite TR         | `x=460 y=120 w=160 h=60`                   |
| Satellite BL         | `x=60  y=460 w=160 h=60`                   |
| Satellite BR         | `x=460 y=460 w=160 h=60`                   |
| Hub center           | `(340, 320)`                               |
| Satellite centers    | `(140, 150)`, `(540, 150)`, `(140, 490)`, `(540, 490)` |

Hub is 80 tall to hold a 3-line label (title + subtitle + doc-icon if used). Satellites are 60 tall for a standard two-line label. viewBox H ≈ 560.

### Arrow pairs (bidirectional)

Each satellite connects to the hub with two single-headed arrows offset by 8px **perpendicular to the arrow direction**. For the top-left satellite, the arrow runs diagonally from `(220, 180)` to `(260, 280)` (approximately); offset the two lines by `(±4, ∓4)` to get clean parallel channels:

```svg
<!-- Top-left satellite to hub: outbound (satellite→hub) on top, inbound on bottom -->
<line class="arr" x1="224" y1="176" x2="264" y2="276" marker-end="url(#arrow)"/>
<line class="arr" x1="216" y1="184" x2="256" y2="284" marker-end="url(#arrow)"/>
```

Label each pair with a single `ts` label sitting *next to* the pair, not between the two lines (the 8px offset is too narrow for a label to fit). For diagonal pairs, place the label at the satellite end:

```svg
<text class="ts" x="230" y="198" text-anchor="start">Read / write</text>
```

Or use one label per direction if the semantics differ (`Query` outbound, `Result` inbound).

### Hub content

The hub is the one place in a structural diagram where a **decorative icon** is allowed: drop a `doc-icon` or `terminal-icon` from `glyphs.md` into the lower half of the hub rect to reinforce what kind of hub it is. See `glyphs.md` → "Document & terminal icons" for placement math.

```svg
<g class="c-amber">
  <rect x="260" y="280" width="160" height="80" rx="10"/>
  <text class="th" x="340" y="302" text-anchor="middle">Shared state</text>
  <text class="ts" x="340" y="320" text-anchor="middle">Task artifacts</text>
  <!-- doc-icon placed at bottom-center of hub -->
  <g transform="translate(328, 324)">
    <path class="arr" d="M2 2 L16 2 L22 8 L22 26 L2 26 Z" fill="none"/>
    <path class="arr" d="M16 2 L16 8 L22 8" fill="none"/>
    <line class="arr" x1="6" y1="14" x2="18" y2="14"/>
    <line class="arr" x1="6" y1="18" x2="18" y2="18"/>
    <line class="arr" x1="6" y1="22" x2="14" y2="22"/>
  </g>
</g>
```

### Color budget

The hub takes the accent ramp (amber is the convention for shared-state hubs — everyone looks at it). Satellites stay **neutral** (`c-gray`) unless one satellite is distinguished from the others. Mixing four different ramps on four satellites is "rainbow" — it implies four different kinds of worker, which isn't what a radial star is saying.

### N≠4 variants

See `layout-math.md` for the full coordinate table. Summary:

- **N=3**: satellites at `(140, 100)`, `(540, 100)`, `(340, 500)` (two on top, one bottom center).
- **N=5**: four corners as in N=4, plus one at `(340, 100)` top center.
- **N=6**: three on top at `x=100, 340, 580` and three on bottom at the same x's (y=100 top, y=500 bottom).

Beyond N=6 the pattern doesn't fit the 680 viewBox — switch to a bus topology.

## Rich interior for subsystem containers

The base subsystem-container rule from "Subsystem architecture pattern" above says each sibling holds *up to 5 flowchart-style nodes in a vertical column*. This sub-section extends that rule: a sibling may instead hold **any one** of the following interior layouts. Each has its own geometry within the 315-wide container; mix-and-match across siblings is fine (e.g., container A holds a checklist, container B holds a DAG).

Pick the interior type that matches the subsystem's semantics:

| Interior type             | Use for                                                | See                                          |
|---------------------------|--------------------------------------------------------|----------------------------------------------|
| Vertical flowchart        | Sequential pipeline (the default)                      | "Internal nodes inside a sibling" above      |
| Fan-out (hub + ≤3 branches) | Orchestrator dispatching to workers (image #9 left)  | Below                                        |
| Queue + vertical fan-out  | Worker pool with a shared queue (image #9 right)       | Below                                        |
| Mini bus topology         | Bus-coordinated workers (image #10 right)              | Below                                        |
| Checklist                 | Task list using `checkbox-*` glyphs (image #4 left)    | `glyphs.md` → "Checkboxes"                   |
| DAG (≤6 nodes)            | Task graph with dependencies (image #4 right)          | Below                                        |
| Nested container + gadget | Thing-within-a-thing + attached tool (image #14)       | "Attached gadget box" below                  |

### Fan-out interior

Hub box + three worker boxes in a vertical column, inside a 315-wide container at x=20 or x=345.

| Element       | Container A (x=20)              | Container B (x=345)             |
|---------------|---------------------------------|---------------------------------|
| Hub box       | `x=50  y=120 w=120 h=44 rx=6`   | `x=375 y=120 w=120 h=44 rx=6`   |
| Worker 1      | `x=195 y=100 w=120 h=44`        | `x=520 y=100 w=120 h=44`        |
| Worker 2      | `x=195 y=160 w=120 h=44`        | `x=520 y=160 w=120 h=44`        |
| Worker 3      | `x=195 y=220 w=120 h=44`        | `x=520 y=220 w=120 h=44`        |
| Bend channel  | `x=185`                         | `x=510`                         |

Route each worker arrow as a short L-bend: hub right-edge → bend channel → worker left-edge. The same routing logic as `flowchart.md` → "Vertical fan-out", scaled to the 315-wide container.

### Queue + vertical fan-out interior

Same as the fan-out interior but the hub box carries a `queue-slot` row in its bottom half (see `flowchart.md` → "Queue glyph inside a box"). Hub box height grows to 52 to accommodate the glyph row:

| Element       | Coordinates (container A)         |
|---------------|-----------------------------------|
| Hub (queue)   | `x=50  y=116 w=120 h=52 rx=6`     |
| Workers       | same as fan-out interior          |

Hub title `y = 134`, queue row `y = 146`, 4 slots at `x = 62, 82, 102, 122`. (Fewer slots than the full 6 because the container is narrow.)

### Mini bus topology interior

A small bus bar and 2–3 mini-agents above/below it, scaled down to fit inside a 315-wide container:

| Element          | Container A (x=20)                |
|------------------|-----------------------------------|
| Bus bar          | `x=40  y=200 w=275 h=28 rx=14`    |
| Bus label        | `(177, 218)`, `th`                |
| Top agent 1      | `x=50  y=110 w=100 h=44`          |
| Top agent 2      | `x=195 y=110 w=100 h=44`          |
| Bottom agent 1   | `x=50  y=260 w=100 h=44`          |
| Bottom agent 2   | `x=195 y=260 w=100 h=44`          |

The mini bus drops the Publish/Subscribe text labels (no room) and just shows the offset arrow pairs — the outer container's title already names the pattern. Use `c-amber` on the bus bar.

### DAG interior

Up to 6 small boxes connected by L-bend arrows, representing a task graph with dependencies. Use this for image #4's "Tasks" right-side panel.

Boxes are small (80 × 32) and laid out on a 3-column × 2-row grid inside the container:

| Grid position   | x (container A) | x (container B) |
|-----------------|-----------------|-----------------|
| Column 1        | 40              | 365             |
| Column 2        | 145             | 470             |
| Column 3        | 250             | 575             |

Box height: 32. Row y: `120, 200`. `rx=4` (smaller than standard 6 because the boxes are tight).

Dashed future-state nodes (`arr-alt` class — see "Dashed future-state node" below) intermix with solid nodes in the same grid, representing the not-yet-scheduled parts of the graph.

### Checklist interior

A column of `checkbox-*` glyphs plus `t` labels inside the container. See `glyphs.md` → "Checklist rows" for row geometry. For a 315-wide container:

- First row at `y = 116`
- Row pitch: 22
- Checkbox anchor at `x = container_x + 20`
- Label anchor at `x = container_x + 42`
- Label width budget: container interior width − 42 − 20 = 253 px (≈31 Latin / 16 CJK chars)

Up to 8 rows fit in a 260-tall container (8 × 22 = 176, plus header + padding).

## Mixed arrow semantics

Sub-pattern for diagrams — especially advisor-strategy and multi-agent architectures (image #11) — where **multiple kinds of relationships** exist on the same canvas: synchronous call, asynchronous notification, read/write data flow, and a reentry loop. Using `.arr` for all of them strips the distinction; using random colors for different line types triggers the "color rainbow" pitfall.

The solution is a **4-class arrow vocabulary** with a tiny legend strip inside the container.

### The vocabulary

| Arrow style                     | CSS class         | Semantic                                   | Typical label       |
|---------------------------------|-------------------|--------------------------------------------|---------------------|
| Solid 1.5px                     | `arr` / `arr-{ramp}` | Synchronous call, required path            | "calls", "invokes"  |
| Dashed 1.5px                    | `arr-alt`         | Asynchronous, optional, conditional         | "notifies", "may call" |
| Two offset single-headed arrows | `arr` ×2          | Bidirectional read/write on shared resource | "read / write"      |
| U-shaped reentry path           | `arr`             | Main loop, reentry to top of flow           | "loop"              |

This is the only place in the skill that **four distinct line styles** appear in one diagram — elsewhere, two is the cap. The cost of richness is a required legend strip.

### Legend strip

Place a one-line mini-legend inside the container at the top, below the container title, using `ts`-class text and tiny 20px example line segments:

```svg
<g transform="translate(40, 108)">
  <!-- Solid = calls -->
  <line class="arr" x1="0"  y1="6" x2="20" y2="6" marker-end="url(#arrow)"/>
  <text class="ts" x="24" y="10">calls</text>
  <!-- Dashed = notifies -->
  <line class="arr-alt" x1="80"  y1="6" x2="100" y2="6" marker-end="url(#arrow)"/>
  <text class="ts" x="104" y="10">notifies</text>
  <!-- Pair = read/write -->
  <line class="arr" x1="170" y1="2" x2="190" y2="2" marker-end="url(#arrow)"/>
  <line class="arr" x1="190" y1="10" x2="170" y2="10" marker-end="url(#arrow)"/>
  <text class="ts" x="194" y="10">read / write</text>
</g>
```

Keep the legend to 3–4 entries (the ones that actually appear in the diagram — don't document every possible edge type). The legend is always `ts` muted, never accent color — it's meta-information.

### U-shaped reentry loop

A solid arrow path that exits the right side of the final node, arcs around the bottom of the diagram, and re-enters the left side of the first node. Used for "main loop runs every turn" semantics.

```svg
<path class="arr"
      d="M 560 200 L 600 200 L 600 330 L 80 330 L 80 200 L 120 200"
      fill="none" marker-end="url(#arrow)"/>
<text class="ts" x="340" y="324" text-anchor="middle">runs every turn</text>
```

The horizontal return channel (`y=330` in the example) must lie in empty space below all other boxes. If it can't, use a `↻ runs every turn` text label next to the final node instead, same as the simple-flowchart return convention.

### Pitfall

Don't invent new arrow classes (`.arr-read`, `.arr-write`, `.arr-async`). The four-style vocabulary above is comprehensive; anything else is a template change and breaks the "minimal CSS" rule. If your diagram genuinely needs a 5th semantic, you're asking one diagram to do too much — split it.

## Multi-line box body

Most structural boxes hold one or two lines of text. Advisor-strategy and agent-role diagrams (image #11) sometimes need **three-line boxes**: a title, a role/kind subtitle, and a meta line like "runs every turn" or "executor · sonnet". This sub-section documents the layout.

### Geometry

| Element         | Coordinates                        |
|-----------------|------------------------------------|
| Host rect       | `h = 80`, `rx=6`, `w ≥ 180`        |
| Title `th`      | `y = rect_y + 22`, `text-anchor="middle"` |
| Role `ts`       | `y = rect_y + 42`, italic (see below) |
| Meta `ts`       | `y = rect_y + 62`, muted (see below)  |

Row pitch is 20 (tight). The 80px total is the minimum — if you need more breathing room, grow to 88 or 92, but never less than 80.

### Style variations on the two subtitles

The `ts` class renders as muted 12px in both modes. For the role line (middle), apply italic via an inline `font-style="italic"` attribute. For the meta line (bottom), leave it plain `ts` — it inherits the muted color automatically.

```svg
<g class="c-teal">
  <rect x="80" y="140" width="180" height="80" rx="6"/>
  <text class="th" x="170" y="162" text-anchor="middle">Advisor</text>
  <text class="ts" x="170" y="182" text-anchor="middle" font-style="italic">opus · reasoning</text>
  <text class="ts" x="170" y="202" text-anchor="middle">runs every turn</text>
</g>
```

### Pitfall

Three-line boxes are dense. Don't use them when a two-line box will do. If you find yourself adding a third line *to every box* in the diagram, the diagram is carrying too much information — move the metadata out to the annotation column or a caption.

## Attached gadget box

A small "attached tool" box that hangs off a parent box via a short connector with no arrowhead. Used in image #14 (Code execution vs. Dedicated tool) to show that "Tools" is an attached capability of the Claude box, not a peer or a pipeline step.

### Geometry

| Element       | Coordinates relative to parent                      |
|---------------|------------------------------------------------------|
| Connector     | from `(parent_cx, parent_bottom)` to `(parent_cx, parent_bottom + 24)`, class `arr` **without** `marker-end` |
| Child rect    | `x = parent_cx − 60`, `y = parent_bottom + 24`, `w=120 h=56 rx=6` |
| Child title   | `y = child_y + 22`, `th`                            |
| Child subtitle | `y = child_y + 40`, `ts`                           |

The child is centered under the parent. The short connector is a plain line (no arrow) — the gadget is attached, not called.

### Color

The gadget box inherits the parent's ramp if it's a direct extension (Claude + Tools → both `c-amber`). If the gadget is a *distinct thing attached to* the parent (Claude + External database → `c-amber` Claude + `c-gray` database), color them separately.

### Pitfall

Don't over-use this. One attached gadget per diagram is fine; three or more and the gadgets start to look like real workflow steps. If you need to attach three things to a parent, you're describing a fan-out, not gadgetry.

## Dashed future-state node

Sub-pattern for diagrams that distinguish **current state** (active, realized) from **future state** (planned, not yet scheduled) — image #4's "Tasks" panel, where Task 4 sits ghosted in the DAG because it hasn't been assigned yet.

### The rule

Use the existing `.arr-alt` class on the rect. It already provides `fill: none`, `stroke-width: 1.5`, `stroke-dasharray: 5 4`, and dark-mode handling:

```svg
<g>
  <rect class="arr-alt" x="200" y="180" width="120" height="44" rx="6"/>
  <text class="ts" x="260" y="205" text-anchor="middle">Task 4</text>
</g>
```

**Do not** create a new `.box-future` CSS class. The template's class list stays stable — future-state styling is fully expressible with what already exists.

**Do not** put a title (`th`) inside a dashed future rect. Future-state is demoted — use only `ts` (12px muted) for the label. A dashed rect with a bold title reads as contradiction: "this is a real thing but it's tentative?" — pick one.

### Mixing with active nodes in a DAG

When a DAG contains both active (solid) and future (dashed) nodes, keep the geometry identical across both types — same rect width, height, rx, y-coordinate. The only difference should be the stroke dasharray and the text weight. Any other difference (padding, shadow, label size) confuses the reader.

Route arrows into a dashed rect with the `.arr-alt` class too, and *out* of a dashed rect with `.arr-alt` — the "not yet scheduled" status is contagious forward in the graph. Arrows going *from a solid into a dashed* use solid `.arr` (the active task is scheduled to emit into the future task once it runs).


## Network topology sub-pattern

See `references/structural-network.md`. **Load it when the prompt asks about network infrastructure**: "where do the wires go", "which zone is this device in", "DMZ / firewall / VPC topology", security zones, or device connectivity.

## Comparison matrix sub-pattern

See `references/structural-matrix.md`. **Load it when the content is a feature comparison**: "which of these databases supports X", side-by-side feature tables, ✓/✗ grids, or any "option × attribute" matrix.

## Common failure modes

- **Hierarchy flattens** — parent and child use the same `c-{ramp}` class. Fix: pick different ramps.
- **Overflowing inner regions** — two 250-wide regions + 20 gap + 40 padding = 560, fits a 560-wide outer container exactly with no breathing room. Widen the outer container to 580 or shrink the inner regions.
- **External arrow with `text-anchor="end"` at low x** — the label extends past x=0 and clips. Use `text-anchor="middle"` for centered labels or `"start"` for labels that extend right.
- **Trying to draw literal shapes for the container** — don't draw an actual cell ellipse or a literal server tower. Rounded rects with clear labels read better than shapes that try to be literal. Save illustrative drawing for `illustrative.md` type diagrams.
- **Subsystem pattern with 6+ internal nodes** — the ≤5-node cap per sibling is the ceiling. Beyond that, the internal flow wants to live in its own flowchart diagram, and the structural diagram should step up one level to just the containment picture.
- **Subsystem pattern used for containment** — if one subsystem is logically *inside* the other, don't make them siblings. Nest them the normal way and skip the dashed-border trick.
