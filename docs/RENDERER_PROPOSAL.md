# Proposal: sprite-based dungeon renderer

Status: proposal for review. No code has been changed.

## 1. What StarNet already does

StarNet has two rendering paths for station surfaces, both in `frontend/app/`:

- **Procedural bake** (`stationbake.js`, about 5,500 lines). It paints floors, walls, hull and lighting into offscreen canvases using canvas primitives, one function per floor material (`deckPlank`, `deckSpine`, `deckGrate`, and so on). It also works out where walls meet (`classifyJoins`, `buildEdges`), which gives corners and ends. Output: `baseCv` (floors, walls, lighting underneath) and `lightCv` (darkness with light pools cut out, drawn on top).
- **Image-authored materials** (`industrialtextures.js`, `worldsurface.js`). This already loads PNG artwork from `frontend/assets/industrial/`, paints each floor or wall material from its image, and falls back to the procedural path for any material whose image is missing. It is on by default and is turned off by `?textures=classic`.

**The key finding:** the image-authored pipeline already does what the brief asks for: reusable image tiles, per-material fallback, and a switch back to the original look. We should follow its pattern rather than invent a new renderer.

## 2. Proposed design

Add a separate **dungeon theme** beside the existing packs. Nothing in the industrial pack or the classic path changes.

1. **A third material pack** at `frontend/assets/dungeon/`, loaded by a module `dungeontextures.js`, modelled directly on `industrialtextures.js`. Same loader, same per-material fallback.
2. **A theme switch**, off by default. For example `?theme=dungeon`, plus a setting later. Priority order: classic (`?textures=classic`) always wins, then the dungeon theme, then the industrial default.
3. **Tile repeat by world coordinates.** The existing `floor(ctx, X, Y, size, tx, ty, ...)` already positions tiles by physical tile coordinates, so a floor stays in place as the station grows. That is what makes tiles repeat seamlessly across rooms.
4. **Wall pieces chosen by join type.** The join classification in `stationbake.js` already knows which walls meet and where corners fall. Each join selects a piece from the wall set: straight run, inside corner, outside corner, end cap, door arch, and so on. The reference sheet's wall pieces map onto these.
5. **Multi-tile props** (pillars, braziers, the altar) are sprites that span several tiles, drawn on top of the floor and walls in the same way existing props are drawn. They need an anchor tile and a footprint.
6. **The animated Heart is a separate layer.** It is a 16-frame sprite loop drawn above the altar, not baked into the room. This keeps the room art static and cheap to draw.

## 3. Assets needed

I can't create painted artwork myself. The reference sheet is a style guide, not game-ready art. To build the chamber we need:

- **Floor tiles:** square, seamless, one tile per world tile, at a fixed resolution (about 64 px to start). A handful of variants for variety, plus ritual-marked versions for the altar floor.
- **Wall pieces:** straight, inside and outside corners, end caps, a door arch. Same resolution as the floor so they line up.
- **Edge and border pieces:** the cracked, red-lit edges that sit between floor and wall.
- **Multi-tile sprites:** altar, pillars, braziers, the Heart's plinth.
- **Heart animation:** the 16 frames from the reference sheet, as separate files at full resolution.

The reference sheet's pieces are too small and not built to tile, so they can't be cut out and used directly. The usual route is to generate or paint each piece separately at the target size and check it for seams.

## 4. Milestone 1: the Heart chamber

Scope: one room, the Heart chamber, in the dungeon theme. Nothing else.

1. Plumbing only: the theme switch and an empty dungeon pack. With no assets present the room looks exactly as it does now. This is the first check that nothing has changed.
2. Geometry: the chamber's shape and altar position, using placeholder flat colours from the reference palette. This lets us check the altar, the Heart and the walls line up before any real art arrives.
3. Art: swap placeholders for final tiles as they arrive, one piece type at a time.
4. The Heart: its 16-frame loop drawn on the altar.

**Done when:** the Heart chamber reads as the reference image, the classic view is unchanged, and the rest of the station is unchanged.

## 5. Protecting StarNet

- **Golden screenshots.** StarNet has a pixel-regression harness (`npm run golden`) and a screenshot tool (`npm run shoot`). The classic view must pass the golden check before and after every step.
- **Fast gate.** `npm run test:fast` must keep passing.
- **Off by default.** The dungeon theme does not change any view until it is switched on.
- **No new state.** The renderer reads geometry and shares the same data as the station. It does not add its own state.

## 6. Open questions

1. **Assets:** do you have an artist or a generation workflow for the tile pieces? If not, I can write a brief listing every piece, its size and its edge rules, so each one can be made consistently.
2. **Reference sheet:** where did it come from, and do we have the rights to use it as a style guide? The answer decides whether any piece can be taken from it.
3. **Heart chamber:** which room is the Heart chamber? I haven't yet confirmed where the Overseer's prop (`orchestrator` in the capability registry) is placed in the station layout. That needs checking before Milestone 1.
4. **Scope of the theme:** should the dungeon theme be a separate page, or a switch within StarNet? The classic view must stay reachable either way.

## 7. Decision: the Overseer room

- The Overseer room has a **static Dungeon Heart spawn in the middle**. The Overseer is the Heart.
- The Heart **never moves**. It stays on its spot and plays its sprite animation as a slow roll through the frames, not a walk.
- **Implication for StarNet:** the Overseer's body is normally placed and moved like any other agent. In DungeonAI the Heart is rendered as a fixed sprite that is never pathed, while its state (status, delegation, alerts) still comes from the same live data.
- **To confirm:** the speed of the roll. Starting point: one full 16-frame loop about every 4 seconds, ease-in and ease-out, so it breathes rather than flickers.

## 8. Decision: the Heart sits at a workbench

- The roll speed is approved: one 16-frame loop about every 4 seconds, eased.
- The Heart sits **permanently at a workbench** in the Overseer room, so it can always perform tasks.
- **StarNet behaviour to preserve:**
  - A seat is bound to one agent. Summoning and deleting agents only adopts or unbinds seats that have no agent, so the Heart's bound workbench is safe from those actions.
  - The hero agent already gets a workstation seeded at boot (`app.js`, `ensureWorkstation(agent.id)`), which is the mechanism that keeps the Overseer seated.
  - The workbench grants the terminal capability (`CAP_REGISTRY`: workbench → terminal). The recast must keep that capability, whatever the art looks like.
- **To confirm:** the Heart's workbench is a *workbench* in the Overseer room, not the Workshop anvil. That keeps it distinct from the anvils that belong to Workshop creatures.

## 9. Decision: the Heart's bench becomes a shrine

- The Heart's seat uses the **workbench** sprite (the first bench option) for now.
- It will later be reskinned as a **small shrine**. This is an art change only.
- Behaviour stays the same: a seat bound to the Overseer, plus a workbench capability (shell and verify, consent-gated) bound to the same seat.
- Art note: the sprite filenames don't match what they show (`bench.png` is a console desk, `industrial_bench.png` is a sofa). Choose sprites by how they look, not by name.
