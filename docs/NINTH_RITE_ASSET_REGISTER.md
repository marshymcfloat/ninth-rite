# Asset and license register — 23 October 2026

## Artwork

The active Crimson Cathedral set and seven rite illustrations were generated through the user's Higgsfield website account with Soul 2.0. Generation records, source URLs, prompts or briefs, source hashes and preparation history are preserved in:

- `prototype/art/crimson-v09/provenance.json`
- `prototype/art/rite-illustrations/prompts.json`
- `prototype/art/rite-illustrations/prepared.json`

The release builder includes only the active artwork named by the manifest plus seven rite illustrations. Historical experiments remain in the source workspace and are excluded from the final frontend package. Marketing inputs reuse the cathedral and entity scatter; no additional generation credits were spent for the submission references.

Higgsfield's current Section 4.4 permits commercial use of generated outputs and does not claim ownership of them. It does not guarantee uniqueness or third-party clearance. The project's generation records establish provenance; final review of references, branding and possible third-party resemblance remains required. [Official terms](https://higgsfield.ai/terms-of-use-agreement), [commercial-use explanation](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially).

No Stake branding or supplied reference-game screenshots are packaged as game artwork. The entity, architecture and occult imagery still need Studio's content and visual-quality review.

## Fonts

Libre Baskerville variable and Inter variable are packaged locally, with their SIL Open Font License texts. Browser layout no longer depends on downloading a font from another domain. Sources are the official Google Fonts repository: [Libre Baskerville](https://github.com/google/fonts/tree/main/ofl/librebaskerville), [Inter](https://github.com/google/fonts/tree/main/ofl/inter). Files are unchanged; CSS family aliases do not modify the font binaries. Package hashes are in `build-manifest.json`.

## Libraries

- PixiJS 8.22.0 and its CSP addon: local scripts, MIT license included.
- GSAP 3.15.0: local script and copyright/standard-license notice included. The public standard-license page redirected to an offline page during this check; retain this as a final license-review item rather than assuming a different license.
- Exact versions, package sources and hashes: `prototype/public/vendor/versions.json`.

## Audio

Current sound is synthesized locally by the project's Web Audio code; there are no third-party audio recordings in the release. These cues remain a prototype audio treatment. Final audio quality, levels and physical-device playback require review before a 3-star presentation claim.

## Marketing

`release/ninth-rite-submission-kit/marketing/` contains background/transparent foreground inputs, font license, hashes, editable layout references and 408×546 / 640×360 previews. Current requirements require recreating/saving both formats in Studio's Media Editor. No Studio upload or publication was performed. [Tile requirements](https://stake-engine.com/docs/approval-guidelines/game-tile-requirements).
