# Flowchart: Poster Pattern

Load this file when **≥3 of the poster triggers in Step 4a** fire: the topic has a short name, a "why it exists" sentence, named phases, parallel candidates, a loop condition, overflow annotations, or a footer quote.

A poster flowchart is a richer dialect of the regular flowchart, meant for topics that have a **name, a motivation, phases, parallel candidates, and a loop condition** — things like research methods, iterative algorithms, reasoning frameworks. Instead of a flat sequence of boxes, it reads like a one-page explainer: title at the top, eyebrow-labeled phases, side notes, a left-rail loop bracket, and a footer hook.

This is the dialect the reader remembers. Use it when the content earns it — not every flowchart deserves this treatment.

## When to switch into poster mode

Check all of these. If three or more are true, switch to poster mode:

- [ ] The topic has a **short name** (Autoreason, Chain-of-Thought, AutoResearch, Reflexion) that belongs on the page as a title.
- [ ] The source has a **"why this exists" sentence** that belongs under the title as a subtitle.
- [ ] The stages **group into 2–4 named phases** (e.g., "The loop" / "Three candidates generated" / "Convergence check"), not just one monotonic column.
- [ ] At some point **N parallel candidates are generated** and then compared — a fan-out + judge pattern.
- [ ] There's a **loop with a specific termination mechanic** (streak counter, convergence check, fixed iteration cap).
- [ ] Individual boxes need **context that won't fit as a subtitle** — "sees X, no bias, fresh context" — which wants to live in a right-side annotation column.
- [ ] The source has a **quotable hook** (a test result, a framing quote) that belongs in a footer caption.

If only 0–1 of these are true, stick with the simple flowchart. Poster machinery on a three-box diagram is over-dressed.

## Anatomy

```
    [  TITLE (20px bold, centered)              ]
    [  Subtitle (ts, one line, centered)        ]

    [ EYEBROW: PHASE 1                          ]
    [    box   ]                 [ side anno   ]
    [    box   ]                 [ side anno   ]

    [ EYEBROW: PHASE 2                          ]
  ┌ [ box ]   [ box ]   [ box ]                  ← fan-out row
  │     \       |       /
  │      \      |      /
  │      [    judge box    ] ←——— [ side anno ]
  │
  │ [ EYEBROW: PHASE 3                          ]
  │ [    convergence / streak box    ] ←——— [ side anno ]
  └ (dashed left rail, rotated label "loop until …")

    [ CAPTION: footer hook (italic ts, centered) ]
```

The left rail is a dashed vertical line with a rotated label, visually scoping which boxes are "inside the loop". The right side is an annotation column — each major box can have a short `anno`-class note sitting at its right edge.

## Layout budget

A poster flowchart is taller and denser than a simple flowchart. The soft node cap jumps:

- Simple flowchart: ≤5 nodes.
- Poster flowchart: ≤12 nodes, grouped into ≤4 phases. Each phase should fit in 2–4 boxes.

viewBox width is still 680, but the interior is now divided into a main column and an annotation column:

| Column        | x range  | Used for                                             |
|---------------|----------|------------------------------------------------------|
| Loop rail     | 40–60    | Dashed vertical line + rotated label (optional)      |
| Main flow     | 80–470   | Boxes, arrows, eyebrows, title, caption              |
| Annotation    | 485–640  | `anno`-class side notes (12px, left-anchored)        |

Center the main column at x=275 (midpoint of 80 and 470), with box width up to 390. Eyebrow labels sit at x=80 (left-anchored) so they feel like "the section starts here" rather than drifting in the middle.

## Vertical geometry

```
title baseline         y = 46                (class "title")
subtitle baseline      y = 68                (class "ts")
first eyebrow          y = 100               (class "eyebrow")
first main box top     y = 116               (gap 16 below eyebrow)
phase separator        y = box_bottom + 32   (eyebrow) — eyebrow label sits 16 above next box
caption baseline       y = last_box_bottom + 44 (class "caption", italic ts)
viewBox height         H  = caption_y + 20
```

Boxes inside a phase use a 16px vertical gap between a box and the next (tighter than the 60px used in simple flowcharts — poster mode is more compact because the eyebrow already gives visual breathing room).

## Title and subtitle

Place the `.title` element at roughly (340, 46), `text-anchor="middle"`, `dominant-baseline="central"`. Keep it to 1–3 words — "Autoreason", "Chain-of-thought", "Reflexion loop". If you need a verb, you're doing a caption, not a title.

Place the subtitle at (340, 68), `text-anchor="middle"`, `class="ts"`. One line only. Use it to answer "why does this method exist" in the reader's language: *"No score to optimize? Replace the metric with agents arguing."* Pitch the question, don't define the mechanism — the mechanism is the diagram itself.

## Eyebrow section headers

A `.eyebrow` is a tiny uppercase label that separates phases. Place it at x=80 (left-anchored), `text-anchor="start"`, and let the CSS `text-transform: uppercase` handle the casing — write the label in sentence case in the source. Keep labels short (≤40 chars) and *descriptive of the phase*, not the specific box:

- Good: "The loop", "Three candidates generated", "Convergence check"
- Bad: "Step 2", "Authentication service", "Click handler"

Eyebrows are dividers, not titles. They should feel quiet — if a reader notices them first, they're too loud.

## Anchor box

