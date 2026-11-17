# THE NINTH RITE — visual redesign plan

Prepared 22 October 2026 (Asia/Manila). Research session began 21 October.
Status: presentation plan; no game implementation changed.

## Decision

Crimson Cathedral, desktop first, selected by the user. Build sculpted, stylized dark fantasy with rich materials and readable gameplay. Preserve the priest, Hollow Halo, ritual concept, and GDD v1.4 mechanics. Replace the existing visual treatment rather than adding effects to inconsistent draft assets.

## Research and its limits

Read the first 32 cards in the user's Brave Stake Slots catalog with Popular selected. Counts below are the site's displayed concurrent “playing” labels at that initial observation, not independently verified audience data. The order is the catalog order, not a player-count ranking. It does not establish lifetime popularity or prove that visual design caused popularity.

Source: https://stake.ac/casino/group/slots

| Catalog position | Slot | Displayed playing |
|---|---|---:|
| 1 | Candy Swipe MatchWin | 269 |
| 2 | Gates of Olympus 2500 | 365 |
| 3 | Gates of Olympus Super Scatter | 484 |
| 4 | Immortal | 239 |
| 5 | Gates of Olympus 1000 | 397 |
| 6 | Sweet Bonanza 1000 | 350 |
| 7 | Big Bass Halloween Splash 1000 | 369 |
| 8 | Sugar Rush 1000 | 377 |
| 9 | Le Outlaw | 193 |
| 10 | Waylanders Forge | 399 |
| 11 | Conductor of Death | 163 |
| 12 | Le Vampire | 150 |
| 13 | Odin's Vault | 191 |
| 14 | Sharks! | 58 |
| 15 | Wanted Dead or a Wild | 170 |
| 16 | Big Bass Vegas 1000 | 121 |
| 17 | Big Bass Rock and Roll | 231 |
| 18 | Moonlight Princess | 200 |
| 19 | Wheel of Thunder | 33 |
| 20 | Ganja Snail | 165 |
| 21 | Bank Basher 2 Vegas | 82 |
| 22 | Ra vs Osiris: Eternity | 55 |
| 23 | Liliths Curse | 111 |
| 24 | Le Bandit | 148 |
| 25 | Dork Show | 61 |
| 26 | Sweet Bonanza 2500 | 107 |
| 27 | The Last Harvest | 37 |
| 28 | Ghost Rush | 96 |
| 29 | 5 Lions Megaways 2 | 116 |
| 30 | The Jade Path Hold & Win | 36 |
| 31 | Duck Hunters 2 | 106 |
| 32 | Duck Hunters | 104 |

Evidence actually inspected:

- Gates of Olympus Super Scatter: live Fun Play introduction and settled gameplay screen. Dark burgundy reel bed, distinct jewel silhouettes, broad gold/specular highlights, minimal frame obstruction, compact bottom controls, character beside the board. Intro slides show strong cyan winning-cell outlines. This was not a complete bonus-animation or audio audit.
- Immortal: live introduction and architectural background; the free-play frame then crashed. Use the user's previously supplied gameplay screenshot for board/symbol comparison, explicitly not as newly observed live gameplay.
- Sugar Rush 1000: live listing/detail page; this session's Fun Play launch stayed blank. Gameplay observations come from the user's supplied screenshot: glossy broad surfaces, multiple shape/color cues, dominant grid, compact controls.
- Waylanders Forge: listing/detail page confirmed; initial page error and blank demo prevented gameplay assessment. Do not infer its motion quality from its thumbnail.
- Lazy Vampire, Fiendish Friends, and Le Catcher: user's supplied screenshots support composition and silhouette comparisons, not present-session motion measurements.

Reference pages:
- https://stake.ac/casino/games/pragmatic-play-gates-of-olympus-super-scatter
- https://stake.ac/casino/games/terminal-immortal
- https://stake.ac/casino/games/pragmatic-play-sugar-rush-1000
- https://stake.ac/casino/games/valkyrie-waylanders-forge
- Official Gates information: https://www.pragmaticplay.com/en/games/gates-of-olympus-super-scatter/

## Diagnosis of v0.8

