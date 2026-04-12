# Design System

The rules that make every diagram feel consistent. Adapted from Anthropic's Imagine Visual Creation Suite for standalone SVG output (self-contained, no host CSS, safe to embed anywhere).

## Philosophy

- **Flat**: No gradients, no drop shadows, no blur, no glow, no neon. Clean flat surfaces only. (One exception — see Illustrative diagrams.)
- **Compact**: Show the essential inline. If something needs a paragraph of explanation, it doesn't belong inside the diagram — move it to the prose around the diagram.
- **Seamless**: The SVG should feel like a native part of the surrounding article, not a foreign object. Transparent background — the host page provides the background.
- **Self-contained**: Every SVG carries its own `<style>` block and color definitions so it renders correctly in browsers, WeChat articles, markdown viewers, Notion, and any other host. See `svg-template.md`.

## Typography

Two body sizes. Sentence case. Plus a tiny poster toolkit for flowcharts that need a title and section headers.

**Body classes** (used by every diagram type):

| Class  | Size | Weight | Use for                                                    |
|--------|------|--------|------------------------------------------------------------|
| `t`    | 14px | 400    | Body text inside neutral boxes, single-line labels         |
| `th`   | 14px | 500    | Titles — the bold line in a two-line node                   |
| `ts`   | 12px | 400    | Subtitles, descriptions, leader-line callouts, legends     |

**Poster classes** (optional — only for poster flowcharts with titles and phase-grouped sections; see `flowchart.md`):

| Class     | Size    | Weight  | Use for                                                                          |
|-----------|---------|---------|----------------------------------------------------------------------------------|
| `title`   | 20px    | 600     | The mechanism name at the top of a poster flowchart. Used **once** per diagram.  |
| `eyebrow` | 10px    | 500     | Uppercase letter-spaced section dividers between phases. Muted gray. ≤40 chars.  |
| `caption` | 12px    | 400 italic | One-line footer hook below the whole diagram. Italic, muted gray.             |
| `anno`    | 12px    | 400     | Side-column annotation text next to a box ("sees: X / fresh context"). Muted.    |

Rules:
- **Never use font sizes outside this table.** Body diagrams get 14 and 12 only. Poster flowcharts can also use 20 (title) and 10 (eyebrow). No decorative 16/18/24.
- **Never use font-weight above 600.** 400, 500, and the single 600 in `.title` are the whole vocabulary.
- **Sentence case for body text.** "User login" not "User Login". The `.eyebrow` class is the single exception — its `text-transform: uppercase` is intentional typographic structure, not shouting.
- **No mid-sentence bolding.** If you need to emphasize a term, it belongs in a title (`th` or `title`) or as a label, not as bold text inside a subtitle.
- **No emoji.** Use simple SVG shapes (circles, triangles, lines) when you need a visual indicator.

Font family: the template sets `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` on the `<svg>` element. This gives the user's native system font, which is the closest portable approximation of Anthropic Sans.

## Color palette

Nine ramps, seven stops each, from the Imagine design system. Lower numbers are lighter; higher numbers are darker.

| Ramp     | 50       | 100      | 200      | 400      | 600      | 800      | 900      |
|----------|----------|----------|----------|----------|----------|----------|----------|
| gray     | #F1EFE8  | #D3D1C7  | #B4B2A9  | #888780  | #5F5E5A  | #444441  | #2C2C2A  |
| blue     | #E6F1FB  | #B5D4F4  | #85B7EB  | #378ADD  | #185FA5  | #0C447C  | #042C53  |
| teal     | #E1F5EE  | #9FE1CB  | #5DCAA5  | #1D9E75  | #0F6E56  | #085041  | #04342C  |
| purple   | #EEEDFE  | #CECBF6  | #AFA9EC  | #7F77DD  | #534AB7  | #3C3489  | #26215C  |
| coral    | #FAECE7  | #F5C4B3  | #F0997B  | #D85A30  | #993C1D  | #712B13  | #4A1B0C  |
| pink     | #FBEAF0  | #F4C0D1  | #ED93B1  | #D4537E  | #993556  | #72243E  | #4B1528  |
| amber    | #FAEEDA  | #FAC775  | #EF9F27  | #BA7517  | #854F0B  | #633806  | #412402  |
| green    | #EAF3DE  | #C0DD97  | #97C459  | #639922  | #3B6D11  | #27500A  | #173404  |
| red      | #FCEBEB  | #F7C1C1  | #F09595  | #E24B4A  | #A32D2D  | #791F1F  | #501313  |

