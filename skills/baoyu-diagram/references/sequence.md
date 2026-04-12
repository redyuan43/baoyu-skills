# Sequence Diagram

For multi-actor protocols and conversations — "who talks to whom, in what order". A row of actor headers at the top, dashed lifelines dropping down, and numbered horizontal message arrows between them. The classic UML sequence diagram, adapted to this skill's design system.

## When to use

- Authentication and authorization flows — OAuth, OIDC, SAML, Kerberos, JWT refresh, mTLS handshakes
- Wire protocols — TCP three-way handshake, TLS handshake, WebSocket upgrade, HTTP/2 multiplex
- RPC patterns — gRPC unary and streaming, JSON-RPC, GraphQL over websockets
- Webhooks, callbacks, and event dispatch — stripe webhooks, GitHub events, PubSub fan-out
- Any "request + response" dance between 2–4 named services where *order* and *who initiates what* is the point

**Trigger verbs**: "protocol", "handshake", "auth flow", "request/response", "exchange between", "round trip", "who calls what", "API dance".

**When not to use**:
- Single-actor sequential process → `flowchart.md` ("what steps does the build pipeline run")
- Containment / architecture / "what lives inside what" → `structural.md`
- "Feel how X works" / mechanism intuition → `illustrative.md`

**Routing test**: if the prompt names ≥2 distinct actors/participants/services (User + Server, Client + Auth + Resource, Browser + CDN + Origin), prefer sequence even when the noun is "flow" or "process". Single-actor "X flow" stays flowchart.

## Planning before you write SVG

1. **List the actors**, 2–4 of them, in the order they appear across the page (usually left = initiator, right = downstream services). Each actor needs a short title (≤12 chars for N=4) and an optional single-line role subtitle.
2. **Assign one color ramp to each actor**. Default palette: `[c-gray, c-teal, c-purple, c-blue]` left-to-right. Swap in `c-coral`, `c-pink`, `c-amber`, `c-green` as needed — pick cool/neutral ramps and avoid semantic collisions (green for success, red for error) unless the actor literally means that.
3. **List the messages** as ordered tuples `(sender, receiver, short label)`. Cap at 10 messages — 6–8 is the sweet spot. If your protocol has more, split into an overview diagram and one detail diagram per sub-flow.
4. **Mark self-messages** — messages that stay on the same lifeline (e.g., "validate token" on the resource server). Limit to 1–2 per diagram.
5. **Plan a side note** — a short title that names the protocol. For N ≤ 3, place it at top-left beside the first actor header. For N ≥ 4, place it at bottom-left under the lifelines.
6. **Check every message label** against its lane span using the budget formula in `layout-math.md`. Shorten aggressively — labels that barely fit today will overflow if you tweak the actor order.

Save the plan to `plan.md` alongside the SVG so the next iteration can read it.

## Actor headers

Each actor header is a two-line node (title + role) or a single-line node (title only), wrapped in a `c-{ramp}` group. Height is always 48, y=40..88.

Single-line (title only):

```svg
<g class="c-gray">
  <rect x="40" y="40" width="120" height="48" rx="8"/>
  <text class="th" x="100" y="64" text-anchor="middle" dominant-baseline="central">User</text>
</g>
```

Two-line (title + role):

```svg
<g class="c-teal">
  <rect x="200" y="40" width="120" height="48" rx="8"/>
  <text class="th" x="260" y="60" text-anchor="middle" dominant-baseline="central">Client app</text>
  <text class="ts" x="260" y="78" text-anchor="middle" dominant-baseline="central">Web</text>
</g>
```

Rules:
- Header width matches `header_w` from `layout-math.md` (e.g., 120 for N=4).
- Header x = lane center − header_w/2.
- Title `y = 60` when role is present, `y = 64` when title-only (centered in the 48px box).
- Role `y = 78`, always `ts`.
- Sentence case. "Auth server", not "Auth Server".

### Pill-shaped actor header (optional)

