# Odyssey of Meat-a-Roid — 3D Beginner Mission

A single-page Three.js prototype of the team's *Odyssey of Meat-a-Roid* mission. Flint Lockwood wakes on a fictional floating platform inspired by Uranus, gathers supplies, repairs a broken spacecraft, designs it for the trip, flies toward Earth, dodges meteoroids and attempts a landing.

> **Status: prototype for review.** This import is not approved MVP scope. Gameplay, progression and story are still under team review — see [`docs/design/gameplay-walkthrough.md`](../../docs/design/gameplay-walkthrough.md). Do not treat anything here as a product decision.

## Run it

No build step, no `npm install`, no dependencies to fetch locally.

```bash
cd game/odyssey-3d-beginner
python -m http.server 8000
```

Then open <http://localhost:8000> in Chrome or Edge.

Opening `index.html` directly (double-click, `file://`) does **not** work: browsers block local module files, so the page shows its error screen after a few seconds. Always serve the folder as above, including for demos.

Three.js r187 is stored under `vendor/three` and the page loads it from that folder. Sketchfab embeds and NASA image links still need a network. If one of those fails, its own frame or image reports the failure and the rest of the game keeps running.

Rules checks, from this folder:

```bash
node --test tests/mission-rules.test.mjs tests/science.test.mjs tests/journey.test.mjs tests/mission.test.mjs
```

Those tests cover the ship rules, the journey loop (stars, star upgrades, leg scoring, guide triggers, roles) and the science mission (objectives, instrument compatibility, launch capacity, CML checklist, the scan pass, data and downlink, score). They also check that every Advanced science equation reproduces the figure NASA prints. They do not by themselves prove the 3D page is wired correctly. Playwright runs through the whole journey (Egyptian Arabic with 2 players and solo, English solo) passed with no console errors on 2026-11-13.

## Journey loop and science mission

