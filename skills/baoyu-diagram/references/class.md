# Class Diagram (UML)

For showing static structure: what types exist, what they contain, and how they relate. The classic UML class diagram, adapted to baoyu-diagram's flat-rect design system.

## When to use

- "Draw the class diagram for X" / "show me the UML"
- "What are the types and how are they related"
- "Show the inheritance hierarchy"
- "Diagram the domain model / schema / type system"
- "Interface + implementations"

**When not to use:**
- If the user wants to see *behavior* (what happens when X calls Y), use sequence (`sequence.md`).
- If the user wants to see *data storage* with foreign keys and cardinalities only, that's an ER diagram — baoyu doesn't do ERDs in v1, suggest mermaid.
- If the user wants to see *runtime object instances* with field values, you're drawing an object diagram — use the class template with `th`-underlined instance names (`underline` class not in the template; use `text-decoration="underline"` inline on `<text>`) and skip the method compartment.

## Planning

Before writing SVG:

1. **List the classes.** 3–8 total. More than 8 and you should split into multiple diagrams grouped by package or subsystem.
2. **For each class, list attributes and methods.** Keep each line ≤30 chars. If a signature doesn't fit, abbreviate.
3. **Pick the visibility for each member.** `+` public, `−` private, `#` protected, `~` package-private.
4. **List the relationships.** Who extends whom, who implements which interface, who has what.
5. **Pick colors by kind of class**, not by position. See "Color rule" below.
6. **Compute box widths** using the class-specific formula below.
7. **Lay out the classes** — parents / interfaces on top, children below. See "Layout" below.

## Class box template

Each class is a **3-compartment rect**: name (top), attributes (middle), methods (bottom). Horizontal divider lines separate the compartments.

### Geometry

| Element                | Value                                         |
|------------------------|-----------------------------------------------|
| Rect corner radius     | `rx="6"`                                       |
| Min width              | 160 px                                        |
| Name compartment height | 32 px (single line, centered)                |
| Attribute/method row height | 18 px per line + 8 px top/bottom padding  |
| Horizontal divider     | `<line>` using `arr` class at 0.5 stroke      |

### Width formula

The box width must fit the longest line across all three compartments:

```
longest = max(name_chars × 8,
              max(attribute_line_chars) × 7,
              max(method_line_chars) × 7)
width = longest + 24
```

- 8 px/char for 14px `th` (the class name)
- 7 px/char for 12px `ts` (attributes and methods — they use the subtitle class for compact line height)

Round up to the nearest 10. Minimum width is 160 regardless of label length.

### Height formula

```
name_h     = 32
attr_h     = 16 + (attribute_count × 18)
method_h   = 16 + (method_count × 18)
total_h    = name_h + attr_h + method_h
```

If the class has no attributes, show an empty attribute compartment with `h = 16`. Never collapse a compartment — readers expect all three.

### SVG template

```svg
<g class="c-teal">
  <!-- outer rect spans all three compartments -->
  <rect x="80" y="60" width="200" height="144" rx="6"/>

  <!-- name compartment (top) -->
  <text class="th" x="180" y="80" text-anchor="middle" dominant-baseline="central">User</text>

  <!-- divider between name and attributes -->
  <line class="arr" x1="80" y1="92" x2="280" y2="92" stroke-width="0.5"/>

  <!-- attributes (12px, left-aligned) -->
  <text class="ts" x="92" y="110">+ id: UUID</text>
  <text class="ts" x="92" y="128">+ email: string</text>
  <text class="ts" x="92" y="146">− passwordHash: string</text>

  <!-- divider between attributes and methods -->
  <line class="arr" x1="80" y1="158" x2="280" y2="158" stroke-width="0.5"/>

  <!-- methods (12px, left-aligned) -->
  <text class="ts" x="92" y="176">+ login(pwd): Token</text>
  <text class="ts" x="92" y="194">+ logout(): void</text>
</g>
```

- Name is `th` 14px centered.
- Attributes and methods are `ts` 12px, **left-aligned at `rect_x + 12`**.
- Divider lines use `class="arr"` with inline `stroke-width="0.5"` (the default 1.5 is too heavy for an internal divider).
- All text inside the class inherits the ramp's text color from the `c-{ramp}` wrapper — no hardcoded fills.

### Stereotypes

For interfaces, abstract classes, and enums, prepend a stereotype line inside the name compartment:

```svg
<g class="c-purple">
  <rect x="80" y="60" width="200" height="120" rx="6"/>
  <text class="ts" x="180" y="78" text-anchor="middle" dominant-baseline="central">«interface»</text>
  <text class="th" x="180" y="94" text-anchor="middle" dominant-baseline="central">Drawable</text>
  <line class="arr" x1="80" y1="106" x2="280" y2="106" stroke-width="0.5"/>
  ...
</g>
```

