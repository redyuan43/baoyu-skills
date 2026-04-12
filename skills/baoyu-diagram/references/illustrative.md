# Illustrative Diagram

For building *intuition* — the kind of diagram that makes a reader go "oh, *that's* what it's doing". Unlike flowcharts (which document steps) or structural diagrams (which document containment), an illustrative diagram draws the mechanism. The shape of the drawing *is* the explanation.

## When to use

This is the default for *"how does X actually work"* questions with no further qualification. Reach for it whenever the breakthrough moment is visual rather than procedural.

- **Physical subjects** — water heaters, engines, lungs, heart valves, batteries, transistors. Draw simplified cross-sections or cutaways.
- **Abstract subjects** — transformer attention, gradient descent, hash tables, the call stack, embeddings, recursion. Invent a spatial metaphor that makes the mechanism obvious.

Trigger phrases: "how does X work", "explain X", "I don't get X", "give me an intuition for X".

## When NOT to use

- The reader wants a reference, not an intuition. "What are the components of a transformer" is a structural diagram (labeled boxes). "How does attention work" is illustrative (fan of weighted lines).
- The metaphor would be arbitrary rather than revealing. Drawing "the cloud" as a cloud shape teaches nothing about how distributed computing works — skip the illustration and use a structural diagram instead.
- The mechanism is actually a sequence of discrete steps. That's a flowchart.

## Core principle

**Draw the mechanism, not a diagram *about* the mechanism.** Spatial arrangement carries the meaning; labels annotate. A good illustrative diagram still reads clearly even if you remove all the text.

- Color encodes intensity. Warm ramps (amber, coral, red) for heat/energy/pressure/activity. Cool ramps (blue, teal) for cold/calm/dormant. Gray for inert structure. A reader should glance at the drawing and immediately see *where the action is* without reading a label.
- Layout follows the subject's geometry. Tall narrow subject → tall narrow drawing. Wide flat subject → wide flat drawing. Let the thing dictate proportions within the 680px viewBox.
- Layering is encouraged for shapes. Unlike flowcharts where boxes never overlap, illustrative diagrams use z-ordering deliberately: a pipe entering a tank goes *behind* the tank wall, a flame goes *under* the kettle. Later in source = on top.

## Two flavours, same rules

### Physical subjects

Get drawn as simplified versions of themselves. Cross-sections, cutaways, schematics.

- A water heater is a tall rounded rect with a burner underneath. Not a Bézier portrait of a water heater.
- A flame is three triangles, not a fire.
- A lung is a branching tree in an oval-ish cavity. Not a medical illustration.
- A transistor is three terminals meeting at a junction. Not a 3D render.

**Fidelity ceiling**: if a `<path>` needs more than ~6 segments, simplify it. Recognizable silhouette beats accurate contour.

### Abstract subjects

Get drawn as spatial metaphors that make the mechanism obvious.

- **Attention in a transformer** — a row of tokens with weight-scaled lines fanning from one query token to every other token. Line thickness = attention weight.
- **Gradient descent** — a contour surface with a dot rolling downhill, trailing a path of discrete steps.
- **Hash table** — a funnel dropping items into a row of labeled buckets.
- **Call stack** — a vertical stack of frames growing upward with each push.
- **Embeddings** — a 2D scatter of labeled dots, clusters visible by position.
- **Convolution** — a small kernel sliding across a grid, highlighting the current receptive field.

The metaphor *is* the explanation. Don't label the metaphor — if you have to write "this represents attention", the drawing isn't doing its job.

## What changes from the flowchart/structural rules