When a constant input is shared across every stage (the user's task prompt, the training dataset, a knowledge base), draw it **above** the main loop with an eyebrow like "ANCHOR — SEEN BY ALL AGENTS" (write it sentence-case; the CSS uppercases). This visually communicates "this thing doesn't iterate — it's the fixed reference". The arrow from the anchor into the first loop box can be a short straight line or omitted entirely if the eyebrow makes the relationship clear.

## Fan-out + judge pattern

When N candidates are generated in parallel and then compared, lay them out as a horizontal row feeding into a single judge box below. Suggested coordinates for 3 candidates, each 160 wide:

```
Row centers:  165, 275, 385
Row y:        (chosen by phase position)
Row box w:    160, h: 72 (three-line is allowed here: label · id + two descriptive lines)
Gap:          110 px (from center to center: 275 - 165 = 110)
```

Arrows from each candidate converge on the judge box below. Route each as an L-bend that meets a common `ymid` a few pixels above the judge box top, then drops straight down into the judge's top edge:

```svg
<path d="M 165 P1b L 165 ymid L 275 ymid" class="arr"/>
<line x1="275" y1="P2b" x2="275" y2="ymid" class="arr"/>
<path d="M 385 P3b L 385 ymid L 275 ymid" class="arr"/>
<line x1="275" y1="ymid" x2="275" y2="judge_top-10" class="arr" marker-end="url(#arrow)"/>
```

where `P1b`, `P2b`, `P3b` are the candidate box bottoms and `ymid` is a horizontal channel 12–20px below them. Only the final vertical into the judge carries the arrowhead — the convergence into `ymid` is unheaded.

The candidates often want slightly different colors to communicate "these are three distinct things, not three steps". Using three ramps here is fine; it's an identity category, not a sequence. Keep gray for "A · keep (unchanged)" because it's the status-quo baseline — the accent ramps go to the boxes that represent actual work.

## Side-annotation column

When a box needs more context than fits in its subtitle — "sees task + draft A / adversarial by design / fresh context" — put the overflow in the right annotation column at x=485, text-anchor="start", class="anno". Stack 1–3 short lines vertically, each 14px tall:

```svg
<text class="anno" x="485" y="box_cy - 14" text-anchor="start">sees: task + draft A</text>
<text class="anno" x="485" y="box_cy"      text-anchor="start">adversarial by design</text>
<text class="anno" x="485" y="box_cy + 14" text-anchor="start">fresh context</text>
```

`box_cy` is the vertical center of the box the annotation belongs to. Always keep each line ≤22 characters so the column doesn't spill past x=640. Annotations are *quiet* — they use the `anno` class (muted gray in both modes) and never have their own boxes or borders.

## Loop-scope bracket (left rail)

When a phase or a contiguous set of phases repeat until a condition is met, draw a dashed vertical line along the left margin at x=55 from the top of the loop to the bottom, and place a rotated label to the left of it:

```svg
<line x1="55" y1="loop_top" x2="55" y2="loop_bottom" class="leader"/>
<text class="ts" x="45" y="(loop_top+loop_bottom)/2"
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate(-90 45 LOOP_CENTER_Y)">loop until streak = 2</text>
```

Use the `leader` class for the line (dashed, light gray) so it doesn't compete with the forward arrows. Keep the rotated label to ≤20 characters. This is the **only** place rotated text is allowed in the whole skill — do not use `transform="rotate"` anywhere else.

## Convergence / termination box

The loop needs to visibly terminate somewhere. Draw a final box (usually gray) that holds the *termination mechanic itself* — not a generic "converged" flag, but the actual rule:

```
Winner becomes new A
A wins again: streak++
B or AB wins: streak = 0
```

The convergence box is three-line (h=72) to hold the mechanic plainly. The right annotation column expands the semantics:

```
streak = 2?
stop, converged
streak = 0?
loop again
```

## Footer caption

A single italic ts line at the bottom of the diagram, centered, `class="caption"`. Use it for a test result, a quote, or a memorable framing — *"In testing: 35/35 blind panel — next best method scored 21"*. One line, never two. If the content needs two lines, it belongs in prose around the diagram, not in the diagram.

## Color budget in poster mode

Poster flowcharts may use up to 4 ramps, one per **role category** — the drafter, the attacker, the synthesizer, the judge. Same rule as sequence diagrams: identity is a category, not a sequence. Gray is still the default for start/end/anchor/convergence boxes; the accent ramps go to the stages that represent distinct agent roles.

Suggested mapping for agent-style posters:

- **Drafter / author** → purple (thoughtful, creative)
- **Critic / strawman / attacker** → coral (adversarial, attention)
- **Synthesizer / merger** → teal (calm, combining)
- **Judge / evaluator** → amber (deliberate, weighty)
- **Baseline / keep-unchanged / anchor / convergence** → gray

Do not use more than 4 ramps. Two of the five roles above will usually collapse into one color or default to gray.

## Worked coordinate sketch

For a 5-phase poster flowchart with ~10 boxes and an annotation column, expect a viewBox around 680×950:

```
title + subtitle       y = 30–80
anchor eyebrow + box   y = 100–168
loop eyebrow           y = 192
drafter box            y = 208–272
critic box             y = 296–360
candidate eyebrow      y = 392
fan-out row            y = 408–480
judge box              y = 530–594
convergence eyebrow    y = 626
convergence box        y = 642–714
caption                y = 750
viewBox H              770
loop rail              y1 = 200, y2 = 720
```