### Light-mode color binding (what the template emits)

For any colored box use the ramp class on the shape or its immediate parent `<g>`:

- **fill**: stop 50 (lightest)
- **stroke**: stop 600 (strong border)
- **title text** (`th` class inside): stop 800 (darkest legible)
- **subtitle text** (`ts` class inside): stop 600 (one step lighter than title)

Title and subtitle MUST use different stops. Same stop reads flat; the 500 vs 400 weight alone is not enough contrast.

### Dark-mode color binding (automatic via `@media`)

- **fill**: stop 800
- **stroke**: stop 200
- **title text**: stop 100 (near-white on the ramp)
- **subtitle text**: stop 200

The template's `@media (prefers-color-scheme: dark)` block handles this automatically. No extra work required — just use the `c-{ramp}` classes.

## Color assignment rules

**Color encodes meaning, not sequence.** A diagram with five steps is not rainbow-colored — all five get the same ramp (or gray) unless they belong to different categories.

1. **Group by category**, not by position. All "immune cells" get purple. All "pathogens" get coral. Not step-1 blue, step-2 teal, step-3 amber.
2. **Use ≤2 ramps per diagram.** Gray + one accent is often the cleanest. More than two and the diagram starts to look like a child's toy.
3. **Gray is the default for neutral, structural, generic, start, or end nodes.** Reach for gray first, color second.
4. **Reserve blue/green/amber/red for semantic meaning** — blue for information, green for success, amber for warning, red for error. These carry strong UI connotations that surprise readers if used as "just another color". When you need a neutral accent, prefer purple, teal, coral, or pink.
5. **Exception — illustrative diagrams can use warm/cool mapping:** in illustrative cross-sections, warm ramps (amber, coral, red) mean heat/energy/pressure/activity, cool ramps (blue, teal) mean cold/calm/dormant. This is a physical mapping, not a semantic one, so it's fine.
6. **Exception — sequence diagrams may use one ramp per actor, up to 4 ramps total.** Each actor's header, lifeline context, and the arrows *originating* from that actor share a single ramp. Actor identity is a category (not a sequence), so this obeys the "encode meaning" rule — it just allows more categories than the normal ≤2-ramp cap. The legend is implicit: every ramp is anchored by its labeled actor header at the top of the diagram. See `sequence.md`.
7. **Exception — poster flowcharts may use up to 4 ramps, one per distinct agent/role.** Same principle as the sequence exception: the drafter, the critic, the synthesizer, and the judge are four different *kinds* of operation, not four sequential steps. Each ramp anchors identity. The stage's title box makes the legend implicit. See `flowchart-poster.md`.
8. **Exception — phase-band diagrams may use up to 3 ramp-colored arrow classes** when each ramp encodes a distinct *path type* (e.g., normal flow vs. exploit path vs. data exfiltration). The path type is the information the arrow carries — the ramp makes it visible at a glance rather than relying on labels on every crossing arrow. **A legend strip is mandatory.** See `flowchart-phase-bands.md`.

### If colors or arrow styles encode meaning, add a one-line legend

When a reader has to know what "purple means immune cell" to read the diagram, emit a small legend near the bottom with swatches:

```
[■] Immune cells    [■] Pathogens    [■] Outcome
```

The **same rule applies to arrow styles**. If the diagram uses ≥2 distinct arrow styles that carry meaning — solid `.arr` vs dashed `.arr-alt`, or two `.arr-{ramp}` colors for "memory read" vs "memory write" — add a legend entry for each style alongside the color swatches:

```
[──] Primary flow    [- -] Alternative path    [■] Active agent    [■] Store
```

A one-line legend is worth more than thirty words of explanatory text. When colors are just for visual interest (no encoded meaning) and only one arrow style is used, skip the legend.

## Icon / glyph policy

Most diagrams are pure text-in-boxes with arrows. When a box really does need a small pictorial element — a checkbox next to a TODO, a ✓/✗ circle on a decision branch, a document icon inside a "shared state store" box — use the shared glyph library at `references/glyphs.md`. Do not draw ad-hoc icons.