- **Shapes are freeform.** Use `<path>`, `<ellipse>`, `<circle>`, `<polygon>`, curved lines. You're not limited to rounded rects.
- **Color encodes intensity, not category.** Warm = active/high-weight/attended-to, cool or gray = dormant/low-weight/ignored. The reader should see where the energy is without reading a label.
- **Layering and overlap are allowed — for shapes.** Draw a pipe entering the tank body. Draw insulation wrapping a chamber. Use z-order deliberately.
- **Text is still the exception — never let a stroke cross a label.** The overlap permission is for shapes only. Every label needs 8px of clear air between its baseline and the nearest stroke. If there's no quiet region for a label, the drawing is too dense — remove something or split into two diagrams.
- **Small shape-based indicators are allowed** when they tell the reader about physical state. Triangles for flames. Circles for bubbles. Wavy lines for steam or radiation. Keep them simple — basic SVG primitives, not detailed illustrations.
- **Lines stop at component edges.** When a stroke meets a component (a pipe entering a tank, a wire into a terminal, an arrow into a region), draw the line as segments that *end at the component's boundary* — don't draw straight through the component and rely on the fill to hide the overdraw. The host page's background color is not guaranteed (WeChat dark mode, Notion, markdown viewers), so any fill-based occlusion becomes a coupling between stroke color and background color. Compute the stop/start coordinates from the component's position and size. This matters more for illustrative diagrams than for flowcharts because curved and irregular edges make the overdraw more visible.
- **One gradient is permitted** — and only one. This is the single exception to the flat-fills rule. Use it to show a *continuous* physical property (temperature stratification in a tank, pressure drop along a pipe) with a `<linearGradient>` between exactly two stops from the same ramp. No radial gradients, no multi-stop fades, no decoration gradients. If two stacked flat-fill rects communicate the same thing, do that instead.

## Label placement

At 680px width you don't have room for a drawing *and* label columns on both sides. Pick one side and put all the labels there.

**Default to right-side labels** with `text-anchor="start"`. Labels on the left with `text-anchor="end"` are the ones that clip — the text extends leftward from x and long labels blow past x=0 without warning.

Reserve **at least 140px** of horizontal margin on the label side. Your drawing sits in roughly x=40 to x=500, labels sit in x=510 to x=640.

For each label, draw a dashed leader line from the referenced feature on the drawing to the label:

```svg
<g>
  <line class="leader" x1="380" y1="120" x2="510" y2="140"/>
  <circle cx="380" cy="120" r="2" fill="#888780"/>
  <text class="ts" x="516" y="144">Hot zone</text>
</g>
```

The small circle at the anchor end makes the leader read as an intentional pointer rather than a stray stroke.

**Large internal zones** (big enough to hold text without crowding) can have labels sitting inside them, with at least 20px of clear air from any edge.

## Composition order

Write the SVG in this layering order so z-index comes out right:

1. **Silhouette first.** The largest shape, centered in the viewBox. This defines the subject's footprint.
2. **Internal structure.** Chambers, pipes, membranes, mechanical parts. Drawn inside the silhouette.
3. **State indicators.** Color fills showing temperature/pressure/concentration, the one optional gradient. Applied after shapes so they tint on top of the structure.
4. **External connections.** Pipes entering or exiting, arrows showing flow direction.
5. **Labels and leader lines.** Last, so they sit on top of everything else.

Don't try to optimize this order — just follow it every time. Z-ordering bugs are hard to debug after the fact.

## Tiny worked example — attention fan

Request: "how does attention work in a transformer"

Plan:
- Spatial metaphor: a row of 5 tokens at the bottom, one highlighted (the query), with 5 lines fanning up to a layer above. Line thickness encodes weight — thickest line to "sat", mid lines to nearby tokens, thin lines to distant ones.
- Colors: gray for dormant tokens, amber for the query token. Fan lines hardcoded amber `#EF9F27` with varying stroke-width and opacity.
- One caption below the fan: "Line thickness = attention weight".

## Central subject + radial attachments

For **"how does X interact with its environment"** diagrams where a central subject connects outward to a small set of optional capabilities — an LLM with retrieval, tools, and memory; a browser with DOM, storage, and network; a GPU with shared memory, registers, and global memory. The layout is a hub-and-spoke: one subject in the middle, 2–4 attachments arranged around it, and dashed connectors showing that each attachment is an *available capability*, not a mandatory step.

