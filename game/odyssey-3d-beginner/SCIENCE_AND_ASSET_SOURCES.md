# Science and asset source register

This register distinguishes NASA references from simplified game rules and fictional story elements.

## NASA references consulted

- **NASA 3D Resources** — official catalogue of downloadable NASA 3D models, textures and imagery: https://science.nasa.gov/3d-resources/ . The catalogue describes its assets as free to download and points users to NASA imagery/media usage guidance. No external NASA mesh was inserted into this update because the current stylized Uranus-inspired scene uses custom Three.js geometry; adding an unrelated real mission model would change its visual direction and create unnecessary loading risk.
- **NASA Eyes** — mission and solar-system 3D visualizations and selected downloadable spacecraft models: https://science.nasa.gov/eyes/ .
- **NASA/JPL Solar Sails and Spacecraft Propulsion lesson** — background for propulsion trade-off learning: https://science.nasa.gov/learn/heat/resource/solar-sails-and-other-spacecraft-propulsion/ .
- **NASA/JPL Mission to Mars — Design Your Spacecraft** — educational engineering-design activity: https://www.jpl.nasa.gov/edu/resources/collection/mission-to-mars-student-challenge/education-plan-design-your-spacecraft/ .
- **NASA Goddard Mission Design Lab** — identifies real mission design disciplines such as propulsion, flight dynamics, communications, power, thermal, reliability and mission operations: https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/ .

## Existing Uranus imagery references

- NASA/JPL PIA00032 — Uranus in true and false color: https://science.nasa.gov/photojournal/uranus-in-true-and-false-color/
- NASA/JPL PIA00033 — Uranus rings in false color: https://science.nasa.gov/resource/uranus-rings-in-false-color/
- NASA/JPL PIA00143 — Voyager 2 final Uranus image: https://science.nasa.gov/resource/uranus-final-image/

## Facts used as flight endpoints (2026-11-11)

These three rows are also DATA-030, DATA-031, and DATA-032 in `docs/research/source-register.md`. An AI session read the pages on 2026-11-11. A human has not checked them yet. They are not scientific sign-off.

- **NASA fact.** NSSDCA Uranus Fact Sheet, solar irradiance: Uranus 3.69 W/m², Earth 1,361.0 W/m², printed ratio 0.0027. https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html
- **NASA fact.** Uranus facts page: no true solid surface, atmosphere minimum 49 K (−224.2 °C), winds up to 900 km/h. https://science.nasa.gov/uranus/facts/
- **NASA fact, citation only.** Voyager’s MHW-RTG is listed at 158 watts electric at the beginning of mission, and each Voyager carries three RTGs. https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/power-radioisotope-thermoelectric-generators/ and https://science.nasa.gov/resource/voyagers-radioisotope-thermoelectric-generator-rtg-2/ The game does not multiply those figures and does not use 158 W as the ship’s output.

## Propellant lesson and cabin emergency (2026-11-11)

These rows are DATA-033 to DATA-037 in `docs/research/source-register.md`. DATA-033 and DATA-037 were fetched and read by an AI session. DATA-034, DATA-035 and DATA-036 are AI search summaries of NASA technical reports that nobody has opened yet; they are leads, not evidence. A person must check all five before submission.

- **NASA fact (fetched).** Dawn carried 425 kg of xenon; each ion engine produced at most 91 millinewtons. https://science.nasa.gov/mission/dawn/technology/ion-propulsion/
- **Lead.** Hydrazine is a catalyst-decomposed monopropellant used for spacecraft reaction control, needs one set of tanks, and is toxic; cryogenic oxygen and hydrogen give a large efficiency gain. NASA In-Space Chemical Propulsion Systems Roadmap (NTRS 20180005485).
- **Lead.** RP-1 is a kerosene fuel burned with liquid oxygen in the Atlas booster (NTRS 19680010371).
- **Lead.** Project Morpheus flew a liquid oxygen / liquid methane system; NASA studies propose making both on Mars (NTRS 20140009917, 20170001421).
- **NASA fact (fetched).** NASA life-support systems generate oxygen and remove carbon dioxide with molecular sieves. https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/

Game rules and fiction added with these features:

- The propellant sort is a puzzle. Canister colours only tell propellants apart. "Maneuver fuel stands for thruster propellant such as hydrazine" is a game simplification, not a statement about this ship.
- The power-bay wiring card, circuit colours, and the 10-health shock for a wrong socket are fiction and game rules.
- The cabin emergency (25 seconds on every flight, once the route bar reaches 60%; alarm drain rates; +45 oxygen; +38 temperature; 5 electricity per heater or CO₂ control; 12 hull on failure; alarms drain 1.5× faster while life support is damaged) is a game rule. Cabin temperature control is not taken from the ECLSS page. A solar ship's electricity in the cabin comes from its battery and never recharges it; an RTG ship recharges steadily. Those are game rules.
- The 3D Moon walk, its six supplies, and slower walking on crater floors are game rules. Landing-site choice still references Farouk El-Baz's Apollo work as a simplified activity, not a landing algorithm.