An actor that represents an **external participant** — `Human`, `User`, `Environment`, an input source, an output sink — can use a pill-shaped header (`rx = height / 2 = 24`) instead of the default rounded rect. The capsule shape visually separates "outside the system" from "inside the system" without using color.

```svg
<g class="c-gray">
  <rect x="40" y="40" width="120" height="48" rx="24"/>
  <text class="th" x="100" y="64" text-anchor="middle" dominant-baseline="central">Human</text>
</g>
```

Rules:
- **Only for external actors.** Internal services (Auth server, Client app, Resource server) keep the `rx="8"` rectangle. Mixing pills and rects in the same diagram is fine as long as the distinction tracks "external vs internal" — if every actor is a pill, drop them all back to rectangles.
- **Height is still 48.** `rx` must equal `height / 2 = 24`. Don't adjust the height.
- **No role subtitle** inside a pill. The capsule is for actors whose name is self-explanatory (Human, Environment). If you need a subtitle, you want a rectangle, not a pill.
- **At most 2 pills per diagram.** More than that and the visual contrast between external and internal actors disappears.

## Lifelines

One `<line>` per actor, using `class="lifeline"`, from y=92 down to the tail below the last message.

```svg
<line class="lifeline" x1="100" y1="92" x2="100" y2="540"/>
<line class="lifeline" x1="260" y1="92" x2="260" y2="540"/>
<line class="lifeline" x1="420" y1="92" x2="420" y2="540"/>
<line class="lifeline" x1="580" y1="92" x2="580" y2="540"/>
```

All lifelines share the same y2. Compute once: `y2 = last_arrow_y + 24`.

## Messages

Each message is a single `<line>` at its row's `arrow_y`, with a `ts` label above. The stroke class encodes the sender's actor ramp.

```svg
<!-- arrow row 0, arrow_y = 120 -->
<text class="ts" x="180" y="110" text-anchor="middle">1. Click login</text>
<line class="arr-gray" x1="106" y1="120" x2="254" y2="120" marker-end="url(#arrow)"/>

<!-- arrow row 1, arrow_y = 164, right-to-left -->
<text class="ts" x="180" y="154" text-anchor="middle">3. Show consent screen</text>
<line class="arr-purple" x1="254" y1="164" x2="106" y2="164" marker-end="url(#arrow)"/>
```

Rules:
- Label `y = arrow_y − 10`, centered between sender and receiver x.
- Arrow `y1 = y2 = arrow_y`.
- Arrow endpoints are offset ±6 from the lifeline x so the arrowhead doesn't touch the dashes:
  - Left-to-right: `x1 = sender_x + 6`, `x2 = receiver_x − 6`
  - Right-to-left: `x1 = sender_x − 6`, `x2 = receiver_x + 6`
- Stroke class = `arr-{sender_ramp}` — `arr-gray` for User, `arr-teal` for Client app, etc. Never use `class="arr"` (the default mono-gray arrow class) on a sequence message.
- Label text is sentence case with a numeric prefix: `"1. Click login"`, `"3. Show consent screen"`. Numbers make the reading order unambiguous when arrows cross.
- Keep labels short — verify every label fits its lane span using the budget formula in `layout-math.md`.

## Self-messages

A self-message stays on one actor's lifeline. Draw it as a small 16×24 rect on the lifeline, colored in that actor's ramp, with the label to the **left** (so it stays inside the diagram even for the rightmost lane).

```svg
<!-- self-message on Resource server at arrow_y = 472 -->
<rect class="c-blue" x="572" y="460" width="16" height="24" rx="4"/>
<text class="ts" x="564" y="472" text-anchor="end" dominant-baseline="central">9. Validate token</text>
```

Rules:
- `rect_x = lifeline_x − 8` (rect is 16 wide, centered on the lifeline).
- `rect_y = arrow_y − 12` (rect is 24 tall, centered on the arrow row).
- Label `x = rect_x − 8`, `text-anchor="end"`, `dominant-baseline="central"`, `class="ts"`.
- Label still gets its numeric prefix (`"9. Validate token"`), following the overall message order.
- Limit self-messages to 1–2 per diagram — more than that and the metaphor of "an actor talking to itself" stops reading clearly.