**Why illustrative and not structural**: the reader's question is "how does the subject use its environment" — that's intuition about a mechanism, not a documentation of what lives inside what. A structural diagram of "LLM + retrieval + tools + memory" would read like a block diagram; the radial layout instead reads like "this thing reaches out to these things when it needs to".

### Anatomy

```
     [ In pill ] → [    LLM Call    ] → [ Out pill ]
                         |
                  ┌──────┼──────┐         ← three dashed spokes dropping
                  ↓      ↓      ↓            from the subject center
             [Retrieval] [Tools] [Memory]
```

- A **horizontal mainline** across the vertical center of the diagram carries the primary flow. Both ends are pill-shaped terminals.
- The **central subject** is the node in the middle of the mainline — a rounded rect (not a pill), typically using a color ramp (`c-purple` is conventional for "the model").
- **2–4 attachments** sit below the subject as rounded rects, spaced horizontally.
- **Dashed `.arr-alt` connectors** drop from the subject's bottom edge to each attachment's top edge. These are dashed to communicate "optional capability, used when needed" — the mainline is what always runs, the spokes are what the subject reaches for.
- **Short 1–2 word labels** beside each spoke (`Query` / `Call` / `Read`) communicate the relationship. See the `.arr-alt` notes in `svg-template.md`.

### Layout

Standard geometry at viewBox width 680:

```
Mainline y          = 160              # rect top; cy = 182 (rect height 44)
In pill             x=60,  w=80        # right edge 140
Subject box         x=290, w=180       # center (380, 182), bottom edge 204
Out pill            x=560, w=80        # center (600, 182), right edge 640 ✓

Attachment row y    = 320              # 116px below subject cy; bottom 364
Attachment w        = 120              # fits "Retrieval" (9 × 8 + 24 = 96)
Attachment 1        x=120, center (180, 342)
Attachment 2        x=320, center (380, 342)      # directly below subject
Attachment 3        x=520, center (580, 342)      # right edge 640 ✓

Spoke channel ymid  = 290              # 86px below subject bottom, 30px above att row

Spoke 1 (L):  path (380, 204) → (380, 290) → (180, 290) → (180, 320)
Spoke 2 (M):  straight (380, 204) → (380, 320)
Spoke 3 (R):  path (380, 204) → (380, 290) → (580, 290) → (580, 320)
```

The center spoke is a straight vertical line; the outer spokes are L-bends that drop to a shared horizontal channel at `y = 290` before turning down into the attachments. Don't route the outer spokes as diagonals — diagonal lines in an otherwise orthogonal diagram read as stray strokes.

Mainline arrow endpoints: `In→Subject` runs from `(140, 182)` to `(290, 182)`; `Subject→Out` runs from `(470, 182)` to `(560, 182)`. Both use solid `.arr`.

### Rules

- **At most 4 attachments.** Five overflows the horizontal budget at 140px each. If you need 5+, split into two diagrams (subject + capability group A, subject + capability group B) or step the pattern up to a structural diagram.
- **Dashed spokes only when the attachments are optional.** If every spoke always runs, the pattern isn't radial — it's a fan-out flowchart and should use solid `.arr` connectors in the simple fan-out pattern from `flowchart.md`.
- **Spoke labels stay short.** 1–2 words, `ts`, positioned beside the spoke midpoint with `text-anchor="end"` for labels on the left of a spoke and `"start"` for labels on the right. Bidirectional relationships draw two labels on opposite sides of the spoke ("Query" above, "Results" below — same spoke).
- **No rotated text.** Design-system.md's rotation ban applies here; radial layouts do *not* unlock rotated labels.
- **No literal icons.** A radial hub describing "LLM + tools + memory" uses labeled rounded rects for each capability, not tool wrench glyphs or memory-chip drawings.
- **Central subject stays a rect, not a circle.** Circles read as "state" or "particle"; this pattern is about a subject reaching for capabilities, and a rounded rect labels cleanly at 14px.

### Worked example — LLM hub

Request: "how an LLM uses retrieval, tools, and memory"

