# SVG Template

Every diagram this skill produces starts with the same boilerplate: root `<svg>` element, an embedded `<style>` block that defines all color classes (including dark mode), and a `<defs>` block with the arrow marker. Copy this template verbatim into every diagram, then write your visual elements after the closing `</defs>`.

**Why we embed the styles.** In claude.ai's Imagine runtime, classes like `c-blue`, `t`, `ts`, `th` are pre-loaded by the host. A standalone SVG dropped into a WeChat article or a Notion page has no such host — it has to carry its own styles. The `<style>` block below reproduces the Imagine class system as self-contained CSS so every SVG renders correctly anywhere.

## The template

Fill in `H` with the actual viewBox height computed from your content (see `layout-math.md`). Leave everything else exactly as written.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 H" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif">
  <style>
    .t  { font-size: 14px; font-weight: 400; fill: #2C2C2A; }
    .ts { font-size: 12px; font-weight: 400; fill: #5F5E5A; }
    .th { font-size: 14px; font-weight: 500; fill: #2C2C2A; }
    .title   { font-size: 20px; font-weight: 600; fill: #2C2C2A; }
    .eyebrow { font-size: 10px; font-weight: 500; fill: #888780; letter-spacing: 1.2px; text-transform: uppercase; }
    .caption { font-size: 12px; font-weight: 400; fill: #888780; font-style: italic; }
    .anno    { font-size: 12px; font-weight: 400; fill: #888780; }
    .box   { fill: #F1EFE8; stroke: #B4B2A9; stroke-width: 0.5; }
    .row-alt { fill: #FFFFFF; stroke: #D3D1C7; stroke-width: 0.5; }
    .arr   { fill: none; stroke: #5F5E5A; stroke-width: 1.5; }
    .arr-alt { fill: none; stroke: #5F5E5A; stroke-width: 1.5; stroke-dasharray: 5 4; }
    .leader{ fill: none; stroke: #B4B2A9; stroke-width: 0.5; stroke-dasharray: 3 3; }
    .lifeline { fill: none; stroke: #B4B2A9; stroke-width: 1; stroke-dasharray: 4 4; }

    .arr-gray   { fill: none; stroke: #5F5E5A; stroke-width: 1.5; }
    .arr-blue   { fill: none; stroke: #185FA5; stroke-width: 1.5; }
    .arr-teal   { fill: none; stroke: #0F6E56; stroke-width: 1.5; }
    .arr-purple { fill: none; stroke: #534AB7; stroke-width: 1.5; }
    .arr-coral  { fill: none; stroke: #993C1D; stroke-width: 1.5; }
    .arr-pink   { fill: none; stroke: #993556; stroke-width: 1.5; }
    .arr-amber  { fill: none; stroke: #854F0B; stroke-width: 1.5; }
    .arr-green  { fill: none; stroke: #3B6D11; stroke-width: 1.5; }
    .arr-red    { fill: none; stroke: #A32D2D; stroke-width: 1.5; }

    .c-gray   > rect, .c-gray   > circle, .c-gray   > ellipse, rect.c-gray, circle.c-gray, ellipse.c-gray { fill: #F1EFE8; stroke: #5F5E5A; stroke-width: 0.5; }
    .c-gray   .th, .c-gray   .t  { fill: #444441; }
    .c-gray   .ts                { fill: #5F5E5A; }

    .c-blue   > rect, .c-blue   > circle, .c-blue   > ellipse, rect.c-blue, circle.c-blue, ellipse.c-blue { fill: #E6F1FB; stroke: #185FA5; stroke-width: 0.5; }
    .c-blue   .th, .c-blue   .t  { fill: #0C447C; }
    .c-blue   .ts                { fill: #185FA5; }

    .c-teal   > rect, .c-teal   > circle, .c-teal   > ellipse, rect.c-teal, circle.c-teal, ellipse.c-teal { fill: #E1F5EE; stroke: #0F6E56; stroke-width: 0.5; }
    .c-teal   .th, .c-teal   .t  { fill: #085041; }
    .c-teal   .ts                { fill: #0F6E56; }

    .c-purple > rect, .c-purple > circle, .c-purple > ellipse, rect.c-purple, circle.c-purple, ellipse.c-purple { fill: #EEEDFE; stroke: #534AB7; stroke-width: 0.5; }
    .c-purple .th, .c-purple .t  { fill: #3C3489; }
    .c-purple .ts                { fill: #534AB7; }

    .c-coral  > rect, .c-coral  > circle, .c-coral  > ellipse, rect.c-coral, circle.c-coral, ellipse.c-coral { fill: #FAECE7; stroke: #993C1D; stroke-width: 0.5; }
    .c-coral  .th, .c-coral  .t  { fill: #712B13; }
    .c-coral  .ts                { fill: #993C1D; }

    .c-pink   > rect, .c-pink   > circle, .c-pink   > ellipse, rect.c-pink, circle.c-pink, ellipse.c-pink { fill: #FBEAF0; stroke: #993556; stroke-width: 0.5; }
    .c-pink   .th, .c-pink   .t  { fill: #72243E; }
    .c-pink   .ts                { fill: #993556; }

    .c-amber  > rect, .c-amber  > circle, .c-amber  > ellipse, rect.c-amber, circle.c-amber, ellipse.c-amber { fill: #FAEEDA; stroke: #854F0B; stroke-width: 0.5; }
    .c-amber  .th, .c-amber  .t  { fill: #633806; }
    .c-amber  .ts                { fill: #854F0B; }

    .c-green  > rect, .c-green  > circle, .c-green  > ellipse, rect.c-green, circle.c-green, ellipse.c-green { fill: #EAF3DE; stroke: #3B6D11; stroke-width: 0.5; }
    .c-green  .th, .c-green  .t  { fill: #27500A; }
    .c-green  .ts                { fill: #3B6D11; }

    .c-red    > rect, .c-red    > circle, .c-red    > ellipse, rect.c-red, circle.c-red, ellipse.c-red { fill: #FCEBEB; stroke: #A32D2D; stroke-width: 0.5; }
    .c-red    .th, .c-red    .t  { fill: #791F1F; }
    .c-red    .ts                { fill: #A32D2D; }

    @media (prefers-color-scheme: dark) {
      .t, .th { fill: #F1EFE8; }
      .ts     { fill: #B4B2A9; }
      .title   { fill: #F1EFE8; }
      .eyebrow { fill: #888780; }
      .caption { fill: #888780; }
      .anno    { fill: #888780; }
      .box    { fill: #2C2C2A; stroke: #888780; }
      .row-alt { fill: #444441; stroke: #5F5E5A; }
      .arr    { stroke: #B4B2A9; }
      .arr-alt { stroke: #B4B2A9; }
      .leader { stroke: #888780; }
      .lifeline { stroke: #5F5E5A; }

      .arr-gray   { stroke: #B4B2A9; }
      .arr-blue   { stroke: #85B7EB; }
      .arr-teal   { stroke: #5DCAA5; }
      .arr-purple { stroke: #AFA9EC; }
      .arr-coral  { stroke: #F0997B; }
      .arr-pink   { stroke: #ED93B1; }
      .arr-amber  { stroke: #EF9F27; }
      .arr-green  { stroke: #97C459; }
      .arr-red    { stroke: #F09595; }

      .c-gray   > rect, .c-gray   > circle, .c-gray   > ellipse, rect.c-gray, circle.c-gray, ellipse.c-gray { fill: #444441; stroke: #B4B2A9; }
      .c-gray   .th, .c-gray   .t  { fill: #F1EFE8; }
      .c-gray   .ts                { fill: #D3D1C7; }

      .c-blue   > rect, .c-blue   > circle, .c-blue   > ellipse, rect.c-blue, circle.c-blue, ellipse.c-blue { fill: #0C447C; stroke: #85B7EB; }
      .c-blue   .th, .c-blue   .t  { fill: #B5D4F4; }
      .c-blue   .ts                { fill: #85B7EB; }

      .c-teal   > rect, .c-teal   > circle, .c-teal   > ellipse, rect.c-teal, circle.c-teal, ellipse.c-teal { fill: #085041; stroke: #5DCAA5; }
      .c-teal   .th, .c-teal   .t  { fill: #9FE1CB; }
      .c-teal   .ts                { fill: #5DCAA5; }

      .c-purple > rect, .c-purple > circle, .c-purple > ellipse, rect.c-purple, circle.c-purple, ellipse.c-purple { fill: #3C3489; stroke: #AFA9EC; }
      .c-purple .th, .c-purple .t  { fill: #CECBF6; }
      .c-purple .ts                { fill: #AFA9EC; }

      .c-coral  > rect, .c-coral  > circle, .c-coral  > ellipse, rect.c-coral, circle.c-coral, ellipse.c-coral { fill: #712B13; stroke: #F0997B; }
      .c-coral  .th, .c-coral  .t  { fill: #F5C4B3; }
      .c-coral  .ts                { fill: #F0997B; }

      .c-pink   > rect, .c-pink   > circle, .c-pink   > ellipse, rect.c-pink, circle.c-pink, ellipse.c-pink { fill: #72243E; stroke: #ED93B1; }
      .c-pink   .th, .c-pink   .t  { fill: #F4C0D1; }
      .c-pink   .ts                { fill: #ED93B1; }

      .c-amber  > rect, .c-amber  > circle, .c-amber  > ellipse, rect.c-amber, circle.c-amber, ellipse.c-amber { fill: #633806; stroke: #EF9F27; }
      .c-amber  .th, .c-amber  .t  { fill: #FAC775; }
      .c-amber  .ts                { fill: #EF9F27; }

      .c-green  > rect, .c-green  > circle, .c-green  > ellipse, rect.c-green, circle.c-green, ellipse.c-green { fill: #27500A; stroke: #97C459; }
      .c-green  .th, .c-green  .t  { fill: #C0DD97; }
      .c-green  .ts                { fill: #97C459; }

      .c-red    > rect, .c-red    > circle, .c-red    > ellipse, rect.c-red, circle.c-red, ellipse.c-red { fill: #791F1F; stroke: #F09595; }
      .c-red    .th, .c-red    .t  { fill: #F7C1C1; }
      .c-red    .ts                { fill: #F09595; }
    }
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- your visual elements go here -->
</svg>
```

## Poster-flowchart utility classes

Four classes are available for poster-style flowcharts (see `flowchart.md` → "Poster flowchart pattern"). These are **optional** — simple flowcharts, structural, illustrative, and sequence diagrams should ignore them and pay nothing beyond ~300 bytes of unused CSS.

| Class       | Size   | Use for                                                                                  |
|-------------|--------|------------------------------------------------------------------------------------------|
| `.title`    | 20px 600 | Diagram-level title. Used ONCE at the top when the topic has a short mechanism name.    |
| `.eyebrow`  | 10px 500 | Small uppercase section dividers between groups of stages. Letter-spaced, muted gray.   |
| `.caption`  | 12px italic | Footer hook line at the bottom of the diagram. One line, italic, muted gray.          |
| `.anno`     | 12px    | Side-column annotation text — "sees: X / fresh context" notes beside a box. Muted gray.  |

All four work in both light and dark mode via the template's `@media` block. Never use `.title`, `.eyebrow`, or `.caption` inside a regular box — they're meta-labels for the whole diagram, not cell content.

## Sequence-diagram utility classes

The `<style>` block also defines `.lifeline` (dashed vertical lifeline for sequence diagrams) and nine `.arr-{ramp}` colored-arrow utilities (`arr-gray`, `arr-blue`, `arr-teal`, `arr-purple`, `arr-coral`, `arr-pink`, `arr-amber`, `arr-green`, `arr-red`). These are only used by sequence diagrams, where each actor's messages inherit the actor's ramp color. Flowchart, structural, and illustrative diagrams ignore them and pay nothing beyond ~600 bytes of unused CSS. Arrow marker `url(#arrow)` uses `context-stroke` so arrowheads automatically match the colored stroke — never set `fill` on these paths.

## The `.row-alt` alternating-row utility

A paired companion to `.box` for **comparison-matrix tables** (see `structural.md` → "Comparison-matrix sub-pattern"). The two classes alternate to create zebra striping across rows of a matrix so the eye can follow a row across 4–5 columns without drifting into the next row.

- **Light mode**: `.box` = cream `#F1EFE8`, `.row-alt` = pure white `#FFFFFF` — the contrast between the two fills is deliberately low (one ramp stop) so the striping is legible but doesn't compete with the cell text.
- **Dark mode**: `.box` = near-black `#2C2C2A`, `.row-alt` = one step lighter `#444441` — same principle, inverted.

Alternate rows by applying `.box` to odd rows and `.row-alt` to even rows, or vice versa. Do **not** use either class to hint at semantic status (active / inactive / warning) — that's what `c-{ramp}` is for. `.row-alt` is purely for visual rhythm.

## The `.arr-alt` alternative-flow utility

The `<style>` block also defines `.arr-alt` — a **1.5px dashed** connector for *alternative*, *optional*, or *weak* flows. Same weight as `.arr`, but the dash pattern (`5 4`) visually demotes the connector so a reader scans the solid arrows first.

Use it when semantics call for it, not as decoration:

- **Flowchart** — the Fail branch out of a Gate, the unchosen paths in a router fan-out, the "Stop" return from an agent loop, or any conditional/optional edge that only fires part of the time.
- **Illustrative** — the spokes in a central-subject-plus-radial-attachments layout (LLM hub to Retrieval / Tools / Memory), where the attachments are *available capabilities* rather than guaranteed steps.

Do **not** use `.arr-alt` as a decorative stroke, and do not use it inside sequence diagrams (every sequence message is either there or not — there is no "maybe" in a protocol). `.arr-alt` is distinct from `.leader`: `.leader` is 0.5px hair-dashed for illustrative callout lines, `.arr-alt` is 1.5px mid-dashed for connectors that carry meaning.

## Rules for using the template

- **viewBox width is always 680.** Never change it. This is the container width every diagram is sized against. If your content is narrow, keep the width at 680 and center your content inside — do not shrink the viewBox to hug the drawing.
- **viewBox height is computed from content.** See `layout-math.md` for the formula. Rule of thumb: `H = max_y + 20` where `max_y` is the lowest point of any element (bottom of the lowest rect, baseline + 4px descent of the lowest text).
- **Arrow marker uses `context-stroke`.** This means the arrowhead automatically matches the color of whichever line it's attached to. Use `marker-end="url(#arrow)"` on any `<line>` or `<path>` connector.
- **Add a `<clipPath>` to `<defs>` only if an illustrative diagram needs one.** Nothing else belongs in `<defs>`.
- **Add a single `<linearGradient>` to `<defs>` only for illustrative diagrams** showing a continuous physical property (temperature stratification, pressure drop). Between two stops from the same ramp. Never more than one gradient per SVG.

## Using the color classes

Apply `c-{ramp}` to the `<g>` wrapper that contains both the shape and its text:

```svg
<g class="c-blue">
  <rect x="100" y="20" width="180" height="44" rx="6"/>
  <text class="th" x="190" y="42" text-anchor="middle" dominant-baseline="central">Login service</text>
</g>
```

Or directly to the shape itself if there's no wrapping `<g>`:

```svg
<rect class="c-blue" x="100" y="20" width="180" height="44" rx="6"/>
```

**Do not nest `c-*` groups.** The CSS uses direct-child selectors — `<g class="c-blue"><g>...</g></g>` won't apply the fill to the inner shapes. If you need a click handler (future), put it on the same group that carries the color class, not a wrapper.

## What to emit after the template

Visual elements in this order:

1. Background decorations (dashed frame for a schematic container, for example)
2. Containers (outer group rectangles for structural diagrams)
3. Connectors and arrows (so they sit behind the boxes they connect, preventing visible overlap) — both solid `.arr`/`.arr-{ramp}` primary flows and `.arr-alt` alternative/optional/weak flows belong in this layer
4. Nodes (rects with text)
5. Labels outside boxes (legend swatches, leader callouts)

When connectors and nodes fight for z-order, nodes win — draw the connectors first so the boxes paint on top of any line that crosses their edge.