## Level science cards (2026-11-11, DEC-015)

The same six NASA topics appear at every level, at a different depth. Values live in `js/science.js`; `tests/science.test.mjs` checks each Advanced equation against the figure NASA prints. The gravity example’s 1,700 kg ship mass and 22,000 N engine are game rules. 8.69 m/s² is NASA’s figure.

| Topic | Beginner | Intermediate (NASA numbers) | Advanced (arithmetic from NASA numbers) | Sources |
|---|---|---|---|---|
| Lift-off | Uranus pulls almost as hard as Earth. The engine must push harder than the ship weighs. | 8.69 m/s² at the 1-bar level, about 0.89 of Earth’s 9.78 m/s² | W = m × 8.69. A 1,700 kg example weighs 14,773 N. | DATA-041 |
| Cold and wind | Very cold, very fast winds | 49 K (−224.2 °C), winds up to 900 km/h | °C = K − 273.15; 900 km/h ÷ 3.6 = 250 m/s, matching the fact sheet’s 0–250 m/s | DATA-032, DATA-038 |
| Sunlight | Too weak far from the Sun | 3.69 W/m² at Uranus, 1,361.0 W/m² at Earth, about 0.27% | Inverse-square law: 1,361.0 ÷ 19.191² ≈ 3.70 W/m² (fact sheet: 3.69) | DATA-030, DATA-038 |
| RTG power | Heat from radioactive material, works far from the Sun | Three RTGs per Voyager, plutonium-238, 158 W each at launch | 3 × 158 W = 474 W (NASA does not print this total) | DATA-031, DATA-040 |
| Signal delay | Even light needs hours | Sunlight takes 2 h 40 min to reach Uranus, about 2.9 billion km | t = d ÷ c = 2,867,043,000 km ÷ 299,792 km/s ≈ 159 min | DATA-038, DATA-039 |
| Ion engine | Gentle push, very little propellant | Dawn: 425 kg xenon, at most 91 mN, about 3.25 mg/s | v = F ÷ ṁ = 0.091 ÷ 0.00000325 ≈ 28,000 m/s | DATA-033 |

- The speed of light (299,792.458 km/s) is an SI constant, not a value from a NASA page.
- The “try it” check accepts answers within 5% of the exact working. It never blocks the mission.
- Cards say whether a line is a NASA fact or arithmetic from NASA numbers. Game rules elsewhere stay labelled as game rules.

## Balance checks (2026-11-12, DEC-016)

- **NASA fact.** Uranus’s acceleration at the 1-bar level is 8.69 m/s² (Earth 9.78); escape velocity 21.3 km/s. NSSDCA fact sheet, DATA-041.
- **Lift-off check.** Weight W = m × 8.69 m/s²; the ship lifts off only if engine thrust F > W. Ship masses (structure 500 kg; engines 150/250/400 kg; tanks 120/220/350 kg dry plus 60 kg per propellant unit; shields 150/320 kg; cabins 120/300 kg; solar 90 kg, RTG 280 kg; antennas 10/70 kg; redundancy 110 kg) and engine thrusts (14,000 / 22,000 / 34,000 N) are game rules. Lifting off a fictional platform is a simplified check, not orbital mechanics.
- **Power through the dark.** NASA’s 3.69 W/m² at Uranus (DATA-030) is why a solar ship relies on its battery until sunlight recovers. Battery size (3), drain rates, the 0.3 reserve kept for cabin alarms and the blackout rule are game rules.
- **Cabin emergency on every flight.** Starts when the route bar reaches 60%, lasts 25 s; heater and CO₂ filter cost 5 electricity each from the same battery; damaged life support makes alarms drain 1.5× faster. All game rules. Gravity is a sixth science topic (`js/science.js`), checked in `tests/science.test.mjs`.

## Science mission design and journey loop (2026-11-13)

Added for the Space Apps 2026 challenge "Space Mission Design Game" (resources in `docs/resources/challenge-2026/`) and the walkthrough in PRs #79 and #48. An AI session read each page below on 2026-11-13. A human has not checked them yet. They are not scientific sign-off.

**NASA facts shown to players**