Plan:
- Mainline `In` → `LLM Call` → `Out` along the horizontal center; rects at y=160, cy=182
- `LLM Call` uses `c-purple` to mark it as the central subject
- 3 attachments below at y=320: `Retrieval` / `Tools` / `Memory`, all gray, w=120 each
- Three dashed `.arr-alt` spokes — the middle spoke straight down, the outer two as L-bends through a shared channel at y=290
- One short label beside each spoke (`Query` / `Call` / `Read`) picking the most representative verb; the bidirectional return path is left implicit so the diagram stays quiet
- viewBox: last element `Retrieval` bottom = 320 + 44 = 364 → H = **384**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 384" font-family="...">
  <style>...</style>
  <defs><marker id="arrow" .../></defs>

  <rect class="box" x="60"  y="160" width="80"  height="44" rx="22"/>
  <text class="t"   x="100" y="182" text-anchor="middle" dominant-baseline="central">In</text>

  <g class="c-purple">
    <rect x="290" y="160" width="180" height="44" rx="6"/>
    <text class="th" x="380" y="182" text-anchor="middle" dominant-baseline="central">LLM Call</text>
  </g>

  <rect class="box" x="560" y="160" width="80"  height="44" rx="22"/>
  <text class="t"   x="600" y="182" text-anchor="middle" dominant-baseline="central">Out</text>

  <line x1="140" y1="182" x2="288" y2="182" class="arr" marker-end="url(#arrow)"/>
  <line x1="470" y1="182" x2="558" y2="182" class="arr" marker-end="url(#arrow)"/>

  <g class="c-gray">
    <rect x="120" y="320" width="120" height="44" rx="6"/>
    <text class="th" x="180" y="342" text-anchor="middle" dominant-baseline="central">Retrieval</text>
  </g>
  <g class="c-gray">
    <rect x="320" y="320" width="120" height="44" rx="6"/>
    <text class="th" x="380" y="342" text-anchor="middle" dominant-baseline="central">Tools</text>
  </g>
  <g class="c-gray">
    <rect x="520" y="320" width="120" height="44" rx="6"/>
    <text class="th" x="580" y="342" text-anchor="middle" dominant-baseline="central">Memory</text>
  </g>

  <path d="M 380 204 L 380 290 L 180 290 L 180 318" class="arr-alt" fill="none" marker-end="url(#arrow)"/>
  <line x1="380" y1="204" x2="380" y2="318" class="arr-alt" marker-end="url(#arrow)"/>
  <path d="M 380 204 L 380 290 L 580 290 L 580 318" class="arr-alt" fill="none" marker-end="url(#arrow)"/>

  <text class="ts" x="280" y="284" text-anchor="middle">Query</text>
  <text class="ts" x="390" y="258" text-anchor="start">Call</text>
  <text class="ts" x="480" y="284" text-anchor="middle">Read</text>