## Message frames

A **frame** is a dashed rounded rect that visually groups a contiguous run of messages under a single condition — *"Until tasks clear"*, *"Iterative research loop"*, *"Only if authenticated"*. It reads like a bracket around the enclosed messages, not like a new container. Anthropic's house-style sequence diagrams use frames for repeating or conditional sub-flows that don't warrant their own diagram.

```svg
<rect x="90" y="108" width="490" height="112"
      rx="8" fill="none" stroke="#B4B2A9" stroke-width="1"
      stroke-dasharray="5 4"/>
<text class="ts" x="100" y="120" text-anchor="start" dominant-baseline="central">Until tasks clear</text>
```

Rules:
- **Dashed rounded rect**, `rx="8"`, 1px stroke in the muted gray (`#B4B2A9` light / `#5F5E5A` dark — match `.lifeline`). Use inline `stroke-dasharray="5 4"` rather than a new CSS class.
- **Horizontal span**: `x = leftmost_lane_x − 20`, `width = rightmost_lane_x − leftmost_lane_x + 40`. The frame stretches 20px past the outermost lanes it covers, so the label has clear air at the corner.
- **Vertical span**: `y = first_arrow_y − 12`, `height = last_arrow_y − first_arrow_y + 24`. Tight enough that the frame feels like a bracket, not a new section.
- **Label position**: top-left inside the frame, at `(frame_x + 10, frame_y + 12)`, `class="ts"`, `text-anchor="start"`, `dominant-baseline="central"`. Keep the label ≤24 characters.
- **No numeric prefix** on the frame label — numbering is for individual messages. The frame is meta.
- **At most 2 frames per diagram**, and **frames never nest**. Two frames can sit one above the other, but they cannot contain each other. If you need nested scoping, split into two diagrams.
- **Draw frames BEFORE the messages** in source order so the dashed border sits behind the arrows and labels.

When to use a frame:
- A **loop** — "Until tests pass", "Until tasks clear", "Iterative research loop"
- A **conditional block** — "Only if authenticated", "When cache miss"
- A **named sub-protocol** — "Token refresh", "Retry with backoff"

Don't use a frame to decorate a single message, and don't use one to group messages that have nothing in common — frames are a scoping tool, not a visual group.

## Side note

A titled annotation for the protocol itself. Uses `class="box"` with a `th` title and an optional `ts` subtitle.

Top-left (for N ≤ 3):

```svg
<rect class="box" x="40" y="40" width="240" height="48" rx="10"/>
<text class="th" x="60" y="60" dominant-baseline="central">OAuth 2.0</text>
<text class="ts" x="60" y="78" dominant-baseline="central">Authorization code flow</text>
```

Bottom-left (for N ≥ 4, because the top row is filled with actor headers):

```svg
<rect class="box" x="40" y="556" width="240" height="48" rx="10"/>
<text class="th" x="60" y="576" dominant-baseline="central">OAuth 2.0</text>
<text class="ts" x="60" y="594" dominant-baseline="central">Authorization code flow</text>
```

Budget: title ≤24 chars, subtitle ≤32 chars. The box is 240 wide, padding 20 per side → usable width 200 → ~24 `th` chars or ~28 `ts` chars.

## Layout patterns

### 2-actor request/response (N=2)

User asks, server responds. Two lanes at x=185 and x=495. Typical message count: 2–4. Side note at top-left.

### 3-leg handshake (N=2, M=3)

Classic TCP. Same layout as above, three messages going SYN → SYN-ACK → ACK. Color the initiator arrows in one ramp and the responder arrows in another — the alternation reads as the handshake.

### 4-actor OAuth-style flow (N=4, M=8–10)

User, Client app, Auth server, Resource server. The canonical shape. Lane centers at 100, 260, 420, 580. Side note at bottom-left. One self-message on the Resource server for the "validate token" step.