- Uranus: 13 faint rings, 28 known moons, axial tilt 97.77°, magnetic axis tilted nearly 60° from the rotation axis, atmosphere mostly hydrogen and helium with methane that absorbs red light; Voyager 2 imaged it in 1986. https://science.nasa.gov/uranus/facts/
- Webb NIRCam image of Uranus: 12-minute exposure, two filters, 11 of 13 known rings visible. https://science.nasa.gov/missions/webb/nasas-webb-scores-another-ringed-world-with-new-image-of-uranus/
- Cassini Grand Finale (2017): 22 orbits that each passed between Saturn and its rings. https://science.nasa.gov/mission/cassini/grand-finale/overview/
- Juno: long looping orbits, first to fly over Jupiter's poles; magnetometer maps the magnetic field; microwave radiometer measures water and ammonia; launched 2011, in orbit 2016. https://science.nasa.gov/mission/juno/
- Uranus Orbiter and Probe: described in NASA NTRS 20240014560 as the National Academies' baseline for "the top flagship-class mission for NASA in the 2020-2030's". https://ntrs.nasa.gov/citations/20240014560
- Inverse-square law and space loss for radio signals. NASA Basics of Space Flight, ch. 6. https://science.nasa.gov/learn/basics-of-space-flight/chapter6-1/
- Meteoroid shower forecasts for spacecraft operators; mitigations include reorienting sensitive equipment away from the radiant, turning solar panels edge-on and closing optics shutters; showers are normally a few percent above the background. https://www.nasa.gov/meteoroid-environment-office/shower-meteoroid-environment/
- Webb micrometeoroid impact (23–25 May 2022); telescope still exceeds mission requirements. https://science.nasa.gov/blogs/webb/2022/06/08/webb-engineered-to-endure-micrometeoroid-impacts/
- Mission history notes (PR #48), each checked against its page: Skylab 2 repair spacewalk (1973), Gemini 8 (1966), Apollo 13 lifeboat (1970, https://www.nasa.gov/history/nasas-apollo-13-mission-challenged-crew-launch-team/), STS-61 (1993), Voyager 2 course correction (14 Feb 1989), New Horizons optical navigation, and the NASA/JPL profiles of Dr. Essam Heggy, Ahmed Soliman and Dr. Tahani Amer. Scientist notes are labelled **design inspiration**, not claims that they worked on this game. PR #48's flagged items (Europa Clipper, Mars Sample Return, current titles and awards) are not used.

**Process sources (how the game is structured)**

- Concept Maturity Levels 1–4 and the 80% checklist rule: Wessen et al., JPL (2013), `docs/resources/challenge-2026/files/cml-concept-maturity-levels.pdf`.
- Mission segments (launch, space, ground, user) and "begin with the end in mind": NASA, *Design and Develop Science Missions* (2025).
- Subsystem estimates of mass, power and data rate, and the Master Equipment List: NASA Goddard Mission Design Lab.
- Objective-driven instrument choice with incompatible options greyed out, and naming a similar real mission in the result: NASA Webb *Build It Yourself* game and its transcript.
- Ground stations for commanding and downlink: NASA CubeSat 101.

**Game rules (not NASA values)**

- Objectives' data needs (rings 6, atmosphere 8, moons 6, magnetic field 4), instrument match factors, orbit coverage and booster capacity factors, instrument mass/power/data rate/cost, recorder sizes, booster capacities (1,800 / 2,400 / 3,200 kg) and costs.
- The science pass is a timed scan mini-game at the start of leg 1 (22 s for the ring-plane and polar orbits, 26 s for the wide tour); data only flows while the circle stays on the target, and the route bar pauses meanwhile. Sending data adds 0.06 to the power draw and slows steering. Downlink rate is a base (0.012 standard, 0.04 high-gain units/s) times 1/d² with d capped at 0.25 of the route; data still aboard at landing counts half; each absorbed hit corrupts one stored unit; a ring-plane pass spawns ring particles more often.
- Score: 40 return, 30 science delivered against the requirement, 15 efficiency (mass margin, funds left, no brownout), 15 decisions (plan passed first time, no deadlocked vote, no repeated failure).
- Journey loop: stars (10/9/8 at the start by level; 3/2/1 per leg for losing up to 20% / 45% / more of the hull), star upgrades at the Moon base (armor plate, extra tank, turbo engine, rock radar, 2 stars each), trade, the 65% damage retry threshold, the leg-2 shower window and its strength, and the in-flight moments (dark stretch: save or full power; big rock: burn, brace or steer; shower: wait, turn the shield or fly through) with their effects. Low power saves battery and cuts steering to 80%.
- Launching from the Uranus platform, the lunar checkpoint station and Dr. Vega are fiction.

## Game-rule disclosure

All numeric scores, resource targets, component costs, difficulty thresholds, hazard rates and outcome checks in the game are **simplified educational game rules**, not NASA specifications, validated spacecraft design calculations, or mission predictions. They are deterministic for a fixed selected configuration and difficulty. Real mission values must not be inferred from them. Uranus' walkable surface and Foodimal hazards are fictional gameplay elements.

The route bar is not a distance in AU. Sunlight stays at the Uranus/Earth ratio of 0.0027 until 30% of that bar remains, then blends toward Earth’s value. That knee and blend are a game rule. So are the ship’s power load, the battery drain, the RTG’s unitless output of 1, the RTG’s extra mass of 2, maneuver fuel, hull loss, and the oxygen stabilize amount (health 40). Far from the Sun, the solar choice cannot run the ship by itself. The shield parts a player collects matter in the surface wind. The shield installed on the ship matters when a meteoroid hits. An antenna does not slow meteoroids. Empty maneuver fuel stops steering and does not slow the trip.

Also game rules: a damaged RTG gives 40% of its output; damaged life support uses 1 oxygen every 10 seconds, then 5 hull every 10 seconds once oxygen runs out; landing on the Moon costs 1 maneuver fuel; a downed Flint can be carried back to the crash site at health 30. The repair panels' faults and gauge readings are fiction, and their costs (a 10-point shock, 1 fuel, 1 oxygen) are game rules. Reading instruments to find a fault before fixing it is general engineering practice, not a NASA claim.

## Asset provenance

**Hero and Steve (2026-11-13).** `assets/characters/character_reference_mixamo_rigged.fbx` (the earlier hero mesh) and `assets/characters/monkey_mixamo_rigged.fbx` (Steve) are copies of the team-supplied files in `design/characters/`. Their mesh names suggest they were generated with Tripo; they are rigged on the Mixamo skeleton and carry no animation clips, so the game poses them in code. Who made them and under what licence still needs to be confirmed by the person who added them. Steve and Flint are characters from Sony Pictures Animation’s *Cloudy with a Chance of Meatballs*. The FBX loader comes from the same Three.js r187 release as the rest of `vendor/three`.

**Crew models (2026-11-13).** The player walks `assets/characters/Main_character_final.fbx`. Extra players add, in order, `ChatGPT_Image_girl_with_ponytail_rigged.fbx`, `scientist_character_mixamo_rigged.fbx`, and `game_explorer_character_mixamo_game.fbx`. Four players are those four people. Steve the monkey follows beside the party and is not counted as a player. All four human files are Mixamo rigs with no animation clips, posed by the same code as Steve. Who made them and under what licence still needs to be confirmed by the person who added them. The ponytail filename includes “ChatGPT_Image”; that is the file name as supplied, not a claim about the tool or the licence.

**Spaceship progression models (2026-11-13).** `assets/spaceships/basic_ship.glb`, `first_upgrade_blue.glb`, `first_upgrade_white.glb`, and `second_upgrade_white.glb` are team-supplied local files. Their embedded generator metadata identifies three as Tripo exports and one as a Blender glTF export. The basic model represents the damaged/unupgraded craft; the blue and white intermediate models represent the solar-battery and RTG builds; the second white model represents a Moon-upgraded/refitted craft. Authorship and redistribution licence still need confirmation from the teammate who supplied them. The custom Three.js spacecraft remains the loading/error fallback.

**Sound effects (2026-11-14).** `assets/audio/sfx-hit.mp3` plays when something hurts the player or a space rock strikes the ship; `assets/audio/sfx-kill.wav` plays when a Space/ATTACK pulse knocks out Foodimals. Both are team-supplied files. The hit sound was supplied as `universfield-punch-impact-hit-567196.mp3`, a name in the style of a Pixabay download by the creator Universfield; the kill sound was supplied as `kill_short_v2.wav`. Source and licence for both still need confirmation from the teammate who added them.

**Opening films (2026-11-14).** `assets/video/opening-1.mp4` (10 s, 1280×720) and `assets/video/opening-2.mp4` (12 s) play full screen, in that order, after Play and before the story slides; Skip or Escape ends them. Both are team-supplied files: the first was supplied as `magnific_169-stylized-3d-opening-cutscene_eIOtBmkdqL (1).mp4`, a name in the style of a Magnific AI video export; the second as `video6033063921294777430.mp4`. Who made them and under what terms still need confirmation from the teammate who added them.

**Scientist portraits (2026-11-14).** `assets/ui/scientists/soliman.png`, `heggy.png`, `amer.png` and `elbaz.png` show Ahmed Soliman, Dr. Essam Heggy, Dr. Tahani Amer and Dr. Farouk El-Baz on their Research Archive cards and at the top of their info windows. They are photographs of real people, team-supplied as `prompt_images/ahmed_soliman.png`, `essam_hajji.png`, `dr_tahany.png` and `farouk_el_baz.png` and matched to each scientist by those file names (the team confirmed `essam_hajji.png` is Dr. Essam Heggy). `heggy.png` and `soliman.png` are square head-and-shoulders crops of the supplied photos; the other two are unchanged copies. Who took each photo and whether it may be redistributed still need confirmation from the teammate who added them; replace any photo that cannot be cleared with a NASA public-domain portrait or the initials badge.
NASA links above are reference/learning sources, not claims that NASA endorses the game.
