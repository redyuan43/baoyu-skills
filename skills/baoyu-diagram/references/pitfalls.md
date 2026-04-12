# Pitfalls Checklist

Run through this list after writing the SVG and before saving the file. Most diagram failures are one of these ten, and they all happen silently — the SVG is "valid" but looks wrong when rendered.

Read this as a code review on yourself. If any item fails, fix the SVG and re-check.

## 1. viewBox clips content

**Symptom**: the bottom row of boxes is cut off, or a label disappears past the right edge.

**Check**:
- Find the lowest element. For rects: `y + height`. For text: `y + 4` (descender). For circles: `cy + r`.
- `viewBox` height must be `max(those) + 20` or more.
- Find the rightmost element. For rects: `x + width`. No rect's right edge should exceed 640.

**Fix**: increase `H` in `viewBox="0 0 680 H"`, or shrink the content horizontally.

**Exception — subsystem architecture pattern.** The 2-up sibling containers (see `structural.md` → "Subsystem architecture pattern" and `layout-math.md` → "Sibling subsystem containers (2-up)") deliberately sacrifice the 40px horizontal safe margin so each sibling interior is wide enough for a short internal flow. With `container_A.x=20` and `container_B.x=345, width=315`, container B's right edge lands at **660**. That is the documented layout; rects belonging to the 2-up pattern may extend up to x=660 instead of 640. All content *inside* each container (internal nodes, cross-system labels) still respects its own interior edge — no individual flowchart rect inside a sibling should touch the dashed border.

## 2. Text overflows its box

**Symptom**: a label spills out past the border of its container.

**Check**: for every labeled rect, compute `label_chars × char_width + 24` (8 for 14px latin, 7 for 12px latin, 15 for 14px CJK). The rect's width must be ≥ that number.

**Fix**: widen the rect, or shorten the label. Subtitles > 5 words are always a smell — cut them.

## 3. Arrow crosses an unrelated box

**Symptom**: an arrow visibly slashes through the interior of a rect it's not anchored to.

**Check**: for every arrow, trace its line segment(s). For every other rect in the diagram, does the arrow cross the rect's interior? If yes, it's a bug.

**Fix**: replace the straight `<line>` with an L-bend `<path>` that routes around the obstacle:

```svg
<path d="M x1 y1 L x1 ymid L x2 ymid L x2 y2" class="arr" fill="none" marker-end="url(#arrow)"/>
```

Pick `ymid` so the horizontal channel runs through empty space between rows.

## 4. Connector path is missing `fill="none"`

**Symptom**: a curved connector renders as a giant black blob instead of a thin line.

**Check**: every `<path>` or `<polyline>` used as a connector must have `fill="none"` as an explicit attribute. SVG defaults paths to `fill: black`.

**Fix**: add `fill="none"` — or use the `arr` class, which already sets it.

## 5. Text has no class, renders as default

**Symptom**: a label looks slightly different from the rest — wrong size, wrong color, or black in dark mode.

**Check**: every `<text>` element must have a class: `t`, `ts`, `th`, or (in poster flowcharts only) `title`, `eyebrow`, `caption`, `anno`. No unclassed text. No `fill="inherit"`. No hardcoded `fill="black"`.

**Fix**: add the appropriate class. `t` for single-line body, `th` for titles (bold), `ts` for subtitles and callouts. In a poster flowchart, `title` for the top label, `eyebrow` for section dividers, `caption` for the footer hook, `anno` for right-column side notes.

## 6. Title and subtitle use the same color stop

**Symptom**: a two-line node looks visually flat — the title and subtitle blur together.

**Check**: inside any `c-{ramp}` box, the `th` and `ts` children must land on different stops. The template handles this automatically (th → stop 800, ts → stop 600), so this only breaks if you manually override a fill. Don't.

**Fix**: remove the inline `fill=` override; let the template classes do their job.

## 7. `text-anchor="end"` at low x

**Symptom**: a label is missing from the left side of the diagram — it's actually there, but it extends past x=0 and is clipped by the viewBox.

**Check**: for every `<text>` with `text-anchor="end"`, the label's width must fit to the left of its x coordinate: `label_chars × char_width < x`.

**Fix**: use `text-anchor="start"` and right-align the column manually, or move the text to a higher x.

## 8. Color rainbow (colors cycle instead of encoding meaning)

**Symptom**: a 5-step flowchart uses blue-teal-amber-coral-purple, one per step. Reader can't tell if the colors mean anything.

**Check**: do colors encode categories (all "immune cells" share one color) or do they encode sequence (step-1 blue, step-2 teal)? Sequence is wrong.

**Fix**: collapse to ≤2 ramps. Use gray for neutral/structural/sequential steps. Reserve one accent color for whichever nodes deserve emphasis — the decision point, the anomaly, the main character of the story.

