# DungeonAI asset specification (Heart chamber)

Status: proposed. These numbers are taken from StarNet's renderer where it sets them, and marked "to confirm" where we need your decision.

## 1. Coordinates and scale (from StarNet)

- **World tile:** `T = 12` (`world.js`, line 20). This is the logical tile in world pixels. Everything is positioned in tiles, and the camera scales the result.
- **Floor pitch:** StarNet's floor materials are painted in cells of several tiles (`FLOOR_MATERIALS.pitch`, e.g. `[4, 3]`). The dungeon floor will instead use **one tile per source image**, so every tile repeats seamlessly on its own.
- **Source resolution (to confirm):** author every tile at **256 × 256 px**. That is about 21× the logical tile, so it stays sharp at every zoom the camera allows. The renderer scales it down to `T`.
- **Multi-tile objects:** authored at 256 px per tile of footprint. An altar that covers 3 × 2 tiles is a 768 × 512 px image.

## 2. Anchors and placement

- **Floor and wall tiles:** the top-left of the image sits on the top-left corner of the tile in world tile coordinates. Tiles are placed by world coordinates, so they stay fixed as the station grows.
- **Props and multi-tile sprites:** the image is anchored at its **bottom centre**, on the footprint's bottom edge. This matches how StarNet anchors bodies and props on the floor.
- **The Heart:** anchored at the **centre of its altar's top surface**, so it sits on the altar rather than floating above it.
- **Transparency:** PNG with a true alpha channel. No baked background, no drop shadow outside the footprint. Soft shadows are drawn by the renderer, not in the image.

## 3. Draw order (Heart chamber)

From back to front, matching the render order in `RENDERER_PROPOSAL.md` section 10:

1. **Floor tiles** (baked, cached).
2. **Ritual floor overlays** (baked into the floor cache).
3. **Wall and corridor pieces** (baked; these meet the floor at their base).
4. **Back props:** braziers and banners set against the back wall.
5. **Altar** (multi-tile).
6. **The Heart** (animated), drawn on the altar's top.
7. **Foreground props:** pillars and braziers that stand in front of the Heart. They overlap the Heart where they sit in front of it.
8. **Lighting overlay** (cached, optional).
9. **Effects and glow** (per frame).

Foreground pillars are drawn after the Heart, so they can cover part of it. The layer is chosen per asset in the manifest.

## 4. File naming

`frontend/assets/dungeon/<group>/<name>[_<variant>][_<frame>].png`

- Groups: `floor`, `wall`, `corner`, `edge`, `corridor`, `prop`, `altar`, `heart`, `light`.
- Variants: `_a`, `_b`, `_c` for interchangeable tiles.
- Animation frames: zero-padded two digits, e.g. `heart_frame_01.png` to `heart_frame_16.png`.
- Names are lowercase, with underscores only.

## 5. Heart chamber asset manifest

The machine-readable version is in `frontend/assets/dungeon/manifest.json`.

| Asset | Group | Footprint (tiles) | Image size (px) | Layer | Static or animated |
|---|---|---|---|---|---|
| Floor, `floor_a` to `floor_d` | floor | 1 × 1 | 256 × 256 | 1 | Static (one file each, see section 9) |
| Ritual floor tiles, 2 variants | floor | 1 × 1 | 256 × 256 | 2 | Static |
| Wall straight | wall | 1 × 1 | 256 × 256 | 3 | Static |
| Wall inside corner | corner | 1 × 1 | 256 × 256 | 3 | Static |
| Wall outside corner | corner | 1 × 1 | 256 × 256 | 3 | Static |
| Wall end cap | wall | 1 × 1 | 256 × 256 | 3 | Static |
| Door arch | wall | 2 × 1 | 512 × 256 | 3 | Static |
| Edge (floor to wall) | edge | 1 × 1 | 256 × 256 | 3 | Static |
| Corridor floor | corridor | 1 × 1 | 256 × 256 | 1 | Static |
| Brazier | prop | 1 × 1 | 256 × 256 | 4 or 7 | Animated (flame, 4 frames) |
| Banner | prop | 1 × 2 | 256 × 512 | 4 | Animated (cloth, 4 frames, optional) |
| Pillar, back | prop | 1 × 2 | 256 × 512 | 4 | Static |
| Pillar, foreground | prop | 1 × 2 | 256 × 512 | 7 | Static |
| Altar | altar | 3 × 2 | 768 × 512 | 5 | Static |
| Heart | heart | 2 × 2 | 512 × 512 | 6 | Animated (16 frames) |
| Heart glow overlay | light | 4 × 4 | 1024 × 1024 | 8 | Animated (8 frames, optional) |
| Lighting overlay | light | whole chamber | matches room | 8 | Static |

## 6. Heart animation timing

