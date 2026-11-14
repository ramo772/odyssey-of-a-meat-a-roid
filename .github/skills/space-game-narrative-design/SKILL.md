---
name: space-game-narrative-design
description: Design space-game protagonists, supporting casts, mission briefings, station beats, cutscenes, and state-reactive story arcs around an existing gameplay loop. Use for narrative structure and character voice; do not treat fiction as scientific evidence or authorize unapproved gameplay features.
---

# Space Game Narrative Design

Make the story explain and intensify what the player does. Begin with the approved gameplay loop and product scope; do not design a separate plot that merely plays between mechanics.

## Narrative foundation

Define these before writing scenes:

- player identity and point of view;
- immediate goal, emotional need, and final arrival condition;
- opposing force or recurring pressure;
- supporting characters, what each wants, and how each changes player decisions;
- the state that carries between stops, including condition, resources, relationships, knowledge, and consequential choices.

Mark unresolved product choices as proposals. Never turn a draft premise, reference image, transcript opinion, or scientific source into approved canon.

## Beat workflow

1. Map the playable journey as stops and legs. For each stop, identify incoming state, new information, preparation decision, conflict, outgoing consequence, and the next open question.
2. Give every briefing a player-facing purpose: reveal a risk, clarify a goal, introduce a trade-off, or react to prior state while the player can still act on it.
3. Assign each supporting character a functional role in the journey—mentor, operator, rival, dependent, witness, or antagonist—and a distinct vocabulary, rhythm, knowledge boundary, and emotional pressure.
4. Write cutscenes only for changes the player cannot understand better through play. State the scene's purpose, entry condition, maximum duration, required assets, skippability, and resulting state.
5. Model branching economically. Prefer meaningful local variation and state-reactive lines over uncontrolled branch multiplication; record flags and merge points explicitly.
6. Separate four layers in every beat: verified evidence, simulation assumption, gameplay rule, and fiction. Cite original authoritative sources for real scientific claims.
7. Hand implementation a data-ready outline: stable beat or line IDs, speakers, conditions, variable reads/writes, choices, commands, and localization notes.

## Quality gates

- The protagonist owns the goal and makes consequential decisions.
- Supporting characters change, clarify, or challenge decisions rather than only explaining lore.
- Dialogue reacts to relevant carried state without contradicting gameplay results.
- Briefings arrive before commitment, and consequences appear after resolution.
- Exposition is optional when it is not needed for the next decision.
- Character voice remains distinguishable without relying on names or portraits.
- Scientific claims are sourced; fiction and balancing are labeled as such.
- Every branch reaches a valid continuation, merge, ending, or explicit failure state.

## Deliverable

Produce a journey beat map, character-role and voice sheet, briefing/cutscene list, narrative-state variables, branching outline, and open decisions. Do not write application code or lock unapproved canon unless the request explicitly includes that work.