## 9. Too many boxes in a full-width row

**Symptom**: boxes overlap each other, or text spills across box borders.

**Check**: `N × box_width + (N - 1) × gap ≤ 600`. If you tried to fit 5+ boxes at default width (180 each), you've already overflowed.

**Fix**:
- Shrink box_width to ≤110 (drops subtitles)
- Wrap to 2 rows
- Split into overview + detail diagrams

## 10. Cycle drawn as a physical ring

**Symptom**: a four-stage cycle (Krebs, event loop, GC) is laid out with boxes orbiting a dashed circle. Labels collide with stage boxes; feedback arrows point at weird angles.

**Check**: does the diagram try to show a loop by arranging boxes in a circle?

**Fix**: lay the stages out linearly (horizontal or vertical) and draw a single return arrow from the last stage back to the first — or simply add a small `↻ returns to start` label near the endpoint. The loop is conveyed by the return arrow, not by literal ring geometry.

## 11. Dark-mode invisible text (bonus check)

**Symptom**: the SVG looks fine in light mode, but text disappears in dark mode.

**Check**: did you hardcode any `fill="#..."` or `fill="black"` on a `<text>` or ignore the `t`/`ts`/`th` classes? If yes, dark mode won't override it.

**Fix**: remove hardcoded fills on text. Let the template classes handle both modes.

**Exception**: physical-color scenes (sky blue, grass green, water teal in an illustrative diagram) *should* stay the same in both modes. Hardcode those hex values deliberately. But all label text — the `<text>` elements with callouts and titles — must use the classes.

## 12. `<!--` comments left in the SVG (bonus check)

**Symptom**: final SVG has HTML comments. They waste bytes and some markdown renderers show them.

**Check**: grep for `<!--` in your generated SVG. There should be none in the output (even though they appear in the template documentation above).

**Fix**: strip them before saving.

## 13. Lifeline clipped at the bottom (sequence)

**Symptom**: the last message arrow looks like it's hanging in space because the lifeline ends at the arrow's y, with no tail beneath it.

**Check**: `lifeline_y2 ≥ last_arrow_y + 24`. Every lifeline needs a 24px tail past the last message.

**Fix**: extend all lifeline `<line y2="...">` values to `last_arrow_y + 24` and bump viewBox H accordingly.

## 14. Actor header overflow (sequence)

**Symptom**: the title or role text spills past the actor header rect.

**Check**: `max(title_chars × 8, role_chars × 7) + 24 ≤ header_w`. For N=4, header_w=120, so the title caps at (120 − 24) / 8 = 12 characters. Longer titles need a shorter actor, a merged actor, or dropping the role subtitle.