### Async webhook (N=2 or 3)

Sender fires an event, receiver acknowledges later. Often has a gap in the middle that you can skip — no need to draw "wait 30 seconds" as a message; just put consecutive messages in the natural reading order.

## Parallel independent rounds

A sub-pattern for topics where **multiple independent call/response rounds** happen in sequence but share no lifeline state — each round is its own contained exchange, and the diagram's job is to contrast the structure of the rounds rather than track continuous state on a lifeline. Image #12 (Tool calling vs. Programmatic tool calling) is the canonical case.

**When to use.**

- Comparing tool-call vs. programmatic-script patterns where each round is an independent call/response.
- Showing "N separate rounds of the same exchange" to communicate volume or variety.
- The right half of a 2-up comparison where each side shows a different protocol style.

**When not to use.**

- There's genuine shared state between rounds (conversation history, pending requests) — that's a regular sequence with full lifelines.
- There are only 2 actors and 2–4 messages — that's a regular 2-actor sequence.
- The rounds are conditional ("if X then do round 2") — that's a frame on a regular sequence.

### Geometry — stacked rounds variant

Each round is a **row-sized mini-exchange** between a fixed source on the left and a round-specific action box on the right. Rounds stack vertically with no shared lifeline. See `layout-math.md` → "Parallel rounds geometry".

| Element            | Coordinates                                     |
|--------------------|-------------------------------------------------|
| Source actor       | `x=60  y=120 w=120 h=60` (persistent on left)   |
| Round 1 action     | `x=340 y=100 w=160 h=48 rx=6`                   |
| Round 2 action     | `x=340 y=180 w=160 h=48 rx=6`                   |
| Round 3 action     | `x=340 y=260 w=160 h=48 rx=6`                   |
| Row pitch          | 80 (round_y increases by 80 per round)          |

The source actor is drawn **once** at the top-left, not repeated per round. Its box height is just tall enough to span the first round's arrow row, with no lifeline extending below it — the absence of a lifeline is the signal that the source isn't carrying state across rounds.

**Why no lifeline.** A lifeline would visually suggest that state persists; in this pattern each round is a fresh stateless call. The source box itself is the anchor — the left edge of every arrow starts at `source_right_edge`, not at a lifeline x.

**Arrow pairs per round.** Each round is two arrows:

```svg
<!-- Round 1 -->
<text class="ts" x="260" y="115" text-anchor="middle">1. Call tool A</text>
<line class="arr-gray" x1="186" y1="124" x2="334" y2="124" marker-end="url(#arrow)"/>
<text class="ts" x="260" y="145" text-anchor="middle">2. Response</text>
<line class="arr-teal" x1="334" y1="134" x2="186" y2="134" marker-end="url(#arrow)"/>
```

Round k's arrow y values: `call_y = 100 + 24 + (k-1) × 80`, `response_y = call_y + 10`. Action box for round k: `y = call_y − 24`.

**Action box colors.** Each round's action box **can** take a different ramp — this is the only place in a sequence diagram where color is allowed to cycle across messages. The reason: each round calls a *different tool* (file write, api call, db query), and the color communicates that variety. Use up to 3 different ramps; more than that and the reader can't remember what each ramp means.

Source actor ramp stays **constant** across all rounds (usually `c-gray` — "Claude" or "Agent").

### Script-wrapper variant

The right half of image #12 uses the same stacked-rounds shape but wraps **multiple action boxes inside a single tall script rect** that represents an inline program executing several tool calls. Uses the `script-icon` pattern from `glyphs.md`.

