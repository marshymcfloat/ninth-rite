# THE NINTH RITE · game scene v0.6

The interface now follows the composition of the supplied slot references while retaining the existing realistic gothic cathedral, priest, ritual seal and symbol artwork.

## Presentation

- The cathedral fills the game viewport. Desktop uses a fitted 16:9 scene, with a separate composition for short landscape screens and portrait devices.
- A larger central 6×5 board sits inside an iron and aged-gold architectural frame. Thin reel dividers replace the individual symbol cards. The frame uses editable SVG geometry, with no additional image generation.
- The title sits to the left; the priest and ritual seal sit to the right. Blood drops, Offering sigils, charge counts, current altar, next altar and step remain visible.
- A compact bottom control bar holds rite selection, play balance, round win, base bet, a circular spin button, fast playback and sound. Desktop bet steppers and a fullscreen button are included.
- The control bar is centered in the scene. Its desktop and landscape controls share one vertical center, with centered labels and values. The portrait layout centers each group within its row and the spin button across both rows.
- The game menu holds rules, settings, history, replay, round download and the scripted prototype demonstrations. Demonstrations and replay close the menu before playback.
- Cascade history retains the multiplier that paid the current cascade; it is available under Round history. The altar shows the committed next state.
- Heavy falls, firm landings, blood dissolves, liquid streams and priest pose changes are retained. Reduced motion, skip and the basic graphics fallback remain available.

## Integrity

No changes to `engine.mjs`, `config.mjs`, `scenarios.mjs`, the API/ledger implementation or the source PNGs. All seven fixed-seed mode books and all eight scripted scenario books still match the pre-Pixi baseline byte for byte. No AI generations or credits were used for v0.6.

Verification is recorded in `NINTH_RITE_PROTOTYPE_VERIFICATION.md`. This remains a local play-credit prototype with unvalidated math and draft art/audio.
