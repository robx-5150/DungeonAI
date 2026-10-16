# DungeonAI Character Mapping

Phase 1 maps StarNet agents and their activity to dungeon creatures and rooms.

## Creature Types (from StarNet specialties)

| StarNet Class | Creature | Room | Nest | Animation States |
|---|---|---|---|---|
| Researcher | Warlock | Library | Arcane Chamber | idle, reading, thinking, casting |
| Analyst | Imp | Workshop | Burrow | idle, working, calculating, resting |
| Strategist | Dragon | Throne Room | Lair | idle, brooding, commanding, flying |
| Chief | Dungeon Heart | Central Hub | Core | idle, speaking, pulsing, alert |
| Writer | Scribe | Archive | Study | idle, writing, thinking, resting |
| Copywriter | Scribe | Archive | Study | idle, writing, thinking, resting |
| Publisher | Herald | Great Hall | Chamber | idle, announcing, gesturing, resting |
| Producer | Overseer Imp | Command Center | Quarters | idle, directing, checking, resting |
| Support | Healer | Infirmary | Den | idle, healing, helping, resting |
| Scout | Wyvern | Watchtower | Nest | idle, flying, watching, returning |
| Sentinel | Knight | Barracks | Quarters | idle, patrolling, standing guard, alert |

## Activity Mapping (StarNet events → animations)

| StarNet Event | Creature Animation |
|---|---|
| agent.run.start | creature walks to room, sits at workstation |
| agent.waiting | creature pauses, looks confused or thinking |
| agent.token | creature nods, continues work |
| agent.run.end | creature stands, returns to nest, sits idle |
| cron.fire | creature receives pulsing signal from core |
| workitem.delivered | creature carries item to outbox |

## Rooms (themed from Dungeon Keeper)

- **Library** — Research, learning, knowledge work
- **Workshop** — Analysis, calculation, technical work
- **Throne Room** — Strategy, command decisions
- **Archive** — Writing, content creation
- **Great Hall** — Communication, publishing
- **Command Center** — Management, oversight
- **Infirmary** — Support, assistance
- **Watchtower** — Scouting, monitoring
- **Barracks** — Security, protection
- **Central Hub** — The Dungeon Heart (core AI)

## Phase 1 Scope

Read-only interface. Creatures animate based on live StarNet events. No backend changes. Original StarNet UI remains available.