</svg>
```

Notes on this example:
- The central subject `LLM Call` uses `c-purple` while attachments stay gray — this is the single-accent rule from the design system, where the accent ramp anchors reader attention on "the thing doing the reaching".
- All three spokes use `class="arr-alt"` because retrieval, tool-calls, and memory reads are **optional** — an LLM invocation might use all three, some, or none. If the diagram were describing a specific pipeline where all three always run, the spokes would be solid `.arr`.
- **One short verb per spoke**, not a bidirectional pair. Two stacked labels per spoke would crowd the horizontal channel at y=290; picking the representative verb (Query, Call, Read) is quieter and the reader infers the return path. If the return direction matters, split into two diagrams rather than stacking labels.
- Each label sits on the horizontal channel (y=284, 6px above y=290) directly over the L-bend corner so it reads as belonging to that spoke. The middle spoke's label sits 32px above to avoid colliding with the other labels.
- Spoke 2 drops straight down from the subject's bottom edge to the middle attachment's top edge because they're vertically aligned — no need for a bend. The arrowhead lands at y=318 (2px short of the attachment's top at y=320) to leave the 10px-ish breathing room flowchart.md recommends.
- Rightmost rect edges: Out pill ends at `560 + 80 = 640` ✓, Memory ends at `520 + 120 = 640` ✓ — both exactly flush with the 640 bound.

## Spectrum / continuum

For topics where the reader's question is *"where on the scale between X and Y does Z sit"* — Anthropic's "Finding the sweet spot" diagram (image #5) is the canonical example. The layout is a single horizontal axis with opposing concepts at either end, tick points along it, option boxes hanging below each tick, and optional italic captions under the options.

This is a **new illustrative sub-pattern**, distinct from the radial-attachments layout above. Use it when the intuition the reader needs is "these options are *positions* on a single continuum, and one of them is better than the others because of where it sits on the continuum".

### When to use

- "Finding the sweet spot between A and B"
- "The trade-off between flexibility and rigidity / latency and quality / cost and performance"
- "Where does approach X sit on the X-to-Y spectrum"
- Any topic where the reader has been thinking in a binary and you're showing them it's a gradient

### When not to use

- The options are unordered categories (use a structural diagram with sibling boxes instead).
- The trade-off has more than one dimension (spectrum only works for 1-D).
- There's no "wrong" end to the axis — the spectrum works because both extremes are undesirable and there's a sweet spot in between. If one end is just "better", use a chart, not this pattern.

### Geometry

See also `layout-math.md` → "Spectrum geometry".

| Element            | Coordinates                                      |
|--------------------|--------------------------------------------------|
| Eyebrow (optional) | `(340, 50)`, class `eyebrow`, `text-anchor="middle"` |
| Axis line          | `x1=80 y1=140 x2=600 y2=140`, class `arr`, markers on **both** ends |
| Left-end label     | `(80, 120)`, class `ts`, `text-anchor="start"`, uppercase content |
| Right-end label    | `(600, 120)`, class `ts`, `text-anchor="end"`, uppercase content |
| Tick points (N)    | circles at `(tick_x, 140)` `r=6`                 |
| Option boxes       | `y=200 h=60 w=120 rx=6`, one per tick point      |
| Captions (optional)| `y=292 and y=308`, italic `ts`, `text-anchor="middle"` |

For **3 ticks**, tick_x = `160, 340, 520`; option box x = `100, 280, 460` (each 120 wide, centered on tick_x).
For **4 ticks**, tick_x = `140, 280, 420, 560`; option box x = `80, 220, 360, 500` (each 120 wide).
For **5 ticks**, tick_x = `120, 240, 360, 480, 600`; option box width shrinks to 100 (x = `70, 190, 310, 430, 550`).

### The axis

The axis is a single horizontal line with arrow markers at both ends (so it reads "this extends both ways, no natural direction"). Unlike regular arrows which use `marker-end`, the spectrum axis uses **both** `marker-start` and `marker-end`:

```svg
<line class="arr" x1="80" y1="140" x2="600" y2="140"
      marker-start="url(#arrow)" marker-end="url(#arrow)"/>
