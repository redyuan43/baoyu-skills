# Structural: Comparison Matrix

Load this file when the content is a **feature comparison**: "which of these databases supports X", side-by-side feature tables, ✓/✗ grids, or any "option × attribute" matrix.

Sub-pattern for side-by-side feature comparisons — *"which of these three databases supports transactions"*, *"which of these four frameworks has a migration path"*. The subject is a tabular matrix with **rows = features** and **columns = systems** (or the reverse). Structural diagram type is the right home because the matrix is really a structured grid of containers, just with a disciplined layout.

## When to use it

- The reader's question is *"which option has property X"*, and they'll compare across rows or columns.
- You have 2–5 columns and 2–8 rows. Beyond 5 columns, split into two matrices. Beyond 8 rows, promote the most important 6 and drop the rest into prose.
- Each cell's value fits in **one word or a ✓/✗ glyph**. If cells need sentences, this isn't a matrix — it's a comparison essay, which belongs in prose around the diagram.

## Structure

A comparison matrix is one header row (column labels) plus N body rows (attribute on the left, values in each column). The grid has no visible gridlines — the zebra-striped row backgrounds provide the horizontal separation, and the column alignment provides the vertical separation. Flat aesthetic, no table borders.

| Element            | Width / coordinates                                         |
|--------------------|-------------------------------------------------------------|
| Attribute column   | 160 wide                                                    |
| Value columns      | `(600 − 160) / N` wide, equal to each other                 |
| Row height         | 36 (single-line `t` value) or 52 (two-line title + subtitle)|
| Row gap            | 0 (rows touch — the alternating fill creates the band)      |
| Header row height  | 40 (slightly taller than body rows)                         |
| Header text        | `th` class, centered                                        |
| Body attribute     | `t` class, left-anchored at `col_x + 12`                    |
| Body value (text)  | `t` class, centered in column                               |
| Body value (glyph) | `status-circle-check` / `status-circle-x`, centered in column|

**Column count formula.** For 3 value columns: value_width = 440/3 ≈ 147. For 4: 110. For 5: 88. At 5 columns the value column barely fits *"Supported"*; past that, any label longer than 8 characters clips. Hard cap at 5 columns — if you have 6 systems to compare, split into *(A, B, C)* and *(D, E, F)* matrices.

## Alternating row fills

Zebra striping uses the `.row-alt` class from `svg-template.md` on every other body row. The header row uses `.box` with a slightly darker inline `stroke-width="1"` or the default `.box`:

```svg
<!-- Header row -->
<rect class="box" x="40" y="60" width="600" height="40" rx="6"/>

<!-- Body row 1 (default .box) -->
<rect class="box" x="40" y="100" width="600" height="36"/>

<!-- Body row 2 (.row-alt) -->
<rect class="row-alt" x="40" y="136" width="600" height="36"/>

<!-- Body row 3 (default .box) -->
<rect class="box" x="40" y="172" width="600" height="36"/>
```

Rounded corners (`rx="6"`) only on the *header* row and on the *last* body row — the middle rows are sharp-cornered so they stack seamlessly. Implementation trick: give the first body row `rx="0"` explicitly, and only round the bottom of the last row using the standard outer-wrapper approach, or accept square corners throughout for simplicity (which is also fine).

## Cell contents

Cells fall into three buckets:

- **Boolean** — use `status-circle-check` (c-green) for *yes*, `status-circle-x` (c-coral) for *no*, from `glyphs.md`. Centered in the cell. No extra text label. ✓/✗ is a visual shortcut that reads faster than the word.
- **Short text** — 1–2 words like *"v2.1"*, *"Postgres"*, *"Yes"*, *"Optional"*. Use class `t`, `text-anchor="middle"`, centered at the cell's x-midpoint.
- **Tier** — when the value is a level (*"Full"*, *"Partial"*, *"None"*), still use short text. Resist the urge to map tiers to colors — that re-categorizes the data and breaks the 2-ramp budget.