**Sourcing rule.** Every glyph must come from the `glyphs.md` set:

- `status-circle-check`, `status-circle-x`, `status-circle-dot` — decision/result indicators on arrow paths
- `checkbox-checked`, `checkbox-empty` — TODO list items
- `queue-slot-filled`, `queue-slot-empty` — queue visualization inside a box
- `doc-icon`, `terminal-icon`, `script-icon` — decorative icons inside a box
- `code-braces`, `annotation-circle` — label decorations
- `dashed-future-rect` — not yet executed / future state
- `pub-sub-arrow-pair` — paired publish/subscribe arrows for bus topology

If you need something that isn't in that list, either re-use the closest existing glyph or label the concept with plain text — do not invent a new icon shape inline. Adding a new glyph is a deliberate change to `glyphs.md`, not an improvisation inside a single SVG.

**Dark-mode rule.** Every glyph element — every `<circle>`, `<rect>`, `<path>`, `<line>`, `<text>` that makes up a glyph — must inherit its color from one of the existing classes defined in `svg-template.md`:

- Shape fill/stroke: `box`, `c-{ramp}`, `arr`, `arr-alt`, `arr-{ramp}`
- Text: `t`, `th`, `ts`

Never emit inline `fill="#..."`, `stroke="#..."`, or `color="#..."` inside a glyph. Hex colors are frozen at author time and do not participate in the `@media (prefers-color-scheme: dark)` re-mapping, so inline-colored glyphs become invisible or wrong-contrast in dark mode. The only inline colors permitted anywhere in a glyph are `fill="none"` and `stroke="none"` — both of which are colorless and safe.

**Scope rule.** Glyphs are not allowed everywhere:

| Diagram type | May use glyphs? | Notes                                                                                         |
|--------------|-----------------|-----------------------------------------------------------------------------------------------|
| flowchart    | yes             | Status circles on decision branches, queue slots inside a box, checkboxes inside a checklist. |
| structural   | yes             | Doc/terminal/script icons inside a "state store" box, checkboxes inside a side-by-side list.  |
| illustrative | yes             | Annotation circle on a connector; decorative icon inside a subject box.                       |
| sequence     | no              | Sequence diagrams express everything through messages and lifelines — keep them text-only.    |

When in doubt, do not add a glyph. A diagram that needs a pictorial hint to be understood is usually a diagram whose labels are too terse.

## Hard rules

These never bend (except where an exception is listed explicitly).

- No `<!-- comments -->` inside the final SVG output (they waste bytes and don't help readers).
- No gradients, shadows, blur, glow, neon. Flat fills only. Exception: illustrative diagrams may use ONE `<linearGradient>` between two stops of the same ramp to show a continuous physical property (temperature, pressure). See `illustrative.md`.
- No dark or colored background on the outer `<svg>` element. Transparent only — the host provides the background.
- No font size outside the typography table. Body diagrams use 14 and 12. Poster flowcharts may *additionally* use 20 (title) and 10 (eyebrow). Nothing else.
- Sentence case for body text. The `.eyebrow` class's `text-transform: uppercase` is the single allowed ALL-CAPS usage — it's a typographic eyebrow label, not shouting.
- No emoji. Use SVG primitives (circles, triangles, lines) when you need a glyph.
- No rotated text (`transform="rotate(...)"` on `<text>`). Exception: a single left-rail loop-scope label in a poster flowchart may use `transform="rotate(-90 ...)"` — this is the *only* place rotated text is allowed. See `flowchart.md` → "Loop-scope bracket".
- No `filter`, no `pattern`, no radial gradients. The only thing allowed in `<defs>` is the arrow marker, an optional `<clipPath>`, and — for illustrative only — one `<linearGradient>`.
- `<text>` never auto-wraps in SVG. If a label is long enough to need wrapping, it's too long — shorten it or split across two `<text>` elements stacked vertically. See `layout-math.md` for character budgets.

## Why these rules exist

Most of the rules trace back to one principle: **the diagram has to survive streaming rendering, dark mode, and embedding in unknown hosts**. Gradients flash during streaming. CSS variables don't exist outside claude.ai. Emoji render at font-inherited sizes and blow up scale. Rotated text misaligns on CJK fonts. Rainbow colors look like decoration, not information. The design system is narrow on purpose so the result is consistent and portable.