```

The `context-stroke` marker in the template automatically colors both arrowheads to match the line.

**Do not** add a color ramp to the axis. It's always `arr` (neutral gray) — colored axes imply that one end is "good" and the other "bad", which defeats the entire point of a spectrum diagram.

### End labels

The labels at the two ends describe the **extremes** the axis is measuring between. Keep them to 2–3 words, usually in all caps or title case to signal they're axis labels, not box labels. In image #5 these are "NO STRUCTURE" and "TOO RIGID".

Place them *above* the axis with at least 8px of clearance between the end of the axis arrowhead and the label's text baseline. Left label uses `text-anchor="start"` anchored at the axis x1; right label uses `text-anchor="end"` anchored at the axis x2. No leader lines — the proximity to the axis end is enough.

### Tick points and option boxes

Each tick is a small circle (r=6) sitting on the axis line. Tick circles use `c-gray` by default (subtle dots) — the sweet-spot tick upgrades to an accent ramp (`c-green` or `c-amber`) to draw the eye.

Each tick has a **matching option box** directly below it. The option box is a two-line node (60 tall, title + 1-word id) centered on the tick's x. The option's id (left subtitle like "A", "B", "C") is optional and mostly for referring back in the caption.

The sweet-spot option's box takes the same accent ramp as its tick — green/amber highlights "this is the one". All other option boxes stay neutral gray (`c-gray`).

### Italic per-option captions

Below each option box, an optional 1–2 line italic `ts` caption explains *what that option feels like*. Keep each line ≤24 characters (≈3 words) so the captions don't spill into each other horizontally. Captions are always italic (use inline `font-style="italic"`), matching the `caption` class from poster flowcharts but placed under each option individually.

```svg
<text class="ts" x="160" y="292" text-anchor="middle" font-style="italic">vague and</text>
<text class="ts" x="160" y="308" text-anchor="middle" font-style="italic">untestable</text>
```

If the captions need more than 2 lines each, the spectrum is the wrong pattern — the options need their own diagram.

### Eyebrow

A spectrum diagram can carry a small `eyebrow`-class label at the very top (y=50) to name the trade-off: "CHOOSING AN EVALUATION APPROACH". This is optional but strongly recommended — without an eyebrow the reader has to infer "what is this spectrum *about*" from the end labels alone, and end labels are short by design.

### Worked example — sweet spot

Request: "Show the trade-off between an evaluation that's too loose and one that's too rigid."

Plan:
- Eyebrow: "CHOOSING AN EVALUATION"
- Axis: "NO STRUCTURE" on the left, "TOO RIGID" on the right
- 3 tick points with option boxes: "A · none", "B · rubric", "C · checklist"
- "B · rubric" is the sweet spot → `c-green`
- Italic captions under each: "vague and / untestable", "structured / and flexible", "brittle, / doesn't generalize"
- viewBox H ≈ 340

```svg
<text class="eyebrow" x="340" y="50" text-anchor="middle">Choosing an evaluation</text>

<text class="ts" x="80"  y="120" text-anchor="start">NO STRUCTURE</text>
<text class="ts" x="600" y="120" text-anchor="end">TOO RIGID</text>
<line class="arr" x1="80" y1="140" x2="600" y2="140"
      marker-start="url(#arrow)" marker-end="url(#arrow)"/>

<circle class="c-gray"  cx="160" cy="140" r="6"/>
<circle class="c-green" cx="340" cy="140" r="6"/>
<circle class="c-gray"  cx="520" cy="140" r="6"/>

<g class="c-gray">
  <rect x="100" y="200" width="120" height="60" rx="6"/>
  <text class="th" x="160" y="222" text-anchor="middle">None</text>
  <text class="ts" x="160" y="242" text-anchor="middle">A</text>
</g>
<g class="c-green">
  <rect x="280" y="200" width="120" height="60" rx="6"/>
  <text class="th" x="340" y="222" text-anchor="middle">Rubric</text>
  <text class="ts" x="340" y="242" text-anchor="middle">B</text>
</g>
<g class="c-gray">
  <rect x="460" y="200" width="120" height="60" rx="6"/>
  <text class="th" x="520" y="222" text-anchor="middle">Checklist</text>
  <text class="ts" x="520" y="242" text-anchor="middle">C</text>
</g>

