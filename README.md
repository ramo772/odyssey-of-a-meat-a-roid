# The Odyssey of a Meat-a-roid

A browser game for the NASA Space Apps Challenge 2026 challenge **Space Mission Design Game**.

The player designs a science mission, installs the spacecraft systems that mission needs, launches, and lives with the trade-offs. Mass, power, fuel, data, and communications change what the flight can survive. A design that fails can be changed and flown again.

This repository contains the playable game and the agent skill files used while building it. It does not claim NASA endorsement.

## Play it

The page must be served over HTTP. Opening `index.html` from disk does not work.

```bash
cd game/odyssey-3d-beginner
python -m http.server 8000
```

Then open <http://localhost:8000> in Chrome or Edge.

No install step and no API key. Three.js is stored in `game/odyssey-3d-beginner/vendor/three`.

## What the player does

1. Wake beside a crashed ship on a fictional platform near Uranus. Dr. Vega guides the trip home by radio. Steve the monkey is the companion.
2. Gather supplies and repair power, the fuel line, and life support.
3. Build the mission in the workshop. Pick a science target, carry parts to the ship, and install them. The ship check shows weight, engine lift, power, science data, and supplies.
4. Launch only when the ship check allows it. A red check blocks launch and lists what to fix. A warning lets the player fly and take the risk.
5. Scan the target at Uranus, then fly toward Earth. The dark stretch, a large rock, a cabin emergency, and a meteoroid shower each ask for a choice. The choice spends fuel, power, oxygen, or hull.
6. Stop at a Moon base to repair, trade supplies, and fit upgrades bought with stars earned in flight.
7. Arrive and read the mission report: what the design did, and why.

The same ship can be played by one person or by two to four people at one computer. There is no online multiplayer.

Languages on the start menu: عربي (Egyptian Arabic copy), English, French, and Spanish.

Controls, part names, and the science notes are documented in [`game/odyssey-3d-beginner/README.md`](game/odyssey-3d-beginner/README.md). Cited NASA facts and the numbers that are game rules are listed in [`game/odyssey-3d-beginner/SCIENCE_AND_ASSET_SOURCES.md`](game/odyssey-3d-beginner/SCIENCE_AND_ASSET_SOURCES.md).

## What is in this repository

| Path | What it is |
|---|---|
| `game/odyssey-3d-beginner/` | The playable game |
| `.claude/skills/`, `.agents/skills/`, `.github/skills/` | Agent skill files used by the team |
| `skills-lock.json` | Record of those skills |
| `third-party-licenses/` | License texts for third-party skills |

## Limits

- The flight model uses cited NASA values where the source file says so. Hit damage, battery drain, star rewards, data units, and the strength of the meteor shower are game rules.
- The workshop is fiction. It is not a NASA vehicle, and the game does not use the NASA insignia.
- Flint Lockwood and Steve are in this prototype. The included model credit does not clear film-character rights. That approval is still open.
- This build is a playable prototype. It does not report a measured learning result.

## Team

The Odyssey of a Meat-a-roid: Omar Khaled (Team Lead), Abdullah Waleed, Shahnda Elmasry, Engy Refaai, Rana Emad, and Rokiya Abdelsattar.