| Element              | Coordinates                             |
|----------------------|-----------------------------------------|
| Source actor         | `x=60  y=120 w=120 h=60`                |
| Script wrapper       | `x=240 y=100 w=140 h=260 rx=6`, `c-gray`|
| `{ }` label in wrapper | `(310, 124)`, `th`                    |
| Divider line         | `(256, 140) → (364, 140)`, `arr`        |
| Wrapped action 1     | `x=252 y=152 w=116 h=48 rx=4`           |
| Wrapped action 2     | `x=252 y=212 w=116 h=48 rx=4`           |
| Wrapped action 3     | `x=252 y=272 w=116 h=48 rx=4`           |
| External action      | `x=440 y=200 w=160 h=48 rx=6` (optional)|

The script wrapper replaces the individual action boxes with a single container that contains N smaller colored bands. Only the **script wrapper itself** gets arrows from the source — the inner bands are decorative, showing what's inside the script without each needing its own call arrow.

```svg
<!-- Single arrow from source to script -->
<line class="arr-gray" x1="186" y1="230" x2="234" y2="230" marker-end="url(#arrow)"/>
<text class="ts" x="210" y="220" text-anchor="middle">run script</text>
```

If the script calls an external tool (image #12's right half: a `file_system` external box on the far right), draw a single arrow from the script's right edge to the external box at the script's middle y.

### Side-by-side comparison

The most common use of parallel rounds is inside a 2-up structural subsystem layout (`structural.md` → "Subsystem architecture pattern"): left container shows the stacked-rounds variant, right container shows the script-wrapper variant. Each sibling container is 315 wide, so halve the coordinates above:

- Source actor inside container: `x = container_x + 20, w=100 h=50`
- Action box inside container: `x = container_x + 180, w=120 h=40`
- Round pitch inside container: 64

See `structural.md` → "Rich interior for subsystem containers" for how this interior type registers.

### Rules

- **No lifelines.** If you draw lifelines, you're describing a regular stateful sequence, not parallel independent rounds. Drop them.
- **Source actor appears once.** Never duplicate the source per round — that multiplies the visual noise and breaks the "same caller, different calls" intuition.
- **Numeric prefixes still apply.** Within each round the two arrows are numbered (`1. Call tool A`, `2. Response`), and the numbering resets per round (or continues across rounds, at your choice — document it in the side note).
- **≤3 rounds per diagram.** 4+ rounds runs out of vertical space and overwhelms the comparison. Use two diagrams if you need to show more.
- **No frames around rounds.** A frame is a scoping bracket for a loop or a condition; parallel rounds are already independent, so a frame would be redundant.
- **Action ramps cap at 3.** Each round can take a distinct ramp, but stop at 3 distinct colors.

## Rules of thumb

- **Max 4 actors (comfortable), max 6 actors (absolute ceiling).** 5 is allowed only when every title is ≤12 chars and every subtitle is omitted. 6 requires every title ≤9 chars (so it fits the 100-wide header rect) and no subtitles, and the diagram loses its 40px horizontal safe margin — see `layout-math.md` → "Swim-lane (sequence) layout" for the full N=5 and N=6 coordinate tables. Beyond 6, split into an overview diagram plus one detail diagram per sub-flow — a 7-actor sequence diagram is guaranteed to feel cramped no matter how carefully you pack the labels.
- **6–10 messages is the sweet spot.** 4 is too sparse (use a flowchart); 12+ is too dense (split).
- **One ramp per actor**, up to 4 total. The default `[gray, teal, purple, blue]` works for most protocols. Swap ramps only when a topic needs it.
- **Number every message.** Even "obvious" single-step diagrams benefit from "1. ...". Readers scan numbers before they read words.
- **Every arrow gets a label.** Sequence diagrams are the one place in this skill where arrow labels are mandatory, not optional — the label *is* the message, and without it the diagram says nothing.
- **Sender's ramp colors the arrow.** Never use `class="arr"` (mono-gray) for a sequence message.
- **Labels above the line, never on it.** Labels float 10px above the arrow at the row midpoint, `text-anchor="middle"`, `class="ts"`.
- **No crossings within a single row.** Two messages at the same `arrow_y` collide — always move one to a new row.
- **No arcs, no curves.** Flat horizontal lines only. Self-messages use a labeled rect, not a small arc.