1. Bright oversized silver letters overpower small premium objects inside matte disks. Value hierarchy is reversed.
2. Cathedral, frame, and relics all carry fine dark texture. Their tonal ranges overlap, weakening depth and silhouettes.
3. Photographic background, grainy cutouts, metallic letters, and outlined meter icons do not share one lighting/material system.
4. Repeated frame strips and separate candles look assembled; adding more ornament will increase clutter.
5. The Scatter's central hole and narrow spikes read as an ornament rather than a powerful entity.
6. A large left title, board, and separate right ritual display divide the screen into competing panels.
7. Existing motion is present but has little ambient visibility and insufficient contrast between small events and interventions. Current idle code mainly moves the priest by a fraction of a pixel and rotates subtle meter sheens.
8. Black-matte screen compositing is a workaround that compromises reliable dark edges and material shading. New assets need clean alpha.

## Visual specification

### Composition

- Design against a 1600×900 landscape stage. Preserve the actual 6×5 board and its cell geometry; scale it uniformly.
- Target board height 78–80% of the stage and width approximately 55–57%, positioned slightly left of center. Keep frame ornament outside playable cells.
- Move the title into a compact crest above the grid. Remove the tall left brand column and tagline from active play.
- Put priest and Halo together in the right quarter. The priest stands in front of the Halo's lower portion, with feet anchored to a pedestal. Keep the top and sides of the meter unobstructed.
- Attach an approximately 80px-high control strip beneath the play area: menu/rite, balance, round win, bet, prominent Spin, speed and sound. Align all labels, values, and control centers consistently. Minimum 44px touch targets.
- At portrait widths, use a compact title, a horizontal ritual status strip, full-width grid, then controls. Keep a cropped priest/halo illustration behind the status strip rather than allocating a full character panel above the board.
- Keep critical numbers as real text. Use a restrained engraved display face for title/headlines and a readable sans serif with tabular numerals for controls.

### Color and lighting

- Reel bed: deep plum/ink, around #241621, with a subtle central lift, rather than nearly black green.
- Environment: desaturated blue-violet stone, softened detail behind symbols, warm candle pools and readable stained-glass light.
- Primary materials: ruby #B9163C with bright #FF5B72 reflections; gold #D8AA52 with pale #FFF0C2 highlights; bone #E7DCC3. Use emerald and amethyst selectively to distinguish relics.
- Keep blood red, Offerings gold, and the entity's inner light pale ivory. Do not communicate meter state through color alone.
- Brightest areas belong to symbols, current rewards, and active ritual channels. Background detail stays subordinate. Bloom is localized, never a blanket screen haze.

### Asset production

Produce one coherent style reference and contact sheet before the full batch. AI generation through the user's preferred Higgsfield Soul 2.0 website workflow; recheck available allowance before generation and record provenance. No paid subscription purchase is part of this plan.

| Asset | Required treatment |
|---|---|
| J/Q/K/A | Four sculpted enamel/stone letters; clear, distinct silhouettes, restrained metal edges; visually smaller and less luminous than premiums |
| Blood chalice | Large bowl and stem, polished gold rim, visible glossy crimson liquid |
| Horned crown | Broad crown silhouette with one clear central ruby and ivory horn accents |
| Bound eye | Large readable supernatural eye in a sculpted amulet; emerald accent; avoid tiny grainy iris detail |
| Reliquary | Recognizable shrine silhouette with amethyst glass and an illuminated core |
| Scatter | Horned faceless entity bust rising from a broken halo, pale inner light and ruby rim; clear SCATTER text rendered separately |
| Frame | Purpose-designed corner, side, crest, and base components; carved bone/stone, controlled gilding, two candle groups; no stretched texture strips |
| Priest | Separate body, sleeves/hands, robe foreground, and emissive details for restrained animation; standing and invocation compositions |
| Halo | Separate stone base, blood channels, Offering sockets, inner entity reveal, and emissive masks |
| Environment | Background architecture, foreground pillars/candles, light shafts, and haze as separate layers |

- Source symbols at 1024px square with safe margins; final runtime symbols 512px or smaller as testing permits. Normalize visible object bounds, not merely image canvas dimensions.
- Export clean alpha PNG/WebP and pack runtime atlases no larger than 2048px per side. Normal alpha blending for opaque art; additive/screen only for emitted light.
- Test each symbol at 48, 80, and 128px against the actual reel bed. Reject halos, muddy silhouettes, inconsistent perspective, and tiny ornamental detail before integration.
- Premiums should occupy approximately 80–88% of their cell's useful height; ranks 65–72%. Scatter must remain identifiable without its caption.
- Keep source generations, selected exports, masks, and atlas metadata separate. Do not reuse competitors' artwork.