The stereotype line is 12px `ts`, italic is encoded via the guillemets `«...»` characters — do not use inline `font-style="italic"` since baoyu's typography table doesn't include an italic class for `ts` outside poster captions.

When you add a stereotype, bump the name compartment height to 48 to fit both lines.

Common stereotypes:
- `«interface»` — interface type, no fields, method signatures only.
- `«abstract»` — abstract class with at least one abstract method.
- `«enumeration»` — enum with value constants in the attribute compartment.
- `«datatype»` — value type with no behavior (rare; usually just a plain class).

Abstract class names may optionally use the existing `th` weight — baoyu does not render italics for abstract, the stereotype carries the meaning.

## Relationship arrows

Six UML relationship styles. Each maps to a specific arrow rendering. All connectors use `class="arr"` (or `arr-alt` for dashed variants) so they inherit dark-mode stroke colors.

| Relationship     | Line style | Arrowhead         | From                | Typical label                       |
|------------------|------------|-------------------|---------------------|-------------------------------------|
| Inheritance      | solid      | hollow triangle   | child → parent      | (none)                              |
| Implementation   | dashed     | hollow triangle   | class → interface   | (none)                              |
| Association      | solid      | open arrow `>`    | from → to           | multiplicity `1`, `0..*`, `1..*`    |
| Aggregation      | solid      | hollow diamond    | container → part    | (none, diamond on container side)    |
| Composition      | solid      | filled diamond    | container → part    | (none, diamond on container side)    |
| Dependency       | dashed     | open arrow `>`    | user → used         | optional label like `«uses»`        |

### Arrow head definitions (add to `<defs>`)

The template's default `<marker id="arrow">` renders an open arrow — that works for association and dependency. For inheritance/implementation/aggregation/composition you need four additional markers. Add these to `<defs>` **only if the diagram uses them**:

```svg
<defs>
  <!-- existing open-arrow marker from the template -->
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>

  <!-- hollow triangle for inheritance + implementation -->
  <marker id="triangle-hollow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto">
    <path d="M1 1 L11 6 L1 11 Z" fill="none" stroke="context-stroke" stroke-width="1.2" stroke-linejoin="round"/>
  </marker>

  <!-- hollow diamond for aggregation -->
  <marker id="diamond-hollow" viewBox="0 0 14 10" refX="1" refY="5" markerWidth="12" markerHeight="8" orient="auto">
    <path d="M1 5 L7 1 L13 5 L7 9 Z" fill="none" stroke="context-stroke" stroke-width="1.2" stroke-linejoin="round"/>
  </marker>

  <!-- filled diamond for composition -->
  <marker id="diamond-filled" viewBox="0 0 14 10" refX="1" refY="5" markerWidth="12" markerHeight="8" orient="auto">
    <path d="M1 5 L7 1 L13 5 L7 9 Z" fill="context-stroke" stroke="context-stroke" stroke-width="1" stroke-linejoin="round"/>
  </marker>
</defs>
```

**Why `fill="none"` instead of a hardcoded hex.** Hollow markers need to stay hollow in both light and dark mode, and any hardcoded hex color is frozen at author time — it can't respond to the template's `@media (prefers-color-scheme: dark)` block. `fill="none"` means the triangle/diamond is outlined only and the interior is transparent. At 1.2px stroke on a 10×10 marker, the 1.5px line passing behind the marker is invisible to the reader. For the filled composition diamond, `fill="context-stroke"` picks up whichever stroke color the attached line is using, so it inherits dark-mode correctly through the `class="arr"` rules.

### Using the markers

```svg
<!-- Inheritance: Circle extends Shape -->
<line x1="260" y1="200" x2="260" y2="150" class="arr" marker-end="url(#triangle-hollow)"/>

<!-- Implementation: Circle implements Drawable (dashed) -->
<line x1="260" y1="200" x2="460" y2="150" class="arr-alt" marker-end="url(#triangle-hollow)"/>

<!-- Association with multiplicity: User → Order (1 to many) -->
<line x1="180" y1="120" x2="380" y2="120" class="arr" marker-end="url(#arrow)"/>
<text class="ts" x="200" y="112">1</text>
<text class="ts" x="360" y="112">0..*</text>

<!-- Composition: Order composed of LineItems -->
<line x1="380" y1="140" x2="580" y2="140" class="arr" marker-end="url(#diamond-filled)"/>
```

**Pitfall**: the `marker-end` goes on the **parent** end for inheritance/implementation (the triangle points at the parent), and on the **container** end for aggregation/composition (the diamond sits on the container). Direction of `line`/`path` dictates which end is `start` vs `end` — always draw the arrow *toward* the marker.