- **Roll:** 16 frames, one full loop every **4 seconds**, eased in and out.
- **Idle heartbeat:** a double beat. The first beat is strongest, the second is softer, with a pause before the next pair. This is the rhythm the renderer will drive.
- **States planned for later:** listening, speaking, alert. Each will have its own frame range. The controller will support them, but only idle is used in the first milestone.
- **Frames are not yet validated.** The existing sprite sheet in the reference image is a concept. Each production frame must be checked for a consistent position, scale and centre before it is used.

## 7. What must be decided before art begins

1. **Confirm 256 px per tile**, or give a different figure.
2. **Confirm bottom-centre anchoring** for props.
3. **Confirm the altar footprint** (3 × 2 tiles as a starting size).
4. **Confirm the Heart footprint** (2 × 2 tiles).
5. **Confirm whether the CRT effect is off** in DungeonAI. The plan is off by default for the dungeon theme, to keep the art sharp.

## 8. Approved decisions (21:45)

- **Master resolution:** 256 × 256 px per world tile. The renderer keeps the 12 px world tile and may use smaller runtime textures where that is faster. The master files are never downscaled in the repo.
- **Altar:** 5 × 4 tiles, including the architectural base and steps. Image size 1280 × 1024 px. Provisional, to be checked against the reference proportions.
- **Heart:** visual size 3 × 3 tiles (768 × 768 px). Logical footprint 2 × 2 tiles for placement and hit detection. The visual and logical sizes are kept separate. Provisional.
- **Heart anchor:** the centre of the altar's top surface.
- **Adjustment rule:** if the reference image needs different proportions, the reference wins and the manifest is updated.

## 9. Floor variants and foreground pass (added)

### 9.1 Four named floor variants

| ID | File (under `frontend/assets/dungeon/`) | Footprint | Image (px) | Layer |
|---|---|---|---|---|
| `floor_a` | `floor/floor_a.png` | 1 × 1 | 256 × 256 | 1 |
| `floor_b` | `floor/floor_b.png` | 1 × 1 | 256 × 256 | 1 |
| `floor_c` | `floor/floor_c.png` | 1 × 1 | 256 × 256 | 1 |
| `floor_d` | `floor/floor_d.png` | 1 × 1 | 256 × 256 | 1 |

- Each variant is a separate seamless tile. The Heart chamber's floor uses all four.
- Variant choice is deterministic per world tile (`selection: "world-tile-hash"`), so a tile never changes its variant when the station grows or redraws.
- Each file must tile seamlessly with itself and with the other three.

### 9.2 Foreground pass

- Foreground props (`pillar_front`, and any prop with `layer: 7`) are drawn in a **separate pass after `drawAgent`**, so they can cover the Heart and creatures standing behind them.
- Background props (`layer: 4`) stay in the existing props pass, before the Heart.
- The pass runs under the same transform (`setTransform(scale, 0, 0, scale, panX, panY)`) and is sorted by footprint bottom edge.
- Not yet implemented. It is part of the first room's build, after the asset loader exists.

### 9.3 Visual scale check at StarNet's camera zoom

Source: `frontend/app/world.js`.

- World tile `T = 12` world px. The camera draws the world with `setTransform(scale, …)`, so **1 world px = `scale` CSS px**.
- Zoom limits: `MINZ = 0.5`, `MAXZ = 6` (line 105).
- Default: `scale = 2` (line 103). A lock on an agent uses at least `3` (line 1945).
- Fit-to-station: `scale = min(canvasW / W, canvasH / H)`, clamped to 0.5–6 (line 1992). This depends on the whole station's size, so it can go below 2 on a large station.

Heart and altar sizes in CSS px:

| Zoom | 1 tile | Altar 5×4 | Heart visual 3×3 | Heart logical 2×2 |
|---|---|---|---|---|
| 0.5 (min) | 6 | 30 × 24 | 18 × 18 | 12 × 12 |
| 2 (default) | 24 | 120 × 96 | 72 × 72 | 48 × 48 |
| 3 (agent lock) | 36 | 180 × 144 | 108 × 108 | 72 × 72 |
| 6 (max) | 72 | 360 × 288 | 216 × 216 | 144 × 144 |

Reading:

- At the default zoom the Heart is 72 px, which is 60% of the altar's width. That is prominent as a shape and glow, but the 16 frames will not show fine detail.
- At fit-to-station zoom on a large station, the Heart can drop to 18 px. It would be a dot, not the reference image.
- **Recommendation (needs your decision):** keep the Heart chamber's zoom at least 2 when the Heart is in view. Options: (a) a per-room minimum zoom for the Overseer room; (b) a larger visual footprint, 4 × 4 tiles (1024 px master), which gives 96 px at default zoom; (c) both.
- Check at the real station size once the room is built. Screenshot at zoom 0.5, 2 and 3 with `npm run shoot`, and compare to the reference image.