**No subtitle text inside a cell.** If a value *needs* a qualifier (*"Yes, since v3"*), the qualifier belongs in a footnote marker (*"Yes†"*) with the footnote written as `ts` text below the whole matrix. Don't stack two `ts` lines inside a 36px cell.

## Worked example — 3-system × 5-feature comparison

Request: *"Compare Postgres, MySQL, and SQLite on: transactions, JSON columns, full-text search, replication, on-disk encryption."*

Plan:
- Header row: attribute column + 3 system columns. Value_width = 440/3 ≈ 147.
- 5 body rows, alternating `.box` and `.row-alt`.
- Feature names are 14px body text; system values are mostly ✓/✗ glyphs, with one short text ("Built-in"/"Plugin").
- Single accent: none — the green/coral in the status circles already encodes meaning, and adding a ramp to the matrix would clash with the semantic greens.

```svg
<svg ... viewBox="0 0 680 320">
  <!-- Header row -->
  <rect class="box" x="40" y="40" width="600" height="40" rx="6"/>
  <text class="th" x="120" y="64" text-anchor="middle">Feature</text>
  <text class="th" x="267" y="64" text-anchor="middle">Postgres</text>
  <text class="th" x="413" y="64" text-anchor="middle">MySQL</text>
  <text class="th" x="560" y="64" text-anchor="middle">SQLite</text>

  <!-- Row 1: Transactions (all yes) -->
  <rect class="box" x="40" y="80" width="600" height="36"/>
  <text class="t" x="52" y="103">Transactions</text>
  <g transform="translate(255, 86)"><circle class="c-green" cx="12" cy="12" r="12"/><path class="arr-green" d="M6 12.5 L10.5 17 L18 8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g transform="translate(401, 86)"><circle class="c-green" cx="12" cy="12" r="12"/><path class="arr-green" d="M6 12.5 L10.5 17 L18 8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g transform="translate(548, 86)"><circle class="c-green" cx="12" cy="12" r="12"/><path class="arr-green" d="M6 12.5 L10.5 17 L18 8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>

  <!-- Row 2: JSON columns (all yes — alternating stripe) -->
  <rect class="row-alt" x="40" y="116" width="600" height="36"/>
  <text class="t" x="52" y="139">JSON columns</text>
  <!-- ✓ ✓ ✓ glyphs at same offsets -->

  <!-- Row 3: Full-text search (text value varies) -->
  <rect class="box" x="40" y="152" width="600" height="36"/>
  <text class="t" x="52" y="175">Full-text search</text>
  <text class="t" x="267" y="175" text-anchor="middle">Built-in</text>
  <text class="t" x="413" y="175" text-anchor="middle">Built-in</text>
  <text class="t" x="560" y="175" text-anchor="middle">Plugin</text>

  <!-- Row 4: Replication (SQLite no — alternating stripe) -->
  <rect class="row-alt" x="40" y="188" width="600" height="36"/>
  <text class="t" x="52" y="211">Replication</text>
  <!-- ✓ Postgres, ✓ MySQL, ✗ SQLite -->

  <!-- Row 5: On-disk encryption (all ✗ except one) -->
  <rect class="box" x="40" y="224" width="600" height="36" rx="6"/>
  <text class="t" x="52" y="247">On-disk encryption</text>
  <!-- ✗ ✗ ✓ -->
</svg>
```

A 5-row × 4-column matrix at 36px row height lands the final body row's bottom at y=260, plus 40 bottom margin = viewBox height 300. Six rows pushes the bottom to 296 + 40 = 336 — still comfortable on the 680-wide canvas.

**Column x-midpoints (for 3 value columns).** Attribute column center: 120. Value column centers: 160 + 147/2 = 233.5 ≈ 234, 160 + 147 × 1.5 = 380.5 ≈ 381, 160 + 147 × 2.5 = 527.5 ≈ 528. The worked example above uses 267 / 413 / 560 because it centers the value columns on their actual bounding boxes after the 40px left canvas margin — recompute from `40 + 160 + (i + 0.5) × value_width` for your own grids.
