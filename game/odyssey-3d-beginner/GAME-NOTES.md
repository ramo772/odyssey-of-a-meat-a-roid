<!-- Imported from the original prototype README. Content below is unchanged apart from this note.
     Start with README.md for run instructions and the short overview. -->

# Odyssey of Meat-a-Roid — 3D Beginner Mission

A single-page Three.js prototype of the Beginner mission, styled around the world of *Cloudy with a Chance of Meatballs*: Flint Lockwood is the single playable character, and Foodimal-inspired creatures are the planet hazards. The environment follows the supplied purple/pink alien-world artwork.

## Flint Lockwood — embedded 3D viewer and playable-character limitation

The opening screen and in-game objective panel include a **live Sketchfab 3D viewer** for the exact model you shared: [Flint Lockwood Rigged by Guilherme Navarro](https://sketchfab.com/3d-models/flint-lockwood-rigged-27ab8859c8c1415290bc06f4c2e43b8f). Select **Open Flint’s live 3D viewer** (or press **M**) to rotate and inspect the actual rigged film character. This uses the embed code you provided and does not require a model download just to view it.

**Important technical distinction:** the embed is a Sketchfab-hosted viewer inside an iframe. It is not the model's GLB/GLTF file, and the iframe does not expose its mesh, skeleton or textures to the game's Three.js scene. Therefore, the actual model can be displayed in the viewer, but it cannot replace the moving in-world player character from the embed alone. The playable character remains the project's locally-built fallback until an authorized `.glb` or complete `.gltf` package is supplied.

If you later obtain the downloadable asset through Sketchfab or directly from the creator, the game can import it:

1. Choose **Load a GLB/GLTF file (optional)** on the opening screen, or press **M** during the game.
2. Select a standalone `.glb`, or choose the extracted folder containing `scene.gltf`, `scene.bin` and `textures/`.
3. The importer replaces the fallback player mesh and uses any animation clips included in the file.

Sketchfab's official Download API requires authentication and a model that has download access enabled; the embed itself is not a download link. See [Sketchfab's download documentation](https://sketchfab.com/developers/download-api/downloading-models) and [Viewer API documentation](https://sketchfab.com/developers/viewer).

### Attribution

**Flint Lockwood Rigged** — Guilherme Navarro, Sketchfab. The model page identifies the license as Creative Commons Attribution (CC BY); retain attribution and follow the license terms if you use or redistribute the model asset. [Source model page](https://sketchfab.com/3d-models/flint-lockwood-rigged-27ab8859c8c1415290bc06f4c2e43b8f).

## Run the project

1. Extract the project ZIP to a folder.
2. Open a terminal in that folder.
3. Run `python -m http.server 8000`.
4. Open `http://localhost:8000` in Chrome or Edge.
5. Internet is required for the Three.js library, Sketchfab viewer and NASA photo gallery.

## Controls

- **W / A / S / D** or **arrow keys**: move Flint / steer the spacecraft.
- **Space** or the **✦** button: use Flint's pulse to repel Foodimal creatures.
- **Drag the 3D view**: orbit the third-person camera while exploring.
- **M**: open the real Flint Sketchfab viewer and model import actions.
- **R**: restart the mission.
- Touch-screen directional buttons are also available.

## Beginner gameplay

- Flint wakes up on a fictional floating exploration platform inspired by Uranus's icy environment and searches for a map to a broken spacecraft.
- Collect water, fuel, oxygen and thermal-shield parts; the HUD tracks each resource.
- Foodimal-inspired creatures chase Flint. Use the pulse to defeat them and collect supply bags; health packs help recover.
- Discover NASA Uranus imagery and an astronomy/telescope reference.
- Repair the power bay, fuel line and life support at three panels around the wreck by reading gauges and finding the fault. A quick patch skips the puzzle but that system starts the flight damaged. (This replaced the earlier wire-colour matching on 2026-11-11.) After the fault is found, the power bay needs its dark circuits rewired from a wiring card, and the fuel line needs its mixed propellant canisters sorted (both from Rana Emad's version).
- Choose an engine, tank, shield, cabin, power, antenna, trajectory and redundancy. Any build the player can pay for can launch; the choices change handling, fuel use, damage and power in flight.
- Fly toward Earth, steer to dodge meteoroids (steering spends fuel), and after a hit choose to patch, use a backup, or absorb the damage.
- On every flight, a 25-second cabin emergency starts in the dark stretch. It spends real oxygen and the ship's electricity (from Rana Emad's life-support game). Damaged life support makes the alarms drain faster, and the outcome stays on the ship.
- Optionally stop at the Moon, choose a safe landing area, walk Flint around the Moon in 3D to collect supplies, and spend them on repairs at the lander.
- Finish with Flint returning safely to Earth.

## Cloudy with a Chance of Meatballs cast inspiration

The in-game story centers on Flint. The playable experience is focused on Flint and original Foodimal-inspired hazards.

Character index: <https://cloudywithachanceofmeatballs.fandom.com/wiki/Category:Characters>
Flint character profile: <https://cloudywithachanceofmeatballs.fandom.com/wiki/Flint_Lockwood>

## Environment and science notes

The planet environment uses the purple/pink twilight look, porous rocks, oversized mushrooms, glowing cyan mineral seams and a consistent third-person camera inspired by the supplied reference images. The walkable terrain is fictional gameplay scenery: Uranus is an ice giant and has no solid surface to walk on.

NASA imagery gallery links to Voyager 2 records:

- PIA00032 — Uranus in True and False Color: <https://science.nasa.gov/photojournal/uranus-in-true-and-false-color/>
- PIA00033 — Uranus Rings in False Color: <https://science.nasa.gov/resource/uranus-rings-in-false-color/>
- PIA00143 — Uranus Final Image: <https://science.nasa.gov/resource/uranus-final-image/>

Moon stop reference: Dr. Farouk El-Baz and Apollo landing-site selection: <https://www.nasa.gov/history/50-years-ago-lunar-landing-sites-selected/>. The in-game landing activity is simplified and is not a real mission-planning algorithm.

## Project files

- `index.html` — complete game, styles, JavaScript and local import controls.
- `assets/flint_uranus_reference.jpg` — supplied alien-world / Flint artwork.
- `assets/flint_map_reference.jpg` — supplied Flint map artwork.
- `assets/flint_spacecraft_reference.jpg` — supplied spacecraft artwork.
- `assets/flint_model/README.txt` — optional manual local model-folder instructions.

## Spacecraft visual progression

The ship now uses four team-supplied GLB forms. It begins as `basic_ship.glb`. The first successful Uranus hardware installation changes it to `first_upgrade_blue.glb` for a solar-battery build or `first_upgrade_white.glb` for an RTG build. A successful Moon star upgrade or engine/tank/shield/cabin refit advances it to `second_upgrade_white.glb`. The selected form persists into flight and the Moon; ordinary in-flight decisions do not remodel it.

Models load asynchronously and are normalized to the game scale. The existing custom Three.js spacecraft appears immediately and remains the fallback if a GLB cannot load. Its design is inspired by [Futuristic Sci-Fi Jet, Plasticity, Boxcutter by mgfxer on Sketchfab](https://sketchfab.com/3d-models/futuristic-sci-fi-jet-plasticity-boxcutter-251ddfbb6a35472aa30d227f9b518230); the original Sketchfab file is not bundled.


## Spacecraft design launch fix

Launch is allowed when the selected parts are affordable. There is no green-checklist gate and no extra fuel charge for a fast transfer. Power, communications, trajectory, and redundancy are available on every difficulty. The design panel shows handling, loaded propellant, maneuver-fuel use, absorb hull loss, and whether sunlight at departure covers the ship’s load. The panel still closes before the flight scene starts. Missing supplies are listed when a combination costs more than the player is carrying.

## Additional 3D environment details

The environment has been visually expanded while preserving the existing mission, objectives, collectibles, character, spacecraft, resource balancing, puzzles, controls, and progression. New procedural 3D details include a research outpost, deep-space dish, communications mast, parked science rover, ice arches, mineral clusters, frosted boulders, spore lamps, and suspended ice fragments. These are decorative scene meshes and do not replace or move existing gameplay objects.

### 3D asset inspiration and references

- NASA 3D Resources (free models, textures, and imagery; review the usage guidance for individual assets): https://science.nasa.gov/3d-resources/
- NASA 3D Resources GitHub collection: https://github.com/nasa/NASA-3D-Resources
- NASA Eyes mission visualizations and spacecraft models: https://science.nasa.gov/eyes/
- Three.js GLTFLoader documentation (for future GLB/GLTF model integration): https://threejs.org/docs/pages/GLTFLoader.html

The added environment dressing is built procedurally with the project's existing Three.js version, so no additional downloaded model files or new runtime dependencies are required. The NASA links are reference sources; no NASA model has been substituted for existing game content.


## Single-player controls and languages

- Languages, in menu order: English, Arabic, Egyptian Arabic, French and Spanish. Change language before the mission or during it with the 🌐 button or the L key. Arabic is the formal translation. Egyptian Arabic is the dialect. Both are right to left.
- You walk as Main_character_final. Each extra player adds one other human model, so four players are four people. Steve the monkey still follows and is not one of the four. There is no online multiplayer.
- Move Flint with WASD or the arrow keys. Use the on-screen arrow pad when preferred.
- Attack nearby Foodimals with Space or the clearly labeled **ATTACK FOODIMALS** button.
- The resource inventory is displayed in the upper-left corner with named bars for water, fuel, oxygen and thermal shield, plus health.
- The planet map, spacecraft repair, spacecraft balancing, Earth-bound flight, overview/cockpit camera switch, and meteoroid hazards remain part of the mission.


## Challenge levels (updated)

The original Beginner flow remains the default and retains its original resource targets, exploration, repair puzzles, spacecraft design, flight and controls. The opening screen now lets players choose one of three solo challenge levels:

- **Beginner** — original resource targets, fewer Foodimals, and lighter meteoroid pressure. The ship decisions are the same as on the other levels.
- **Intermediate** — higher collection targets (water 8, fuel 8, oxygen 5, shield parts 4), seven Foodimals, more aggressive pursuit, and denser/faster meteoroid traffic.
- **Advanced** — highest collection targets (water 10, fuel 10, oxygen 7, shield parts 5), nine Foodimals, and the strongest pursuit and flight hazards. Hits cost more hull. No single design is required.

Power is solar-plus-battery or an RTG. Communications are standard or high-gain. Trajectory is balanced, fuel-efficient, or fast. Redundancy is single-string or one backup. A fast route shortens the flight and makes each dodge cost more fuel. A fuel-efficient route lengthens the flight and makes each dodge cheaper. It does not slow the meteoroids. An empty tank coasts and does not slow the route. The mission-completion review says whether the ship coasted or still had maneuver fuel, and which damage is still aboard.

**Science honesty:** These are transparent, deterministic educational rules, not real mission calculations. NASA data, units and sources are not invented; the scores and costs are labeled as simplified game rules. See `SCIENCE_AND_ASSET_SOURCES.md` for the source register and asset provenance.

## Scope intentionally not added

Dr. Nadir and RIVO are intentionally not included, as requested. Flint is still the only walking character. No online multiplayer mode has been added.

**Update 2026-11-13:** the walkthrough (PRs #79 and #48) and the Space Apps 2026 challenge added Team Mode for 1–4 players on one shared screen. Players hold roles, and in each in-flight moment the player who owns that role decides. The player walks Main_character_final. Two players add the ponytail model, three add the scientist, and four add the explorer, so four players are four people. Steve the monkey follows beside them. There is still no online multiplayer. The same day, after play-testing, the menus became gameplay: the ship is built by carrying parts in a 3D workshop, science is a scan mini-game, plans became in-flight moments, credits became stars, and the Egyptian Arabic text was rewritten in everyday dialect. The mission guide is a new original character, Dr. Vega (on the radio), and Steve is comic relief. See README.md, "Journey loop and science mission".