## Color rule

**One ramp per kind of class**, not per position. This is the same exception as sequence diagrams — identity is a category, so using multiple ramps is fine, but each ramp must correspond to a stable *role*.

Default ramp assignments:

| Class kind        | Ramp      | Why                                   |
|-------------------|-----------|---------------------------------------|
| Concrete class    | `c-gray`  | The default — most classes are here   |
| Abstract class    | `c-teal`  | Signals "not directly instantiable"   |
| Interface         | `c-purple` | Signals "pure contract, no state"    |
| Enum / datatype   | `c-amber` | Signals "constants / value type"      |

Cap at **3 ramps per diagram**. If you have concrete classes + interfaces + enums, use gray + purple + amber. If every class is concrete, all gray is fine and looks cleanest. Do not assign ramps by package or by author — readers won't learn the code.

**Legend implicit**: the ramps are anchored by the class kinds themselves. A reader who sees a purple `«interface» Drawable` box learns the convention immediately. No explicit legend needed unless the diagram uses >3 ramps (which shouldn't happen).

## Layout

Class diagrams are **2D grid** layouts, not linear flows. Parents live above children, interfaces sit on the side of their implementors, and association arrows run horizontally.

### Default: top-down inheritance tree

Parents / interfaces on top, children at the bottom:

```
    [ «interface» Drawable ]       [ Shape (abstract) ]
                |                            |
                |  implements                |  extends
                +---------+--------+---------+
                          |        |
                     [ Circle ] [ Square ]
```

- Tier 1 (y=60): base types (interfaces, abstract base classes)
- Tier 2 (y=240): concrete subtypes
- Tier 3 (y=420): composed types / enums

Vertical gap between tiers: **40 px minimum**.

### 2-wide / 3-wide rows

For 4–6 classes per tier, pack horizontally with 20px gaps:

```
x=40    x=260   x=480   (width 180 each, gap 20)
```

For >6 classes, you're building a too-big diagram — split by package or subsystem into separate diagrams and link them with prose.

### Association arrows

Association arrows are **horizontal or L-bend**, running between classes in the same tier (or adjacent tiers). Do not let an association arrow cross an inheritance arrow — if they cross, reroute the weaker relationship (usually the association) with an L-bend.

### viewBox height

```
H = tier_count × 200 + 40
```

Where 200 px is the per-tier budget (class box height ~140 + 40 px vertical gap + 20 px margin). Round up after placing the last tier's actual box height — if a class in the last tier is extra-tall, bump H to fit.

Width stays at 680. If a tier of 3-wide boxes doesn't fit at minimum width, narrow the boxes to 180 each (total 540 + 40 gap = 580, centered at x=50).

## Worked example — Shape hierarchy

A small 4-class domain: a `Drawable` interface, an abstract `Shape` class, and two concrete subclasses `Circle` and `Square`.

**Plan:**

1. Classes: `Drawable` (interface), `Shape` (abstract), `Circle`, `Square` — 4 classes, 2 tiers.
2. Attributes/methods:
   - `Drawable`: `+ draw(): void`
   - `Shape`: `# color: Color`, `# position: Point`, `+ area(): number` (abstract)
   - `Circle`: `− radius: number`, `+ area(): number` (override)
   - `Square`: `− side: number`, `+ area(): number` (override)
3. Relationships: `Shape` implements `Drawable` (dashed + hollow triangle); `Circle` and `Square` extend `Shape` (solid + hollow triangle).
4. Colors: `Drawable` = `c-purple` (interface); `Shape` = `c-teal` (abstract); `Circle` / `Square` = `c-gray` (concrete). 3 ramps.
5. Widths:
   - `Drawable`: name 8 chars, longest method "+ draw(): void" = 14 chars → `max(64, 98) + 24 = 122` → min 160
   - `Shape`: name 5 chars, longest "+ area(): number" = 16 chars → `max(40, 112) + 24 = 136` → min 160
   - `Circle`/`Square`: ~13 chars longest → min 160
6. Tier 1 (y=60): `Drawable` at x=130, `Shape` at x=390 (row of 2, both width 160, gap 100).
7. Tier 2 (y=260): `Circle` at x=130, `Square` at x=390 (row of 2, width 160, gap 100).
8. Arrows:
   - `Shape → Drawable` (implements): horizontal dashed line from Shape's left edge (x=390, y=110) to Drawable's right edge (x=290, y=110).
   - `Circle → Shape` (extends): L-bend from Circle's top (x=210, y=260) up to ymid=220, right to x=470, up to Shape's bottom (x=470, y=200).
   - `Square → Shape` (extends): straight vertical from Square's top (x=470, y=260) to Shape's bottom (x=470, y=200).

**Coordinates (abbreviated; production code would fill in every `<text>`):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif">
  <style>/* template block ... */</style>
  <defs>
    <marker id="arrow" .../>
    <marker id="triangle-hollow" .../>
  </defs>

  <!-- Tier 1: Drawable (interface, purple) -->
  <g class="c-purple">
    <rect x="130" y="60" width="160" height="100" rx="6"/>
    <text class="ts" x="210" y="76" text-anchor="middle" dominant-baseline="central">«interface»</text>
    <text class="th" x="210" y="92" text-anchor="middle" dominant-baseline="central">Drawable</text>
    <line class="arr" x1="130" y1="104" x2="290" y2="104" stroke-width="0.5"/>
    <!-- empty attribute compartment -->
    <line class="arr" x1="130" y1="120" x2="290" y2="120" stroke-width="0.5"/>
    <text class="ts" x="142" y="138">+ draw(): void</text>
  </g>

  <!-- Tier 1: Shape (abstract, teal) -->
  <g class="c-teal">
    <rect x="390" y="60" width="160" height="140" rx="6"/>
    <text class="ts" x="470" y="76" text-anchor="middle" dominant-baseline="central">«abstract»</text>
    <text class="th" x="470" y="92" text-anchor="middle" dominant-baseline="central">Shape</text>
    <line class="arr" x1="390" y1="104" x2="550" y2="104" stroke-width="0.5"/>
    <text class="ts" x="402" y="122"># color: Color</text>
    <text class="ts" x="402" y="140"># position: Point</text>
    <line class="arr" x1="390" y1="152" x2="550" y2="152" stroke-width="0.5"/>
    <text class="ts" x="402" y="170">+ area(): number</text>
  </g>

  <!-- Tier 2: Circle (concrete, gray) -->
  <g class="c-gray">
    <rect x="130" y="260" width="160" height="110" rx="6"/>
    <text class="th" x="210" y="280" text-anchor="middle" dominant-baseline="central">Circle</text>
    <line class="arr" x1="130" y1="292" x2="290" y2="292" stroke-width="0.5"/>
    <text class="ts" x="142" y="310">− radius: number</text>
    <line class="arr" x1="130" y1="322" x2="290" y2="322" stroke-width="0.5"/>
    <text class="ts" x="142" y="340">+ area(): number</text>
  </g>

  <!-- Tier 2: Square (concrete, gray) -->
  <g class="c-gray">
    <rect x="390" y="260" width="160" height="110" rx="6"/>
    <text class="th" x="470" y="280" text-anchor="middle" dominant-baseline="central">Square</text>
    <line class="arr" x1="390" y1="292" x2="550" y2="292" stroke-width="0.5"/>
    <text class="ts" x="402" y="310">− side: number</text>
    <line class="arr" x1="390" y1="322" x2="550" y2="322" stroke-width="0.5"/>
    <text class="ts" x="402" y="340">+ area(): number</text>
  </g>

  <!-- Shape implements Drawable (dashed, hollow triangle on Drawable side) -->
  <line x1="390" y1="110" x2="290" y2="110" class="arr-alt" marker-end="url(#triangle-hollow)"/>

  <!-- Circle extends Shape (solid L-bend) -->
  <path d="M 210 260 L 210 230 L 470 230 L 470 200" class="arr" fill="none" marker-end="url(#triangle-hollow)"/>

  <!-- Square extends Shape (solid straight) -->
  <line x1="470" y1="260" x2="470" y2="200" class="arr" marker-end="url(#triangle-hollow)"/>
</svg>
```

viewBox H: bottom of last box is `260 + 110 = 370`, so `H = 370 + 20 = 390`. The example uses 420 for a 30px bottom margin, which is also fine.

## Checklist (class-specific)

On top of the standard `pitfalls.md` checks:

1. Every class has all **three compartments** (name / attrs / methods), even if one is empty.
2. The class **name is `th` centered**, attributes/methods are **`ts` left-aligned at `rect_x + 12`**.
3. Every attribute/method starts with a **visibility marker** (`+ − # ~`).
4. Dividers use `class="arr"` with **inline `stroke-width="0.5"`**.
5. Inheritance and implementation arrows point **toward the parent/interface** (triangle on parent side).
6. Aggregation and composition diamonds sit on the **container side**, not the part side.
7. Associations carry **multiplicity labels** at both ends (`1`, `0..*`, `1..*`) when they aren't obvious.
8. Dashed arrows are `arr-alt`, solid arrows are `arr` — never mix.
9. Color ramp budget ≤3, one per class kind (concrete / abstract / interface / enum).
10. Association arrows **do not cross inheritance arrows** — if they do, re-route the association.