<text class="ts" x="160" y="292" text-anchor="middle" font-style="italic">vague and</text>
<text class="ts" x="160" y="308" text-anchor="middle" font-style="italic">untestable</text>
<text class="ts" x="340" y="292" text-anchor="middle" font-style="italic">structured</text>
<text class="ts" x="340" y="308" text-anchor="middle" font-style="italic">and flexible</text>
<text class="ts" x="520" y="292" text-anchor="middle" font-style="italic">brittle, doesn't</text>
<text class="ts" x="520" y="308" text-anchor="middle" font-style="italic">generalize</text>
```

viewBox: max_y = 308 + 4 = 312 → H = **332**.

### Pitfalls

- **Axis end labels clipped**: if `text-anchor="end"` is used on the left label or `text-anchor="start"` on the right, labels extend past the axis ends and read backwards. Left is `start`, right is `end`.
- **Sweet spot not the right color**: using `c-coral` for the sweet spot because "it's the attention color" is backwards — `c-coral` reads as "warning", `c-green` reads as "good", `c-amber` reads as "deliberate". Match the ramp to the *outcome*, not just the emphasis.
- **Tick count ≠ option count**: every tick needs an option box and vice versa. An orphan tick or an orphan option is a layout bug.
- **Captions too long**: 2 italic lines at ≤24 chars each. Longer captions collide.

## Annotation circle on connector

For diagrams where a connector (arrow between two subjects) has a **named mediator** that deserves to be visible as a node itself. Image #13 (Claude ↔ Environment with Skill) is the canonical case: Claude talks to its environment, and the "Skill" that mediates the exchange is too important to be a mere label on the arrow — it becomes a labeled circle sitting on the connector.

**When to use.** Only in illustrative diagrams. Flowcharts and sequence diagrams label their arrows with text; structural diagrams use arrow labels or inline text. The annotation-circle-on-connector is an *illustrative* convention specifically — it promotes "the thing on the arrow" to a visual node without breaking the two-subject layout.

**When not to use.**

- The mediator is actually a step in a sequence — use a flowchart node.
- The mediator is a system component — use a structural box.
- There are two or more mediators on the same connector — the pattern doesn't stack; restructure the diagram.

### Geometry

See `glyphs.md` → "Annotation circle on connector" for the full glyph. The placement rule:

| Element                | Coordinates                                |
|------------------------|--------------------------------------------|
| Subject A              | e.g., `x=80 y=160 w=180 h=56`              |
| Subject B              | e.g., `x=440 y=160 w=180 h=56`             |
| Bidirectional arrows   | A↔B, offset by 10px vertically             |
| Annotation circle      | `cx = (A_right + B_left) / 2`, `cy = arrows_y_midpoint` |
| Short connector line   | `x1 = cx, y1 = cy, x2 = cx, y2 = cy + 40`, class `arr` (no arrowhead) |

The annotation circle sits **above** the pair of bidirectional arrows, with a short vertical connector line (no arrowhead) dropping from the bottom of the circle to the midpoint of the arrow pair. This reads as "this circle is a flag attached to the arrow below it".

### Arrow routing

The two-way exchange between Subject A and Subject B uses a pair of offset horizontal arrows:

```svg
<!-- Claude → Environment (top arrow) -->
<line class="arr" x1="260" y1="184" x2="440" y2="184" marker-end="url(#arrow)"/>
<text class="ts" x="350" y="178" text-anchor="middle">Action</text>
<!-- Environment → Claude (bottom arrow) -->
<line class="arr" x1="440" y1="204" x2="260" y2="204" marker-end="url(#arrow)"/>
<text class="ts" x="350" y="218" text-anchor="middle">Feedback</text>
```

The arrow-pair y midpoint is `(184 + 204) / 2 = 194`. The annotation circle's connector line ends at `(350, 194)` (the midpoint). The circle itself sits above, centered at `(350, 150)` with r=30.

### The annotation circle itself

```svg
<g transform="translate(318, 118)">
  <circle class="box" cx="32" cy="32" r="30"/>
  <g class="c-teal">
    <rect x="4" y="22" width="56" height="20" rx="10"/>
    <text class="th" x="32" y="36" text-anchor="middle">Skill</text>
  </g>
