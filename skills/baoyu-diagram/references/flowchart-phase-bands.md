# Flowchart: Phase Band Layout

Load this file when the prompt describes a **multi-phase sequential operation** where each phase is a named stage containing several parallel tools or steps, and arrows cross between phases to show how outcomes propagate. Typical triggers:

- "Multi-phase attack / penetration test / security operation"
- "Phased workflow with tools at each stage"
- "Show what happens in each phase, and how findings from Phase N feed Phase N+1"
- "Phase 1 / Phase 2 / Phase 3 diagram"
- Source content from security research, incident response, pipeline audits, or any multi-stage operation where each phase has its own "toolkit"

**What distinguishes this from a poster flowchart:** A poster flowchart is a single vertical flow with a strong narrative arc (one loop, one judge, one outcome). A phase-band diagram is a horizontal-band composition — each band is a self-contained stage with its own set of parallel tools, connected to other bands by semantic crossing arrows. The band, not the individual box, is the unit of meaning.

## Canvas geometry

viewBox: `0 0 680 H`

All phase-band diagrams use the standard 680-wide canvas. The space is partitioned into three vertical columns:

```
x = 0  … 64    Left operator column  — operator icons + connecting arrows
x = 64 … 480   Main flow zone        — phase bands, tool card rows, flow arrows
x = 480 … 648  Annotation zone       — side notes, callout boxes
x = 648 … 680  Right breathing room
```

**Band container geometry:**

| Element              | Coordinates                                  |
|----------------------|----------------------------------------------|
| Band left edge       | `x = 64`                                     |
| Band right edge      | `x = 648`                                    |
| Band width           | `584`                                        |
| Band padding (sides) | `16` px                                      |
| Main flow interior   | `x = 80` to `x = 472` (392 px wide)          |
| Annotation interior  | `x = 488` to `x = 632` (144 px wide)         |

**Vertical geometry:**

```
top padding            y = 40
first band top         y = 40
between-band gap       16 px
H = 40 + sum(band_h[i]) + (N−1) × 16 + 20
```

Each band's height depends on its content. The minimum is **100 px** (phase label row + one card row + padding). Add 80 px for each additional card row. Add 56 px if the band has a side annotation that's taller than the tool row.

---

## Phase band container

Each phase is a full-width dashed-border rounded rect. The phase label sits inside the band at top-left.

```svg
<g class="c-gray">
  <rect x="64" y="{band_y}" width="584" height="{band_h}" rx="12"
        fill="none" stroke-dasharray="4 4"/>
  <text class="eyebrow" x="80" y="{band_y + 18}" text-anchor="start">Phase 1</text>
</g>
```

Rules:
- **`fill="none"`** — dashed bands are schematic regions, not solid boxes. A filled band fights with the tool cards inside it.
- **`stroke-dasharray="4 4"` inline** — same convention as subsystem containers (`structural.md`).
- **`class="c-gray"` on the `<g>`** — gives the dashed stroke its dark-mode–safe color without a hardcoded hex.
- **Eyebrow label** — use the `.eyebrow` class (`10px, 500 weight, text-transform: uppercase`). Short labels only: "Phase 1", "Phase 2 — Reconnaissance", "Phases 4 & 5". Never more than 30 characters.
- **No title at the top level** — phase-band diagrams don't use the `.title` class. The diagram's subject is communicated by its surrounding prose, not a poster-style banner.

---

## Tool card rows

Each band's main flow zone holds one or two horizontal rows of compact tool cards. Use the `compact tool card` template from `glyphs.md` → "Compact tool card node template".

**Row placement inside a band:**

```
card_row_y = band_y + 28        (first row — 28px below band top, clearing the phase label)
card_row_y = band_y + 28 + 88  (second row, if needed — 88 = card_h + 8px gap)
```

**Row centering:**

```
row_width  = N × card_w + (N−1) × gap
row_start_x = 80 + (392 − row_width) / 2
card[i].x  = row_start_x + i × (card_w + gap)
```

Use `gap = 8` for ≤4 cards at 80 wide, `gap = 6` for 5 cards at 72 wide.

**Arrows between cards inside a band:**

Connect consecutive tool cards with short horizontal `.arr` lines:

```svg
<line x1="{prev_card_right + 5}" y1="{card_cy}"
      x2="{next_card_left  − 5}" y2="{card_cy}"
      class="arr" marker-end="url(#arrow)"/>
```

Where `card_cy = card_y + card_h / 2 = card_y + 40`.