The game answers the Space Apps 2026 challenge "Space Mission Design Game" (resources and challenge text: [`docs/resources/challenge-2026/`](../../docs/resources/challenge-2026/README.md)). It follows the walkthrough in [`docs/design/gameplay-walkthrough.md`](../../docs/design/gameplay-walkthrough.md) (PR #79) with mission history notes from PR #48.

The redesign (2026-11-13, after play-testing feedback) turns every menu into gameplay. Choices are things the player does in the 3D world, and they show up as success or failure on the journey, not as quiz answers.

1. **Opening.** A skippable cutscene (replay it from the title screen). Dr. Vega at Mission Control sent Flint to Uranus by mistake and guides him home by radio. Steve is the comic side character.
2. **Build the ship in the 3D workshop.** Next to the ship on Uranus stand racks of real objects: science targets, instruments, recorders, routes, engines, tanks, shields, cabins, power, antennas, backups, rockets and orbits. Flint picks one up (`E`), carries it to the ship and installs it (`E`). A hologram over the ship shows weight, engine lift, power, stars, expected science data and supplies as bars, plus the four design steps. Beginner shows no tables; the 🔢 button shows the numbers for older players.
3. **Launch for real.** The ship only launches when nothing is red. A too-heavy ship, a weak engine or a tool that cannot see the target blocks the launch with a "fix it" list. Warnings (thin power, small recorder) let you fly anyway and take the risk.
4. **Scan pass at Uranus.** A mini-game: keep the circle on the glowing target while the instruments collect data into the recorder. Then send data home (`F` or 📡) during the flight; sending uses power and slows steering, and the signal gets faster as Earth gets closer.
5. **In-flight moments.** The dark stretch, a big rock and the meteoroid shower stop the action for a choice with three big buttons (keys `1`–`3`). In Team Mode the player who owns that role decides. Each choice changes the flight (battery, fuel, hull, steering) and the arrival report says what it did.
6. **Moon base.** A walkable base between the legs: repair station, trade robot and star upgrades (armor plate, extra tank, turbo engine, rock radar) that Flint carries to the lander. Stars come from flying well (3/2/1 ⭐ by hull lost).
7. **Real failure, easy retry.** The hull can break or the ship can go dark. Retry from the Moon base or go back to the workshop and change the build; Beginner gives more slack.
8. **Arrival:** mission score (success, science, efficiency, decisions), a mission report explaining why it went that way, how NASA engineers do the same thing (JPL Concept Maturity Levels 1–4, shown only in the report), similar real NASA missions, a local best-scores table, and a design download (JSON).

Every part, upgrade and decision has a **More Info** panel (press `I` next to a workshop item): what it does, its benefit and cost, the value on this ship now, whether it matters on the next leg, and real spaceflight notes. All numbers are game rules; NASA facts are cited in `SCIENCE_AND_ASSET_SOURCES.md`.

## Controls

| Input | Action |
|---|---|
| `W` `A` `S` `D` or arrow keys | Move Flint / steer the spacecraft |
| `E` | Pick up the nearest supply or workshop item; next to the ship, install it or launch; on the Moon, also open the lander |
| `I` | More Info about the workshop item you stand next to |
| `F` or 📡 | Start or stop sending science data home during the flight |
| `1` `2` `3` | Pick an option in an in-flight moment |
| 🔢 | Show or hide the numbers (Beginner hides them) |
| `Space` or the on-screen attack button | Pulse to repel Foodimals |
| Drag the 3D view | Orbit the third-person camera |
| `M` | Open the Sketchfab viewer and model import actions (title screen, or while Flint walks on Uranus or the Moon with no panel open) |
| `L` or 🌐 | Change language during the mission |
| `R` | Restart the mission (asks first and pauses the game; `Esc` cancels) |

Touch screens get an analog joystick (push further to move faster) and the ATTACK button; both work at the same time. Keyboard controls work everywhere.

## Tech used

- **Three.js r187** as ES modules through a local import map (`vendor/three`) — no bundler, no framework, still no build step. Ship rules are in `js/mission-rules.js`.
- One self-contained `index.html` holding markup, CSS and game JavaScript.
- Rendering: ACES tone mapping, image-based lighting generated from the sky, soft shadows that follow the player, and post-processing (multisampled HDR target, bloom, vignette and impact grading).
- All world art is procedural Three.js geometry and canvas textures; no new third-party assets were added.
- Static JPG artwork and a `glTF Binary` (`.glb`) character model.
- Optional Sketchfab `<iframe>` embeds for 3D reference viewing (not loaded into the Three.js scene).
- Three levels that teach the same NASA facts at three depths: plain words (Beginner), NASA numbers (Intermediate) and equations built only from NASA numbers with a “try it” check (Advanced). See `SCIENCE_AND_ASSET_SOURCES.md` and DEC-015.
- Languages, in menu order: English, Arabic, Egyptian Arabic, French and Spanish (DEC-017). "Arabic" is the formal Arabic translation. Its menu label is "Arabic", not "Arabic (Fusha)". Egyptian Arabic is everyday spoken Cairo dialect, written like a dubbed cartoon: short common words, no formal or technical terms. It was rewritten on 2026-11-13 after an Egyptian player found many words hard to follow, and it lives in `js/eg-copy.js`, loaded last so it replaces every Egyptian line. Both Arabic versions use right-to-left layout. Change language on the title screen, or mid-game with the 🌐 button in the inventory panel or the L key. All text goes through `COPY`/`loc()`. Flint’s jokes are original lines written for each language, not film quotes. Some Arabic, French and Spanish strings come from Rana Emad's version; the rest were written by an AI session. All of it still needs review by native speakers.

## Folder structure

```
game/odyssey-3d-beginner/
├── index.html                      # markup, styles, and the 3D page
├── js/mission-rules.js             # ship rules used by the page
├── js/science.js                   # NASA values and Advanced equations for the science cards
├── js/journey.js                   # walkthrough loop: stars, star upgrades, legs, guide, roles
├── js/journey-copy.js              # journey text in five languages
├── js/mission.js                   # science mission design: objectives, payload, orbit, booster, CML, data, score
├── js/mission-copy.js              # science mission text in five languages
├── js/play-copy.js                 # workshop, scan, moments and Moon base text in five languages
├── js/eg-copy.js                   # everyday Egyptian Arabic for the whole game (loaded last)
├── tests/mission-rules.test.mjs    # rule checks
├── tests/science.test.mjs          # equations reproduce NASA’s printed figures
├── tests/journey.test.mjs          # journey loop checks (walkthrough §8 list)
├── tests/mission.test.mjs          # science mission checks
├── vendor/three/                   # local Three.js r187 modules
├── README.md                       # this file
├── GAME-NOTES.md                   # prototype notes
├── SCIENCE_AND_ASSET_SOURCES.md    # NASA references, game-rule disclosure, asset provenance
└── assets/
    ├── characters/
    │   ├── Main_character_final.fbx                    # the player, Mixamo rig (~8.5 MB)
    │   ├── game_explorer_character_mixamo_game.fbx      # fourth player, Mixamo rig (~3.7 MB)
    │   ├── ChatGPT_Image_girl_with_ponytail_rigged.fbx # second player, Mixamo rig (~2.7 MB)
    │   ├── scientist_character_mixamo_rigged.fbx       # third player, Mixamo rig (~7.9 MB)
    │   ├── character_reference_mixamo_rigged.fbx       # earlier hero mesh, no longer spawned (~5.9 MB)
    │   └── monkey_mixamo_rigged.fbx                    # Steve the monkey companion (~3.3 MB)
    ├── spaceships/
    │   ├── basic_ship.glb             # damaged/unupgraded craft
    │   ├── first_upgrade_blue.glb     # solar-battery intermediate craft
    │   ├── first_upgrade_white.glb    # RTG intermediate craft
    │   └── second_upgrade_white.glb   # Moon-upgraded/refitted craft
    ├── flint_map_reference.jpg         # supplied map artwork
    ├── flint_spacecraft_reference.jpg  # supplied spacecraft artwork
    ├── flint_uranus_reference.jpg      # supplied alien-world artwork
    └── flint_model/
        ├── flint.glb                   # older rigged Flint, used only if the hero FBX fails to load (~1.1 MB)
        ├── flint_embedded.js           # same model as base64, loaded as a plain script (~1.5 MB)
        ├── license.txt                 # CC BY 4.0 terms
        └── README.txt                  # model notes
```

## Assets and attribution

- **Rana Emad** (GitHub `Rana2340`) designed the first versions of the cable repair, propellant sort, life-support game, walkable Moon, improved map, live spacecraft preview, interact key, and a set of Arabic, French and Spanish translations. They are merged here and adapted to the mission rules.

- **Flint Lockwood Rigged** by [Guilherme Navarro](https://sketchfab.com/guinavarro.al), Sketchfab — licensed **CC BY 4.0**. Attribution must be retained if the model is redistributed.
- Supplied artwork and the four progression spacecraft GLBs are project-provided. The procedural Three.js spacecraft remains the loading/error fallback; see the source register for model provenance and unresolved licence confirmation.
- NASA links (Uranus imagery PIA00032 / PIA00033 / PIA00143, NASA 3D Resources, NASA Eyes, the NSSDCA irradiance row, the Uranus facts page, and the Voyager RTG pages) are references only. The walkable Uranus-like surface and the Foodimal hazards are fiction. Solar endpoints are the fact-sheet values; other HUD numbers are simplified game rules. Details: [`SCIENCE_AND_ASSET_SOURCES.md`](SCIENCE_AND_ASSET_SOURCES.md).
- The CC BY 4.0 credit for Guilherme Navarro’s Flint model does not clear film or studio character rights. That approval is still open. Film character names stay in this prototype because the project lead kept Flint as the playable character.

## Visual quality pass

| Area | What changed |
|---|---|
| Planet surface | Noise-sculpted terrain with frozen rim ridges, baked colour variation and a tiling detail normal map; glowing grass that sways in the wind; lathe-built mushrooms, spires and crystal clusters; an animated mineral stream; floating spores and ice shards |
| Sky | Nebula dome, lit banded giants with atmospheric rims, a textured ring system and twinkling stars |
| Flint | The bundled clip only animates his face over a static A-pose, so his body is posed procedurally: jog cycle, arm swing, breathing, blinking, head look-around, a pulse cast pose and a hurt flinch. The face clip plays only while he "talks" during toasts. He turns smoothly, leans into turns and kicks up dust |
| Foodimals | Glossy berry bodies with seeds, a leaf crown, eyelids and noodle legs; they hop with squash and stretch, face their target, lunge to attack and pop with a juice burst |
| Pickups | Water, fuel, oxygen and shield parts are small 3D objects with a light beam and ground ring instead of emoji |
| Crash site | Level crash pad, scorch mark, debris, rising smoke and sparks; the engines stay dark until the ship is repaired |
| Flight | Lit Earth with clouds and atmosphere, the Moon, the Sun, a nebula backdrop, warp streaks, an engine trail, burning meteors with ember trails, and impact explosions |
| Game feel | Camera shake from decaying trauma, brief hit-stop on hits and impacts, screen flashes and a damage vignette; frame-rate-independent camera smoothing with look-ahead; movement is camera-relative with acceleration; Flint and Foodimals collide with large props |

Ship rules now live in `js/mission-rules.js`. Sunlight at Uranus and Earth uses the NASA fact-sheet endpoints. The curve between those endpoints, RTG output and mass, maneuver fuel, hull loss, and the recovery amounts are labeled game rules. Steering spends fuel. An empty tank coasts. A hit offers patch, backup, or absorb.

How the mission connects:

- **Repairs at the wreck.** Three glowing panels stand around the crashed ship (power bay, fuel line, life support). Walk up to one, read its gauges and pick the failed part. A wrong guess costs something (a shock to Flint, 1 fuel, or 1 oxygen). A quick patch is free, but that system starts the flight damaged.
- **Hands-on fixes.** After the power fault is found, Flint drags the loose cables of the dark circuits to their sockets, reading a wiring card (a wrong socket is the same 10-health shock). After the fuel leak is found, Flint sorts mixed propellant canisters into tanks and gets a short, sourced lesson on five real propellants and why dodges use thruster propellant. Both steps keep the quick-patch option.
- **Cabin emergency.** On every flight, a 25-second cabin emergency starts once the distance-to-Earth bar reaches 60%, still in the dark stretch (Rana Emad’s life-support game). The oxygen valve spends real oxygen supply; the heater and CO₂ filter spend electricity from the battery (solar ship) or steady RTG output. Damaged life support makes the alarms drain faster and brings the emergency back. Surviving clears that damage; failing costs 12 hull. Electricity spent leaves a solar ship with less battery.
- **Damage carries forward.** A damaged propulsion system turns slower. Damaged life support uses 1 oxygen every 10 seconds, then hull once the oxygen is gone. A power hit on an RTG ship cuts its output until fixed; it cannot be patched in flight.
- **Moon stop.** Landing costs 1 maneuver fuel. Choose a site away from craters, then walk Flint around the Moon in 3D to collect six supplies (crater floors slow him down). Walk back to the lander to spend supplies on hull, fuel and system repairs, then take off. A supply whose bar is full stays on the ground until you spend one. Skipping the Moon keeps the damage.
- **Map.** Found on Uranus, it shows supplies, repair panels and the wreck, with clickable NASA and Ahmed Soliman pins. In flight it shows the route to Earth; on the Moon, the supplies and the lander.
- **Mission readiness.** The design screen checks lift-off (thrust against weight at NASA’s 8.69 m/s² for Uranus) and power through the dark (a solar ship’s battery until sunlight recovers). Each check has a “?” that explains it with NASA data at the player’s level. A red check means the journey fails: the ship cannot lift off (no supplies spent), or it goes dark in flight. See DEC-016.
- **Failure.** If the hull reaches 0, retry from the design screen with the supplies you had at launch; repairs stay done. If Flint is knocked down, spend 1 oxygen to get up where he fell, or be carried back to the crash site with less health. "Start over" restarts the whole mission.

### URL flags

| Flag | Effect |
|---|---|
| `?low` | Start at reduced quality (pixel ratio 1, no MSAA) for weak devices |
| `?hq` | Keep full quality (turns off the automatic quality reduction) |
| `?debug` | Exposes `window.__odyssey` (for example `toFlight()`, `lookAtShip()`, `fps()`, `openPanel('power')`, `repairAll('patched')`, `progress(74)`, `hit('life')`, `forceHull(0)`, `cabin()`, `landMoon(30,30)`, `teleport(x,z)`, `stick()`, `nasa()`, `ahmed()`, `readiness()`, `forceBlackout()`) for automated screenshots and QA |

The game lowers its resolution, then bloom and shadow resolution, if the frame rate stays below 30 fps. It also respects `prefers-reduced-motion` by softening camera shake and screen flashes and skipping hit-stop.

## Verification status

- Verified locally in Chromium on an integrated AMD Radeon GPU at 1280×720: the title screen, exploration, walking, the pulse, the crash site and the flight render with no console errors, at about 46–54 fps at full quality.
- 2026-11-11, Chrome served over http with `?debug`: the repair panels (wrong guess, shock, quick patch), design, launch with patched damage, the life-support oxygen drain, an RTG power hit, hull failure and retry from design, the Moon landing cost and Moon repairs, the ending screen, being knocked down and rescued, walking into a panel, and the Arabic repair panel worked with no console errors. Debug hooks were used to reach each step quickly; this was not one continuous playthrough.
- 2026-11-11, headless Edge served over http with `?debug` (31 scripted checks, all passing): Three.js from `vendor/three`, the map appearing only after it is found, walking, the cable step (only dark circuits loose, wrong socket −10 health, fixed after reconnecting), the propellant sort (pouring, no battery wording, patch carries into flight as damage), the design preview following engine, power and antenna, the cabin emergency (oxygen valve spends supply, timer stops, battery never rises, flight resumes), the 3D Moon walk (walking, supply pickup, lander repairs, take-off) and the Arabic HUD. The only failed request was `favicon.ico`.
- 2026-11-13, Chrome served over http with `?debug`: the FBX hero and the 3D Steve load with no console errors; Steve follows Flint on Uranus and the Moon and turns to the hint target when Flint stops; Flint and Steve ride in the flight cockpit; the 3D viewer shows both models; restart respawns them. The cockpit was also checked from a temporary side camera, which is not part of the game.
- Not verified: a full playthrough of every difficulty level, mobile/touch devices and other browsers (manual QA still needed).