</g>
<line class="arr" x1="350" y1="180" x2="350" y2="194"/>
```

The outer circle uses the neutral `box` class (so the ring itself doesn't fight for attention), and the inner pill uses a ramp (usually `c-teal` — the mediator is an aid, not an adversary).

### Label length

The inner pill caps at ~6 Latin characters. "Skill" fits. "Constraint" does not — shorten or restructure. For CJK, cap at 3 characters.

### Multiple circles on one arrow

**Not allowed.** If two mediators sit on the same connector, you're describing a sequence, not a mediator — use a flowchart instead.

## Decorative icon inside box

The **only** place in the design system where an icon is allowed inside a rect is inside an illustrative diagram's subject box or a structural diagram's hub/shared-state box. The rule is strict: the icon must come from `glyphs.md`'s icon set, and it lives in the lower half of a box that's at least 80px tall.

### Why only here

Flowcharts and sequence diagrams use the label alone — adding an icon to a flowchart box just adds visual noise to a process the reader is tracking sequentially. In an illustrative diagram, the icon reinforces *what kind of thing the box represents* (a document store, a terminal, a code script), and that reinforcement is part of the intuition the diagram is trying to build.

### Allowed icon set

Only these, from `glyphs.md`:

- `doc-icon` — documents, artifacts, shared files, logs
- `terminal-icon` — terminals, computers, shells, CLI environments
- `script-icon` — inline scripts, programmatic tool calls (used in structural "Parallel independent rounds" pattern; rarely in illustrative)

**No other icons.** Do not draw an LLM brain, a wrench for "tools", a cloud for "cloud", a gear for "settings". Label the rect.

### Placement

For a box at `(box_x, box_y, box_w, box_h)`:

- Title `th` at `(box_x + box_w/2, box_y + 22)`.
- Subtitle `ts` at `(box_x + box_w/2, box_y + 40)` (optional).
- Icon anchor at `(box_x + box_w/2 − 12, box_y + box_h − 36)` (for a 24-wide, 28-tall icon).

The icon must have at least **8px of clear air** above it (between the subtitle baseline + descender and the icon's top). If the box is too short to fit both text and icon, grow the box — don't squeeze them.

### Color

The icon uses `arr` or `box` classes (neutral stroke), **not** a ramp. The parent box carries the ramp color — the icon is a secondary visual cue that inherits the reader's attention from the box, not from its own color.

```svg
<g class="c-amber">
  <rect x="260" y="280" width="160" height="80" rx="10"/>
  <text class="th" x="340" y="302" text-anchor="middle">Shared state</text>
  <text class="ts" x="340" y="320" text-anchor="middle">Task artifacts</text>
  <g transform="translate(328, 324)">
    <path class="arr" d="M2 2 L16 2 L22 8 L22 26 L2 26 Z" fill="none"/>
    <path class="arr" d="M16 2 L16 8 L22 8" fill="none"/>
    <line class="arr" x1="6"  y1="14" x2="18" y2="14"/>
    <line class="arr" x1="6"  y1="18" x2="18" y2="18"/>
    <line class="arr" x1="6"  y1="22" x2="14" y2="22"/>
  </g>
</g>
```

### Multiple icons in one diagram

One icon per box is the cap. Two in the same diagram is fine if they're in different boxes and each serves its own intuition. Three or more icons in one diagram starts to feel like a screenshot — simplify.

## Rules of thumb

- **Silhouette > outline.** A simple rounded rect labeled "Reactor" beats a detailed reactor drawing. The reader needs to recognize *what kind of thing* it is, not admire your drafting.
- **Color on what matters.** If the hot zone is the point, color only the hot zone. Leave the rest of the drawing in neutral stroke lines. Color where the meaning is.
- **One gradient, deliberately.** If you reach for a gradient, ask: "is this showing a continuous physical property?" If yes, use it. If no, use flat fills.
- **Labels in the quiet zone.** Before placing a label, check that no stroke will cross its bounding box. If there's no quiet zone, remove something from the drawing.
- **One idea per diagram.** If you catch yourself cramming two mechanisms into one drawing, split them. Two 10-element diagrams beat one 20-element diagram every time.

## Common failure modes specific to illustrative

- **Too literal** — tracing a real photo of the subject. Six Bézier curves, not sixty. Stylize.
- **Label crossed by stroke** — text sits where a pipe or arrow also passes. Move the label to the margin with a leader line; never use a background rect to hide the stroke.
- **Gradient as decoration** — using a gradient because it "looks nice". Remove it. Gradients are only for continuous physical properties.
- **Color by category instead of intensity** — dormant and active nodes using different ramps for variety. Use gray for dormant, one accent for active. Let the color tell the story.
- **Both-sides labels** — drawing has labels on the left *and* the right. Pick one side. At 680px wide, you don't have room for both.