For arrows that skip a card or fork into two paths, route with an L-bend above the row at `y = card_row_y − 12`.

---

## Side annotations

Annotations in the right column (x = 488–632) explain what happens at a phase level or for a group of tool cards. They use the same `anno`-class text convention as poster flowcharts but are wrapped in a light `box`-class rect for visual anchoring.

**Annotation box template:**

```svg
<rect class="box" x="488" y="{anno_y}" width="144" height="{anno_h}" rx="6"/>
<text class="ts"  x="496" y="{anno_y + 14}" text-anchor="start">{line 1}</text>
<text class="ts"  x="496" y="{anno_y + 28}" text-anchor="start">{line 2}</text>
<!-- additional lines at +14 pitch -->
```

Rules:
- **Max 18 chars per line.** At 7 px/char that's 126 px — fits inside the 144-wide box with 9 px padding each side.
- **Max 4 lines.** `anno_h = 14 + lines × 14 + 10` (min 38).
- **Connect to the band with a short leader line**, not an arrowhead:

```svg
<line x1="480" y1="{anno_cy}" x2="488" y2="{anno_cy}" class="arr" stroke-dasharray="2 2"/>
```

Where `anno_cy` = vertical center of the annotation box. The short dashed leader communicates "this note belongs to that band" without the visual weight of a full arrow.

**Positioning.** Vertically center the annotation box against the tool card row it describes:

```
anno_y = card_row_y + (card_h − anno_h) / 2
```

If the annotation is longer than the tool card row, let it extend below — just ensure the band height accommodates it.

---

## Cross-band arrows (semantic multi-path)

The most distinctive feature of phase-band diagrams is arrows that cross from one band to another, each color carrying a semantic meaning (normal flow, attack path, data path, etc.).

**Color convention for security/operation diagrams:**

| Path type         | Arrow class   | Typical label  |
|-------------------|---------------|----------------|
| Normal flow       | `arr`         | (unlabeled)    |
| Exploit / attack  | `arr-coral`   | (unlabeled)    |
| Findings / data   | `arr-amber`   | (unlabeled)    |
| Callback / return | `arr-teal`    | (unlabeled)    |

**Color budget exception.** Phase-band diagrams may use **up to 3 ramp-colored arrow classes** when each ramp encodes a distinct path type. This is the only flowchart variant where more than 2 ramps are allowed — the path type IS the information. A legend strip is **required** (see Legend below).

**Routing rules for cross-band arrows:**

Route all cross-band arrows through the **left routing channel** at `x = 20–54`. This keeps them visually separated from the band content and creates a clean "spine" on the left margin:

```
cross-band arrow: exits left edge of source band, travels down the left channel, enters left edge of target band
```

```svg
<!-- Example: arrow from Phase 2 bottom row → Phase 3, entering at band left edge -->
<path class="arr-coral"
      d="M {source_card_cx} {source_card_y + 80}
         L {source_card_cx} {phase2_bottom + 8}
         L 30 {phase2_bottom + 8}
         L 30 {phase3_top − 8}
         L 80 {phase3_top − 8}
         L 80 {phase3_first_card_y + 40}"
      fill="none" marker-end="url(#arrow-coral)"/>
```

The routing path: exit downward from the source card → horizontal to the left channel at x=30 → descend to the target band level → horizontal right into the band interior → enter the target card.

**Arrow marker by ramp.** The defs block in `svg-template.md` defines `#arrow` (gray, default). For ramp-colored arrows, use `url(#arrow-{ramp})` — the template provides coral, amber, teal variants. If the template's defs don't include a specific ramp marker, fall back to `url(#arrow)` — the arrowhead will be gray but the stroke will carry the ramp color.

**Label policy.** Cross-band arrows generally need **no label** — the color carries the semantic, and the source and target cards already name the tools. Add a 1–3 word `ts` label only if the path type would be ambiguous without it (e.g., two coral arrows that mean different things).

---

## Legend strip

**Required** when the diagram uses ≥2 distinct arrow ramp colors. Place the legend at the bottom of the canvas, below all bands, at `y = last_band_bottom + 24`:

```svg
<!-- Legend: 3-color path key -->
<line class="arr"       x1="64"  y1="{leg_y}" x2="84"  y2="{leg_y}" marker-end="url(#arrow)"/>
<text class="ts"        x="88"   y="{leg_y + 4}">Normal flow</text>

<line class="arr-coral" x1="180" y1="{leg_y}" x2="200" y2="{leg_y}" marker-end="url(#arrow)"/>
<text class="ts"        x="204"  y="{leg_y + 4}">Exploit path</text>

<line class="arr-amber" x1="296" y1="{leg_y}" x2="316" y2="{leg_y}" marker-end="url(#arrow)"/>
<text class="ts"        x="320"  y="{leg_y + 4}">Findings</text>
```

Keep the legend to ≤4 entries. Each entry occupies ~116 px wide: 20px line + 8px gap + label. The first entry aligns with the band left edge at x=64.

---

## Operator icons

Place operator icons (from `glyphs.md` → "Operator icons") in the left column at x=16, vertically centered on the band they initiate. The typical arrangement is human → ai stacked vertically, connected by a short `.arr` line, with a final arrow from the ai icon into the first band's left edge.

```
operator-human: translate(16, phase1_band_cy − 48)
operator-ai:    translate(16, phase1_band_cy − 4)
connecting line: y1 = operator_human_bottom+2, y2 = operator_ai_y−2
entry arrow: from (48, operator_ai_cy) → (62, operator_ai_cy), then into band via L-bend
```

Labels (if used): `ts` text at `x=32`, `text-anchor="middle"`, placed 8px below each icon.

---

## Band height calculation

For a band with:
- Phase label row: 22 px
- One tool card row: 80 px
- Top padding: 6 px, bottom padding: 12 px

Minimum: `6 + 22 + 80 + 12 = 120 px`

For two card rows: `6 + 22 + 80 + 8 + 80 + 12 = 208 px`

For a band with an annotation taller than the card row, use the annotation height + padding:
`band_h = max(card_rows_h, anno_h) + 28 + 18`

---

## Worked coordinate sketch

For a 3-band diagram (Phase 1: 1 card row, Phase 2: 2 card rows with annotation, Phase 3: 2 card rows with cross-band arrows):

```
Phase 1 band:   y=40,  h=120   → bottom y=160
                eyebrow at (80, 58)
                1 row of 3 cards (80×80) at y=70, centered in x=80–472
                cards centered: row_w=3×80+2×8=256, row_start=80+(392-256)/2=148
                card centers: (188, 110), (276, 110), (364, 110)

between-band:   16px gap → y=176

Phase 2 band:   y=176, h=208   → bottom y=384
                eyebrow at (80, 194)
                row 1 of 5 cards (72×80) at y=206: row_w=5×72+4×6=384, start=84
                cards: (84, 206), (162, 206), (240, 206), (318, 206), (396, 206)
                row 2 of 2 cards (80×80) at y=302: start=196
                annotation box: x=488 y=234 w=144 h=60
                annotation text: 3 lines at y=248, 262, 276

between-band:   16px gap → y=400

Phase 3 band:   y=400, h=208   → bottom y=608

cross-band arrow (Phase 2 → Phase 3):
  coral: from (396+36, 286) → (396+36, 393) → (30, 393) → (30, 417) → (80, 417) → (80, 480)

legend strip:   y=628
viewBox H:      628 + 24 + 16 + 20 = 688 → round to 700
viewBox:        0 0 680 700
```

---

## Common failure modes

- **Too many cards per row.** 6 cards at 80px = 532px — overflows the 392px main flow zone. Shrink cards to 64px, split into two rows, or drop the annotation zone and use the full 584px band width with cards up to 96px.
- **Cross-band arrows routed through band content.** Always exit to the left routing channel (x=20–54) before crossing band boundaries. A coral arrow slashing diagonally through a tool card is the #1 visual failure in this layout.
- **Phase label hidden by card row.** The card row y must start at `band_y + 28` at minimum (28 = 10px top padding + 18px for eyebrow text height). Starting at `band_y + 16` clips the eyebrow.
- **Annotation text too long.** Max 18 Latin chars / 9 CJK chars per line in the 144-wide annotation box. "Findings recorded and analyzed. Human reviews summary." needs to be split: "Findings recorded" / "and analyzed." / "Human reviews."
- **All tool cards colored differently.** Color encodes meaning — 5 different ramps for 5 tool cards reads as "these tools belong to 5 different categories" which is usually wrong. Use gray for all; promote only the one card that's the focal point.
- **Legend missing when using ramp arrows.** If you use `arr-coral` or `arr-amber`, you must emit a legend strip. A reader who sees red arrows without a legend doesn't know if "red = danger" or "red = Phase 3 path" or "red = selected".
