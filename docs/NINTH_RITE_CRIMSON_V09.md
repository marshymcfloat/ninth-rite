# Crimson Cathedral implementation · v0.9

Implemented 22 October 2026 against GDD v1.4. Presentation-only changes; the game engine, configuration, scenarios, server settlement and outcome identifiers remain unchanged.

## Installed

- Higgsfield Soul 2.0 artwork: four ivory/gold/ruby card ranks, four contrasting relics, horned entity scatter, gold/skull/candle frame, standing and invocation priest poses, gold/ruby seal and a brighter cathedral.
- Transparent runtime atlases with normalized visible bounds. Ranks occupy less of each cell than premium symbols. The source generations remain untouched. The first environment draft was rejected for a divided composition and unwanted lettering.
- Compact title, dominant board and a separate ritual area. Crimson control bar and Spin button. Portrait layout places the ritual above the grid. Decorative frame sections sit outside the symbol playfield.
- Plum reel bed; localized candlelight, shafts, haze and sparse ember sprites. The priest stays in front of the seal. Blood and Offering counts remain explicit, including banked and sealed states.
- Firm weighted landings without bounce, bright cluster edges, wet dissolution, cluster-directed blood streams, separate gold Offering filaments, tier illumination and an entity reveal during intervention.
- One mute control with immediate sound cancellation on mute, skip or hidden tab. Reduced motion suppresses ambient motion and travel effects. Existing HTML/SVG fallback and replay remain available.

## Generation record

Used the authenticated Higgsfield website in Brave, model Soul 2.0, 2K, one image per request. Nine attempts: eight successful generations, one copyright-filter rejection with refund. Seven selected source images plus one unused environment draft. Free allowance observed before/after: 2,989 / 2,981. No paid generation credits used for this revision.

`prototype/art/crimson-v09/provenance.json` records source URLs, dimensions, SHA-256 hashes and briefs. Runtime PNG/WebP files are under `prototype/public/assets/crimson-*`. Technical preparation removes black backgrounds, feathers boundaries, crops individual poses and packs atlases. It does not change gameplay identifiers.

## Validation

- 32 automated engine, mapping and HTTP tests pass, including byte-identical engine baseline and all recorded scenario outcomes.
- Browser checks cover real symbol motion, exact skip settlement, resize during playback, reduced motion, replay without charges, context-loss fallback and restored WebGL on reload.
- Composition checks cover 1920×1080, 1440×900, 1208×676, 1024×768, 768×1024, 390×844, 320×740, 844×390 and 740×400.
- Full scenario, missing-atlas and interrupted-request recovery checks are recorded with the final validation output.

## Remaining production work

- The priest uses two flat image poses with subtle motion, not separately rigged hands, sleeves or facial animation.
- Final composed ambience, choir and recorded sound effects are not included; current cues are synthesized.
- Frame and material detail need art review at actual device sizes. The supplied images are a coherent prototype pass, not final production approval.
- Physical-phone performance profiling, a measured low-effects profile and final accessibility contrast audit remain. Headless browser checks do not establish device frame-rate performance.
- Test math remains unvalidated. This update makes no payout, RTP, popularity or production-readiness claim.
