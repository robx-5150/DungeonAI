# Phase 0: StarNet Source Audit

Status: draft for review. Prepared from the public StarNet repository (`androoAGI/starnet`, trunk at commit `54899e5`, package version 0.13.2).

**Important:** the installed StarNet (which uses the Overseer name Grimaldus) may differ from this public trunk. Findings marked **unconfirmed** must be checked against the installed copy before implementation.

## 1. How StarNet runs

- One Node process (`sidecar/index.js`) serves the browser interface on port 8787 and runs the agent loop in-process.
- The desktop app (Tauri) embeds the same Node sidecar and packages the same `frontend/` folder.
- The interface is plain JavaScript with no build step. About 80 modules in `frontend/app/` load in dependency order.
- The station is drawn on a canvas by `frontend/app/world.js` (about 5,600 lines), which handles tiles, pathing, props, conveyors and agent bodies.

**Implication:** DungeonAI can be a second front end in `frontend/` or a separate folder served by the same sidecar. No framework rewrite is needed.

## 2. Event contract (the source for animations)

`shared/events.js` defines about 60 event types with schema validation in both directions. The contract is frozen: names and fields can be added to but never renamed or removed.

Events relevant to creature animation:

| Event | Key fields | Useful for |
|---|---|---|
| `agent.run.start` | agentId, runId, trigger (directive, schedule, event, loop, nightshift), model | Creature starts working |
| `agent.run.end` | agentId, runId, reason, turns, usd | Creature finishes; reason distinguishes done, empty, clarifying and others |
| `agent.waiting` | (see schema) | Creature waits on the Master |
| `agent.token` | (see schema) | Streaming activity (use sparingly) |
| `agent.cost`, `budget.threshold`, `credits.low` | | Heart alerts about spend |
| `permission.prompt`, `permission.response` | | Heart alerts: "Your attention is required" |
| `workitem.delivered`, `workitem.placed`, `workitem.superseded` | | Scroll and outbox states |
| `cron.fire`, `cron.result` | | Scheduled work |
| `verify.result`, `taskbrief.settled` | | Completion checks |

**Important finding:** `agent.run.end` with reason `empty` means a run produced nothing. The contract says the interface must not show it as a delivered result. DungeonAI must follow this rule, so an empty run shows a failed or empty state, not a scroll.

**Unconfirmed:** which HTTP route streams these events to the browser. `sidecar/index.js` has a `text/event-stream` response near line 11857, but I have not confirmed it is the main run-event feed. This must be checked before the adapter is built.

## 3. The Overseer

- `frontend/app/overseer.js` polls `/api/overseer`. The response contains delegation **threads**, **workers** (with run IDs and status) and **reviews**.
- The Overseer reconciles delegated work and adopts child threads into the workstream list.
- The name "Grimaldus" does not appear in the public trunk. It is the name in the user's installed copy, so the display name is a configuration value, not a code constant.

**Implication for the Dungeon Heart:** it should read `/api/overseer` for delegation state and send commands through the existing Overseer path. It should not build its own delegation logic.

## 4. Roster (who the creatures are)

- The **frontend owns the roster**. The sidecar mirrors it via `POST /api/roster`.
- The roster route replaces the whole stored crew on each push. The code has strict validation to stop a malformed push wiping the roster.
- Specialty classes come from `shared/specialties.js`. The list includes strategist, chief, researcher, analyst, marketer, copywriter, webdesigner, publisher, producer, writer, prospector, treasurer, support, scout, sentinel and others.

**Implication:** DungeonAI must never write the roster. It is read-only. Agent identity (agentId) is the stable key for each creature.

**Correction to our earlier mapping:** `chief` is a specialty in StarNet, but the brief says the Overseer is the Dungeon Heart. These may be different things. Confirm in the installed copy before mapping `chief` to the Heart.

## 5. Capabilities, safety and spend

- `sidecar/capability/` turns the station layout into a tool allowlist (`resolve.js`, `capGate.js`, `registry.js`).
- Permissions and grants (`permissions.js`, `permgrants.js`) handle consent for actions.
- `halt.js` is the emergency stop.
- Spend is tracked in `cost.js`, `spend.js` and `ledger.js`, with budgets.

**Implication:** the room layout already gates what agents can do. DungeonAI must show these limits, not work around them. Closing the dungeon must not stop runs.

## 6. Persistence

- The interface saves to localStorage (versioned, currently v5) and mirrors to the sidecar.
- Agent memory, transcripts, spend and schedules persist on disk through atomic stores (`*-store.js`).

**Implication:** DungeonAI reads these stores through existing routes. It adds no new persistence in Phase 1.

## 7. Existing functionality to keep

Everything in the installed StarNet, including: agent loop, providers (Anthropic, OpenAI, Gemini, OpenRouter, OpenAI-compatible, Codex), tools, MCP connectors, channels (Telegram, Discord, Slack, Signal, Matrix), cron, recipes, skills, Night Shift, budgets, permissions, and the Classic station view.

## 8. Recommended approach

1. **Fork, do not rewrite.** Work on a branch of a private copy of StarNet, so the Classic view and rollback are in the same app.
2. **Keep DungeonAI in `frontend/dungeon/`** as a second view. Add a switch labelled "Classic StarNet View".
3. **Adapter layer:** one small module that reads events and `/api/overseer` and translates them to creature states. Read-only.
4. **Confirm the event route** and the installed Overseer name before writing the adapter.
5. **Library vertical slice** first (one Warlock at one desk), then the Heart.

## 9. Open questions for you

1. **Installed version.** Can you share the installed StarNet folder, a zip, or the git remote of your fork? The public trunk may not match.
2. **Private copy.** A GitHub fork of a public repo stays public. For a private copy, create a new **private** repository and push the StarNet code to it. Do you want me to prepare the commands, or will you create the empty private repo first?
3. **Heart identity.** Is `chief` the Overseer (Grimaldus) in your install, or a separate agent?
4. **Dungeon Heart status.** Should the first Heart be read-only (shows delegation and alerts) with no commands, or should it accept text commands from the start?

## 10. Decisions so far (updated)

- **Rooms are generic.** A StarNet room is a capability-scoped team. DungeonAI styles each room (Library, Workshop, Treasury and so on) on top of its contents. The style is a design choice, not a StarNet concept.
- **StarNet components become themed furniture.** Desks and workbenches are recast per room style: bookshelves in a Library, anvils in a Workshop. Each furniture type has its own animation (for example, anvils get a hammering animation). Sprites stand beside the furniture to work.
- **Art is reference-only for now.** The Dungeon Keeper screenshots guide layout and mood. New art is made as the project goes.
- **Build approach.** Fork StarNet (a private copy is preferred) and build DungeonAI on a branch there, keeping the Classic view and a rollback path.