**Fix**: cut the role subtitle first (it's optional), then shorten the title. Never widen the lane beyond the table in `layout-math.md` — it breaks the tier packing.

## 15. Message label too long for its lane span (sequence)

**Symptom**: a message label collides with an adjacent actor's header or another message label.

**Check**: `label_chars × 7 ≤ |sender_x − receiver_x| − 8`. For N=4 adjacent lanes (|Δx|=160), labels cap at ~21 chars. For longer leaps the budget grows linearly.

**Fix**: shorten the label (the most effective fix — "Redirect with client_id, scope" → "Redirect + client_id"), or restructure the message between actors that are further apart on the diagram (rare).

## 16. Arrow endpoint mispositioned on lifeline (sequence)

**Symptom**: the arrowhead touches the dashed lifeline stroke and looks smeared, or the arrow stops 15px short and looks disconnected from the target.

**Check**: every message arrow's `x2` must equal `receiver_x ± 6` (minus 6 for left-to-right, plus 6 for right-to-left). Same for `x1` on the sender side.

**Fix**: recompute every arrow's x1/x2 from the lifeline center table. Never eyeball.

## 17a. Poster flowchart missing its title or subtitle

**Symptom**: the diagram contains eyebrow-divided phases and a fan-out row, but no `title` at the top — it looks like a collection of boxes floating in space.

**Check**: if the diagram qualifies as a poster (≥3 of the poster triggers in `flowchart.md`), it *must* have a `.title` at the top. The title is the reader's first anchor — without it, the eyebrows and side notes feel unmoored.

**Fix**: add a one-line `.title` with the mechanism name at (340, 46), and a `.ts` subtitle at (340, 68) that frames the "why".

## 17b. Fan-out row conflates "candidates" with "sequence"

**Symptom**: three side-by-side boxes labeled step 1 / step 2 / step 3, each in a different color.

**Check**: a fan-out row should contain **parallel alternatives** that all feed into a judge, not sequential steps. If the boxes have a reading order, they belong in a column, not a row. Colors on a fan-out row are fine *if* they represent distinct candidate identities (keep / rewrite / synthesize), not fine if they're decorating sequence.

**Fix**: either reorient to a vertical column (sequence) or rewrite the labels so each is clearly a *kind* of candidate (A · keep, B · rewrite, AB · synthesize), not a step number.

## 17c. Side-annotation column floats too far from its box

**Symptom**: an `anno` line at y=200 is supposed to belong to a box at y=300 — 100px away — and the reader has to guess which box it describes.

**Check**: an annotation line's y must fall inside the vertical range of its target box (top to bottom). For a 56-tall box at y=300, annotations belong at y between 304 and 350. One line at the box center, or up to three lines vertically centered on the box.

**Fix**: recompute each annotation's y from its target box's y + height/2, then stack lines at ±14px from center.

## 17d. Loop-rail rotated label clips the top or bottom

**Symptom**: the rotated "loop until …" label extends past the loop rail line, or overlaps the first/last box inside the loop.

**Check**: `transform="rotate(-90 cx cy)"` rotates around `(cx, cy)`, where the text after rotation occupies ≈ `label_chars × 7` horizontally (now vertically post-rotation). The rotated label's extent must fit between `loop_top` and `loop_bottom`.

**Fix**: shorten the label (≤20 chars), or extend the rail.

## 18. Self-message rect not centered on its lifeline (sequence)

**Symptom**: the small self-message rect sits to one side of the lifeline, not straddling it.

**Check**: `rect_x = lifeline_x − rect_w / 2`. For `rect_w = 16`, that's `lifeline_x − 8`. Off-by-one is easy when rect_w is small.

**Fix**: recompute rect_x from the lifeline x. Double-check the rect has the actor's `c-{ramp}` class so the fill matches the lifeline's owning actor.

## 19. Bus-topology bar not centered or shifted off-axis

**Symptom**: the central horizontal bar in a message-bus diagram is slightly off-center, so the Publish/Subscribe arrow pairs from the top and bottom agents don't line up symmetrically and the whole diagram feels tilted.

**Check**: the bus bar must sit at `x=40 y=280 w=600 h=40` (see `layout-math.md` → "Bus topology geometry"). `bar_cx = 340`. Every agent row must center on that same `bar_cx` axis — if the top row is centered at x=340 but the bottom row drifts to x=335, the diagram is crooked.

**Fix**: recompute top and bottom agent x positions from the shared center using the "Bus topology geometry" table. Agents per row: 2 → centers at 180, 500. 3 → 170, 340, 510. 4 → 120, 260, 420, 560. Don't eyeball.

## 20. Radial-star satellites not at symmetric offsets

**Symptom**: three or four "satellite" boxes around a hub are almost, but not quite, evenly spaced — one is 20px further from the hub than the others, or one sits at a slightly different y than its mirror.

**Check**: use the fixed satellite coordinate table in `layout-math.md` → "Radial star geometry". The N=4 boxes must sit at `(60, 120)`, `(460, 120)`, `(60, 460)`, `(460, 460)` — any deviation breaks the mirror symmetry and the eye catches it immediately.

**Fix**: copy the coordinate table verbatim. If you need a satellite at a non-symmetric position because its label is longer, the pattern isn't the right shape — drop the satellite to a subtitle or switch to a bus topology.

## 21. Spectrum axis arrow covered by end label

**Symptom**: the left or right end of the spectrum axis's arrowhead sits behind the end label's text, or the label's descender touches the arrowhead.

**Check**: axis at `y=140`, end labels at `y=120` — that's only 20px of vertical separation. For end labels that include descender glyphs (p, g, y, q), the descenders sit around `y=124`, leaving 16px to the arrowhead. Verify the label baseline at 120 and that `text-anchor` correctly flushes each label to its axis end (`start` on left, `end` on right).

**Fix**: if the label still collides after fixing the text-anchor, bump end-label `y` to `116` (4px clearance above the arrowhead).

## 22. Box icon overlapping its text

**Symptom**: a `doc-icon` or `terminal-icon` inside a structural/illustrative box touches or overlaps the subtitle text below the title.

**Check**: for a box with title `y+22` and subtitle `y+40`, the subtitle baseline sits at `box_y + 44` (including descender). The icon's top must sit at **≥ 8px below that**, so `icon_top ≥ box_y + 52`. For a 28-tall icon, `box_h ≥ 52 + 28 + 8 = 88`. The documented minimum in `glyphs.md` is 80, which assumes a title-only box (no subtitle) — grow to 88 when both title and subtitle are present.

**Fix**: grow `box_h` until the math works, or drop the subtitle if the box is already at the design max height.

## 23. Checklist row width overflow

**Symptom**: a checkbox + label row inside a subsystem container runs past the container's right edge and the label clips.

**Check**: inside a 315-wide subsystem container, checklist width budget is `interior_w − checkbox_w − gap − right_padding = 275 − 14 − 8 − 20 = 233` px, so `label_chars × 8 ≤ 233` → cap at ~29 Latin chars (or 15 CJK). The `glyphs.md` doc cites ~31 Latin chars for a looser budget — use 29 when you want a safety margin inside a sibling container.

**Fix**: truncate the label or wrap to two rows. Don't shrink the checkbox — 14px is the floor.

## 24. Status circle not aligned with the arrow path

**Symptom**: a `status-circle-check` (or `-x`, `-dot`) glyph sits next to the arrow instead of **on** it, or sits exactly on the arrow's path but the arrow still draws through the circle's center as a single continuous line.

**Check**: the arrow must be **split into two segments**: segment 1 from source to `(circle_cx − 14, circle_cy)`, segment 2 from `(circle_cx + 14, circle_cy)` to target. If the original `<line>` is still there in one piece, delete it and replace with the two segments.

**Fix**: recompute the two segments. Both get `marker-end="url(#arrow)"` so each has its own arrowhead landing 2px before the circle's edge. See `flowchart.md` → "Status-circle junctions" for the exact template.

## 25. Dashed future-state node drifts out of row alignment

**Symptom**: a dashed `arr-alt`-class rect in a DAG sits at y=180 while the solid nodes around it sit at y=180.5 (or whatever the stroke-centering math produces), so the row looks misaligned even though the coordinates match.

**Check**: SVG strokes are centered on the path, so a rect with `stroke-width="1.5"` extends 0.75 px into the interior *and* 0.75 px outside its `x/y/width/height` attributes. Because the dashed rect's stroke is a different *pattern* from the solid rect's stroke, the visual difference can magnify this half-pixel. For perfect row alignment, the dashed rect and the solid rect must share the exact same x, y, width, and height — any "nudge by 1 to compensate" breaks the row.

**Fix**: keep the coordinates identical. If the visual misalignment persists and you've confirmed the coords match, the issue is the dash pattern start position, not the coordinates — try `stroke-dashoffset="0"` to force dash alignment, or accept the micro-difference (it's imperceptible at 1× zoom).