## Motion and feedback

These are proposed starting timings, not timings measured from competitor games. Tune using recorded prototype scenarios.

| State | Treatment |
|---|---|
| Idle | Slow light shafts, localized candle flicker, sparse ash, slight robe/sleeve movement, occasional blood-surface reflection; no constant symbol pulsing |
| Initial drop | Approximately 350–450ms weighted arrival with 20–30ms column stagger; short directional blur; decisive stop without bounce or squash |
| Winning cluster | Approximately 180–250ms edge illumination and readable payout; briefly reduce competing visual detail |
| Blood conversion | Approximately 450–650ms material dissolution into glossy liquid; preserve dark red body and sharp moving highlights |
| Collection | Approximately 550–800ms guided streams with overlapping travel; visually group particles by cluster so one cluster still means one blood charge |
| Refill | Approximately 200–320ms distance-aware fall; no unnecessary full-board reset |
| Tier increase | Approximately 600–900ms liquid surge, gold/ivory ring sweep, legible old-to-new multiplier transition |
| Intervention | Approximately 1.5–2s distinct sequence: light draws inward, priest gestures, entity silhouette appears, new multiplier stamps in, scene settles |
| Feature entry | Brief scene transition to richer crimson stained-glass illumination and visibly enabled Offering channels |
| Round result | Count only the actual recorded award; large overlays reserved for meaningful win tiers, always skippable |

- Meter labels remain explicit: Blood n/3, Offerings n/3, current multiplier, next multiplier. Show Bonus only for inactive Offerings. Preserve banked progress and cap/sealed behavior.
- Add separate visual tracks for ambient motion and event playback. Pause ambient rendering when hidden; cancel all active effects safely on skip, reload, and context loss.
- Reduced motion uses brief fades and immediate numeric state updates, without camera movement, flashing, or travel effects. Fast mode shortens animation without dropping or duplicating events.
- Audio pass follows the animation slice: weighted landing, restrained metal resonance, liquid collection, tier bell, intervention choir/impact, and a low cathedral ambience. One mute control; no unsolicited autoplay audio. Avoid stacked repetitive impact sounds during dense cascades.

## Implementation boundaries

- Keep vanilla HTML/CSS, PixiJS, GSAP, existing engine, and deterministic event books. No framework migration.
- Change scene composition, texture/manifest metadata, display styles, shaders, and presentation timelines only.
- Preserve C1–C4/P1–P4/S identifiers and all probabilities, payout tables, cluster rules, tier timing, intervention timing, bonus entry, and ledger behavior.
- Extend the art manifest for frame rectangles, anchors, layers, and emissive masks; preserve legacy fallback support. No public game API changes or database migrations.
- Retain working DOM fallback, accessible controls/readouts, replay, sound/fast/reduced-motion settings, and loading/error recovery.

## Delivery order and acceptance

1. Create one full landscape composition and a portrait companion, plus a nine-symbol contact sheet. Compare at actual embedded-game size, not only full resolution. Review this concrete direction before bulk asset production.
2. Build a short deterministic animated slice: drop → cluster → blood transfer → meter fill → tier increase; include one separate intervention clip. Use enough finished art to judge material quality rather than animating every placeholder.
3. Produce remaining approved assets, integrate layout, all event states, and synchronized audio; replace draft frame/symbols rather than stacking new decoration on them.
4. Verify existing deterministic regression tests and all eight scenario books. Replay, skip, fast, reduced motion, missing assets, tab visibility, and WebGL loss must end in the same recorded state and balance.
5. Check 1920×1080, 1440×900, 1208×676, 1024×768, 390×844, 320×740, and 844×390. No grid/control overlap, clipped counts, or inaccessible Spin. Essential text contrast at least 4.5:1; distinguish symbols and charges without relying solely on hue.
6. Profile on the user's browser and a representative phone. Target stable 60fps desktop; provide a lower-effects profile for slower hardware. Cap resolution, pool particles, limit bloom to local containers, and lazy-load feature-only assets. Measure results before claiming performance.

Done means the idle screen already looks coherent and legible, every symbol reads at phone size, the ritual visibly explains progression, and movement has distinct event intensity without changing the math. Popularity and player returns are not acceptance claims.
