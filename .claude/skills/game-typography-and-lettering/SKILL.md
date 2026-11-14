---
name: game-typography-and-lettering
description: Design and validate typography, custom lettering, subtitles, numerical displays, and text hierarchy for games. Use for font selection, title treatments, HUD text, dialogue readability, localization, or in-world signage; do not use it to rewrite narrative content.
---

# Game Typography and Lettering

Create a coherent text system that is distinctive where identity matters and effortless to read where play depends on it. Follow the project's approved identity, tokens, target platforms, and accessibility requirements before proposing changes.

## Separate the jobs

- **Typography:** reusable fonts and rules for menus, HUDs, dialogue, briefings, data, and subtitles.
- **Lettering:** custom-drawn title marks, emblems, decals, chapter cards, and environmental signs.
- **Narrative copy:** wording and character voice; route that work to the project's narrative workflow.

Do not use decorative lettering for body text or controls. Do not add a font merely because it looks futuristic. Every type choice must serve a named role and remain licensed for the intended distribution.

## Workflow

1. Inventory every text context, target viewport, input method, supported language, and longest likely string. Inspect existing tokens and fonts before proposing replacements.
2. Define the minimum set of roles: display/title, interface/body, dialogue/subtitle, and data/numerals. A single family may cover several roles.
3. Specify a type scale, weights, line heights, tracking, casing, paragraph width, alignment, and fallback stack. Use tabular numerals for changing values when available.
4. Define semantic color and emphasis rules from existing design tokens. Never rely on color, glow, capitalization, or font weight alone to communicate state.
5. Keep screen UI as accessible text when the runtime permits. Use textures, meshes, SDF/MSDF text, or baked lettering for world-space text only when the visual or performance need justifies it.
6. Treat a title mark or emblem as an asset family: approve one master, document clear space and minimum size, and derive controlled variants rather than redrawing it per screen.
7. Record font source, license, allowed embedding, required attribution, files, subsets, and fallbacks. Do not ship an unverified font or copy a protected logo treatment.
8. Validate representative screens with real content, extreme values, localization expansion, and the smallest supported viewport.

## Accessibility and localization gates

- Body, dialogue, controls, and subtitles remain readable without glow or motion.
- Focus, disabled, warning, selected, and unaffordable states are distinguishable beyond typography alone.
- Text does not clip at 200% UI scaling or with long localized strings.
- Subtitles support a readable background, speaker identification, and adjustable size where required.
- If an RTL language is supported, test direction, mixed numbers, punctuation, icon placement, and font coverage in the real runtime.
- Motion respects reduced-motion settings and never delays access to essential information.

## Deliverable

Produce a concise typography specification containing roles, approved families and licenses, scale and spacing rules, numerical behavior, localization fallbacks, lettering assets, responsive behavior, and screenshots or test evidence. Mark exploratory choices as proposals until the design owner approves them.
