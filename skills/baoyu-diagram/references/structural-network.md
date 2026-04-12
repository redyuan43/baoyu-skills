# Structural: Network Topology

Load this file when the prompt asks about **network infrastructure**: "where do the wires go", "which zone is this device in", "DMZ / firewall / VPC topology", security zones, or device connectivity. The reader's question is *"what is connected to what, and across which boundary"*.

Sub-pattern for diagrams whose subject is **where the wires go** — which devices sit where, which security zones contain them, which links are wired vs wireless. The structural diagram type is the right home for this (devices are containers, zones are outer containers, cables are arrows), but topology drawings have some conventions of their own.

## When to use it

- The reader's question is *"what is connected to what, and across which boundary"*, not *"what happens when a request arrives"* (that's a sequence diagram).
- You can name ≤10 devices. More than that, split into *edge topology* and *internal topology* — no single network diagram should try to show the whole datacenter.
- The zones matter as much as the devices. A network drawing without zones is just a bus or radial topology in disguise — use those sub-patterns instead.

## No custom device icons

baoyu is a flat-rect aesthetic. A router is a rounded rect labeled *Router*, a firewall is a rounded rect labeled *Firewall*, a cloud/Internet boundary is a rounded rect labeled *Internet*. **Do not draw a cylinder for a server, a trapezoid for a switch, a cloud silhouette for the Internet, or a shield-with-flames for a firewall.** The two-line node (type on top in `th`, name on bottom in `ts`) carries the same information with no aesthetic break:

```svg
<g class="c-gray">
  <rect x="120" y="160" width="160" height="56" rx="6"/>
  <text class="th" x="200" y="182" text-anchor="middle">Firewall</text>
  <text class="ts" x="200" y="202" text-anchor="middle">edge-fw-01</text>
</g>
```

The device *type* is the title; the device's specific *name* or role (hostname, function) is the subtitle. If the diagram only has generic types without specific instances, a single-line 44-tall rect with the type as the title is fine.

## Zone containers

Use the existing dashed-container trick from `structural.md` → "Subsystem architecture pattern", with a top-left pill label for the zone name. One container per security zone:

| Zone     | Typical label | Notes                                                           |
|----------|---------------|-----------------------------------------------------------------|
| Internet | *Internet*    | Anything outside the org — clients, public DNS, SaaS endpoints  |
| DMZ      | *DMZ*         | Reverse proxies, WAFs, public web/API frontends                 |
| Internal | *Internal*    | Application servers, internal APIs, caches                      |
| Data     | *Data*        | Databases, object stores, message brokers — isolate from DMZ    |
| Mgmt     | *Management*  | Bastion, monitoring, config — often spans other zones via ACLs  |

Keep containers to **≤4 zones per diagram**. A 5-zone network is better split into two diagrams (*edge flow* + *internal flow*) than crammed into one 680-wide canvas.

The container rect uses `class="arr-alt"` — it inherits the dashed stroke from the template and dark-mode-safe coloring. The pill-shaped zone label sits in the top-left at `(container_x + 12, container_y − 8)` with class `ts` and an optional small background rect:

```svg
<rect class="arr-alt" x="40" y="60" width="600" height="180" rx="12"/>
<rect class="box" x="40" y="52" width="80" height="16" rx="8"/>
<text class="ts" x="80" y="64" text-anchor="middle">DMZ</text>
```

The label's background rect (`class="box"`) sits on top of the container's dashed top edge, masking it — the label reads as a tab attached to the zone rather than text floating inside it.

## Wired vs wireless

Two distinct link styles, both already in the template:

- **Wired link** — solid `class="arr"`. Optional `ts` label on the arrow midpoint carries the bandwidth or protocol (*1 Gbps*, *VPN*, *TLS*). Follows the normal 1–3 word arrow-label rule.
- **Wireless link** — dashed `class="arr-alt"`. Same label rules. Wireless is also the right choice for *logical* links (VPN tunnels across the public internet, cross-AZ replication) where the link isn't a single physical cable.

**Two link styles means you need a legend.** Per `design-system.md`, any diagram that uses ≥2 arrow styles with distinct meaning must emit a one-line legend. For network topology:

```
[──] Wired    [- -] Wireless / VPN    [■] DMZ    [■] Internal
```

Place the legend at the bottom of the canvas, 20px above the bottom edge, aligned with the subject matter above it.

## Tiered top-down layout

Network topology almost always reads top-down because the conventional mental model is *"traffic flows from the public internet down into the protected core"*. Lay out the zones vertically, one tier per row:

```
Row 1 (y=60..96)    Internet container
Row 2 (y=116..180)  Edge container (reverse proxy, firewall)
Row 3 (y=200..264)  Core container (app servers, services)
Row 4 (y=284..348)  Access / data container (databases, caches)
```

Each tier is a separate dashed container. Links run **between** containers, not inside — intra-zone links are assumed (everything in the same zone can reach everything else in that zone via the switch fabric) and cluttering the diagram with them wastes space.

## Worked example — 3-tier network

Request: *"Draw a 3-tier network: public internet talking to a DMZ firewall, which routes to internal app servers, which talk to a database."*

Plan:
- 3 zones: Internet, DMZ, Internal.
- 4 devices: Client (Internet), Firewall (DMZ), App (Internal), DB (Internal).
- All wired, so no legend needed — single arrow style.
- Direction: top-down.
- Colors: all `c-gray`. Devices aren't categorized by function strongly enough to warrant a ramp split.

```svg
<svg ... viewBox="0 0 680 340">
  <!-- Zone: Internet -->
  <rect class="arr-alt" x="40" y="32" width="600" height="64" rx="12"/>
  <rect class="box" x="40" y="24" width="80" height="16" rx="8"/>
  <text class="ts" x="80" y="36" text-anchor="middle">Internet</text>
  <g class="c-gray">
    <rect x="260" y="50" width="160" height="36" rx="6"/>
    <text class="th" x="340" y="74" text-anchor="middle">Client</text>
  </g>

  <!-- Internet → DMZ arrow -->
  <line x1="340" y1="86" x2="340" y2="118" class="arr" marker-end="url(#arrow)"/>

  <!-- Zone: DMZ -->
  <rect class="arr-alt" x="40" y="118" width="600" height="80" rx="12"/>
  <rect class="box" x="40" y="110" width="60" height="16" rx="8"/>
  <text class="ts" x="70" y="122" text-anchor="middle">DMZ</text>
  <g class="c-gray">
    <rect x="240" y="140" width="200" height="52" rx="6"/>
    <text class="th" x="340" y="162" text-anchor="middle">Firewall</text>
    <text class="ts" x="340" y="180" text-anchor="middle">edge-fw-01</text>
  </g>

  <!-- DMZ → Internal arrow -->
  <line x1="340" y1="192" x2="340" y2="220" class="arr" marker-end="url(#arrow)"/>

  <!-- Zone: Internal -->
  <rect class="arr-alt" x="40" y="220" width="600" height="100" rx="12"/>
  <rect class="box" x="40" y="212" width="80" height="16" rx="8"/>
  <text class="ts" x="80" y="224" text-anchor="middle">Internal</text>
  <g class="c-gray">
    <rect x="120" y="244" width="180" height="52" rx="6"/>
    <text class="th" x="210" y="266" text-anchor="middle">App server</text>
    <text class="ts" x="210" y="284" text-anchor="middle">web-api-*</text>
  </g>
  <g class="c-gray">
    <rect x="380" y="244" width="180" height="52" rx="6"/>
    <text class="th" x="470" y="266" text-anchor="middle">Database</text>
    <text class="ts" x="470" y="284" text-anchor="middle">postgres-primary</text>
  </g>
  <!-- App → DB wired link -->
  <line x1="300" y1="270" x2="380" y2="270" class="arr" marker-end="url(#arrow)"/>
</svg>
```

Notice that the diagram shows inter-zone links (Client → Firewall → App) *and* one intra-zone link (App → DB). The intra-zone App → DB link is drawn because it's the whole point of the diagram — otherwise the reader wouldn't know the DB is in the *Internal* zone, not a fourth *Data* zone. When you leave intra-zone links out, make sure the device names alone answer *"who talks to whom"*.
