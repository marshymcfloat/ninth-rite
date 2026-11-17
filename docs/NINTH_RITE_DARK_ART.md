# THE NINTH RITE — dark art revision v0.8

Implemented 21 October 2026. Game design remains GDD v1.4.

The earlier bright medallion sheet was rejected by the user and is not loaded by the game. The new set uses carved silver card ranks, tarnished relics, bone, scorched metal and muted mineral colors. The Scatter is a horned, faceless devotional idol with a black circular void and crimson inner rim, connecting it visually to the priest's Hollow Halo.

## Selected source files

| File in prototype/public/assets | Native dimensions | Display use |
|---|---|---|
| card-ranks-v1.png | 2048×2048 RGB | 2×2: C1 Jack, C2 Queen, C3 King, C4 Ace |
| relic-symbols-v2.png | 2048×2048 RGB | 2×2: P1 blood chalice, P2 horned crown, P3 bound eye, P4 cathedral reliquary |
| hollow-entity-scatter.png | 2048×2048 RGB | S, a standalone horned idol; SCATTER caption drawn separately |
| demonic-frame-v2.png | 2048×1536 RGB | Skull crest, engraved stone, crimson gems, bone and candle decoration |

All four were generated through Higgsfield's Soul 2.0 website using its free allowance. Six submissions in this pass included two unused drafts: the frame with a portrait opening and the rejected bright sheet. The displayed free allowance changed from 2,995 to 2,989. No paid generation or paid animation/audio was submitted. Native PNG pixels are preserved; source URLs, hashes and generation settings are in prototype/art/dark-art-v08-generations.json. Exact selected prompts are in dark-art-v08-prompts.json.

## Integration

- Original IDs C1–C4, P1–P4 and S, probabilities, paytable values and event books remain unchanged. Friendly symbol names changed only in the frontend.
- A shared display mapping selects the correct rank/relic/scatter source cell in Pixi and the native fallback. The Scatter remains one non-paying cell and uses the same trigger thresholds.
- New PNGs have RGB black mattes. Screen compositing removes the black on the dark board. The blood shader excludes matte pixels before dissolving; it does not turn an entire rectangular cell into blood.
- The source frame is rendered as border segments. Edge textures repeat rather than stretch; the central skull is preserved and candle pieces sit below the symbol window. Borders and candles never cover a symbol cell. Candles in this asset are still images.
- Original cathedral, priest, seal, source symbol sheet and all game/settlement code are retained. Missing sheets use the basic renderer with available art plus vector fallbacks; missing frame restores the previous SVG border.
- Heavy falls, blood streams, Offering marks, reduced motion, meter progression and foreground priest placement remain event-driven animations.

## Verification

32 Node tests pass, including byte-for-byte outcome/API parity, all seven fixed-seed modes, all eight scripted books, and distinct in-bounds cells for all nine display IDs. Browser checks cover accelerated display, missing-image fallback/recovery, priest poses, unchanged balances/payouts, nine viewport shapes and the existing animation/replay/context-loss flows. Details of the final browser verification are in NINTH_RITE_PROTOTYPE_VERIFICATION.md.