## 26. Parallel-rounds y's not at a consistent pitch

**Symptom**: three rounds stacked vertically look visually uneven because the gaps between rounds aren't equal — round 1→2 is 80px but round 2→3 is 72px.

**Check**: round pitch is **80** in the full-width variant (`layout-math.md` → "Parallel rounds geometry"). Round k's call arrow y = `124 + (k−1) × 80`. If you computed round 2's y from round 1 by eye, recheck — "visually close enough" is not close enough for a side-by-side comparison diagram.

**Fix**: recompute all round y's from the table.

## 27. Annotation-circle connector line not perpendicular to the arrow

**Symptom**: the small vertical line connecting an annotation circle to its underlying arrow pair is slightly tilted because its x doesn't match the circle's center x.

**Check**: the connector line's `x1` and `x2` must both equal `circle_cx`. The circle is placed via `translate(cx − 32, cy − 32)`, so the circle's center is `(cx, cy)` in diagram coordinates. The connector's `y1 = cy + 30` (bottom of circle), `y2 = arrows_y_midpoint`.

**Fix**: recompute `x1 = x2 = circle_cx`. Don't set them from the translate offsets directly — use the diagram-space `cx` you passed to translate.

## 28. Glyph using inline fill or stroke, broken in dark mode

**Symptom**: a `status-circle-check`, `doc-icon`, or `annotation-circle` renders correctly in light mode but is invisible (or wrong color) in dark mode.

**Check**: grep the SVG for any `fill="#..."` or `stroke="#..."` inside a glyph's element tags. Glyphs must use only CSS classes (`c-{ramp}`, `arr-{ramp}`, `arr`, `arr-alt`, `box`, `t`/`th`/`ts`) so the template's `@media (prefers-color-scheme: dark)` block inverts them automatically.

**Fix**: replace every hardcoded color on a glyph element with the corresponding class. If you need a color that isn't in the 9-ramp palette, you don't need a new color — you're asking the glyph to say something it shouldn't. See `glyphs.md` → "Hard rules" for the full policy.

---

## Quick self-review template

Before writing the file, mentally run through:

> 1. Lowest element is at y = ___ → viewBox H = ___ + 20 = ___  ✓
> 2. Rightmost rect edge is at x = ___ → ≤ 640  ✓
> 3. Longest label is "___" (___ chars) → needs width ___ → actual width ___  ✓
> 4. Arrows checked against all boxes → no crossings  ✓
> 5. All connector paths have `fill="none"`  ✓
> 6. All `<text>` elements have a class  ✓
> 7. Colors: ≤ 2 ramps → ___ and ___ → assigned by category  ✓
> 8. No hardcoded text fills  ✓
> 9. No comments in final output  ✓

If any of these feel fuzzy, the diagram isn't ready.
