# THE NINTH RITE — gameplay prototype

Source design: `../docs/THE_NINTH_RITE_GAME_DESIGN_v1.6.md`.

Run `Start-Prototype.cmd` in the project root and open the local URL it prints.
Keep its terminal running. Node.js 22 or newer and the verified v1.9 catalog in `../work/ninth-math-v19.1/` are required.

## Play

- Start with 10,000 play credits. Choose a base bet and rite, then press the circular **SPIN** button or Space.
- Seven playable modes: Standard, both ante modes, Lesser, Blood, Greater, and God.
- The whole result is calculated on the local server before playback. The browser renders the recorded events.
- Fast, skip playback, reduced motion, optional synthesized sounds, rules, test paytable, and round replay are included.
- The bottom-left **Game menu** holds rules, settings, history, replay and **Explore the prototype**, which contains eleven scripted demonstrations. These do not change your balance.
- **Download round record** saves the complete JSON event book for inspection.
- Refresh recovers the latest server-settled round. Network retries reuse a request ID to prevent duplicate charges.
- Settings can start a fresh sandbox. Server restart expires in-memory sessions and balances.

## Historical presentation notes

The following notes describe earlier prototype iterations. The current game uses the engraved presentation served at `/`.

### Crimson Cathedral · v0.11

Bonus entries, purchased rites, retriggers and round returns now have animated ceremony overlays: opening gates, a gold halo, staged text, win count-ups and Continue. Skip remaining playback is inside every overlay. Symbols, charge readouts, the priest and controls have additional restrained reactions. Reduced motion and refresh recovery retain static/instant behavior. See `../docs/NINTH_RITE_CEREMONIES.md` for event mapping and checks. This pass reuses existing artwork and consumes no generation credits.

Purchased bonuses first tumble in their entry scatters: Lesser 3, Blood 4, Greater 5. God Mode presents one enlarged entity scatter before its guaranteed intervention. This non-paying entrance uses no free spins and does not alter the recorded bonus boards or payout.

The rite selector opens a dedicated illustrated overlay. Four bonus cards show starting spins/altar and exact cost; Base & chance has its own tab. Card selection previews the feature, and the explicit Select button applies it to the next spin without spending credits. The shared base bet updates every price. Mystery stays unavailable. Native dialog focus, Escape cancellation, keyboard tabs and phone scrolling are supported. Each of the seven playable rites now has its own narrative illustration generated through Higgsfield Soul 2.0. This illustration pass used ten free generations, including three rejected drafts (2,981 → 2,971); no paid credits.

The current presentation uses a compact title above the board, brighter ivory/gold ranks, jewel-colored relics, a horned entity scatter, an ornate skull-and-candle frame, and a crimson/ivory priest in front of a new gold seal. The cathedral is brighter with a plum reel bed, warm light shafts, candlelight, drifting haze and sparse embers. Desktop and portrait layouts keep the board, ritual counts and controls separate.

Weighted falls, cluster edge lighting, glossy blood dissolution, streams aimed at individual charge sockets, tier illumination and an entity apparition follow the existing recorded events. Muting or skipping stops active synthesized sounds. Reduced motion disables ambient travel and event motion. The game engine, probabilities, payouts and settlement are unchanged.

New artwork was generated through the user's Higgsfield Soul 2.0 website session. Eight free generations were consumed, including one rejected environment draft; a separate blocked ring attempt was refunded. Observed free allowance: 2,989 → 2,981. No paid generation credits were used for this pass. Production notes: `../docs/NINTH_RITE_CRIMSON_V09.md`.

This remains an art prototype: the priest has two illustrated poses with restrained motion, not a skeletal rig. Sound cues are synthesized placeholders; final music, choir and recorded effects are pending. Historical revision notes follow.

## Cinematic art draft

The first Higgsfield art pass is installed: eight ordinary symbol candidates, a distinct scatter, a ruined cathedral background, and standing/kneeling priest poses. The user selected realistic cinematic rendering. The source SVGs remain as loading fallbacks. All controls, meters, Halo geometry and payout values remain drawn by code.

## PixiJS ritual presentation · v0.4

PixiJS 8.22.0 renders the symbols, priest poses, enlarged occult seal and liquid effects in one WebGL canvas. GSAP 3.15.0 sequences accelerating falls with firm stops, survivor tumbles, restrained crimson highlights, wet shader dissolves, blood streams and inward invocation effects. There is no bounce, overshoot, squash or win scale pulse. The cathedral remains the background. The priest stands in front of the lower center of the seal and uses the existing kneeling pose in features; full skeletal animation and additional possession states are not supplied by these images.

Paid symbols darken and dissolve into glossy, tapering liquid ribbons that drain toward the seal. Marked paid symbols add a pale-gold filament. Non-paying orphans only fade. The outer seal responds to blood progression and the inner seal to Offerings; complete sets briefly illuminate their ring before the recorded progression or intervention resolves. Decorative streams never add meter values. The black void stays behind the readouts, and the priest remains a separate foreground layer.

The renderer reads the same complete server event books. It never generates symbols, promotions or payouts. GDD v1.5 intentionally revises progression and intervention timing. Original source PNGs remain unchanged. Version 2 books include rule thresholds and explicit pending, confirmed and expired events; legacy version 1 books retain their recorded payouts and three-charge display.

Fast mode changes timeline speed. Skip, reduced motion, resizing during a step, and hidden tabs finish recorded steps without changing their result. An accessible HTML board mirrors the canvas; missing graphics or GPU context loss retain the basic display. Reload restores accelerated graphics when available. GPU resolution is capped at 2×; liquid geometry is pooled with a limit of 60 streams, and invocation droplets have an 84-particle pool. A compact priest-and-seal scene remains visible on phones.

Runtime libraries and license notices are bundled under `public/vendor/`; gameplay needs no CDN, npm installation or Higgsfield connection. The included Pixi CSP compatibility module preserves the server's existing script policy. To refresh the pinned bundles intentionally, run `python scripts/vendor-libs.py`; it checks published package integrity before extraction. The selected seal used one free Soul 2.0 website generation, leaving 2,996 at the time checked. An earlier connector draft used 0.12 paid credits; its separate balance is 0.65. Provenance and prompts are in `art/`.

## Integrated altar indicators · v0.5

The separate blood/Offering bars are removed. Five blood drops sit on the seal's upper rim; filled versus hollow shapes and a numeric count show charges. Gold diamond sigils on the inner rim show Offering progress inside features. Counts remain accessible HTML progressbars, mirrored by SVG when WebGL is unavailable.

The current altar step (1–12), current multiplier, next multiplier and remaining blood charges are explicit. A completed set briefly shows `5 / 5` and the ordinary step gained before the recorded state settles. Offerings show `BONUS ONLY` outside features, ready sigils plus spare charges when banked, and `SEALED` at the cap. The step display reflects the confirmed ladder; it never calculates an outcome. No images were generated and no AI credits were used for v0.5.

## Immersive game scene · v0.6

The game now fills a cathedral scene, with a larger central board and an iron/gold architectural frame. Symbol cards are replaced by subtle dividers. The title sits at the left and the priest/seal at the right. A compact bottom control bar contains balance, win, bet, rite selection, a circular spin button, fast playback and sound. Desktop bet steppers and fullscreen are available.

History, rules, settings, replay and demonstrations are in the Game menu. Counts and altar steps stay beside the priest. Portrait and short landscape layouts keep the spin button visible and controls below the symbols. Source art and game rules are unchanged; this revision used no AI credits. See `../docs/NINTH_RITE_SCENE_REDESIGN.md`.

## Liquid ritual seal · v0.7

A new thick carved ring replaces the earlier seal. Recessed upper blood channels and inner gold Offering channels fill from the recorded charge values, with wet highlights, a soft glow and moving reflections. Banked totals remain explicit and both tracks clear when sealed. Matching SVG tracks preserve the basic display. Reduced motion and skip remain supported. One free Soul 2.0 website generation was used; no paid credits were spent. See `../docs/NINTH_RITE_LIQUID_SEAL.md`.

## Implemented GDD rules

6×5 grid; orthogonal clusters of five or more; independent disconnected groups; non-paying orphan clearing; gravity and refill; one blood charge per winning cluster; five charges per tier; multi-tier overflow; the exact multiplier ladder; ordinary upgrades on later cascades; pending entity offers after normal progression, confirmed only by a winning next tumble; marked winning-symbol collection; banked sigils; one intervention per cascade; both-meter sealing only at earned/confirmed ×2500; base/ante mark exclusion; highest natural bonus awarded once after the cascade chain; purchased feature starting states; meter persistence; one +5 retrigger from 3+ initial-board scatters; no direct scatter payout; God pre-spin invocation and zero-win possibility.

The UI distinguishes the altar committed for later play from the multiplier that paid the current cascade. Orphans fade separately from paid cells.

## Deliberately unfinished

- **Mystery is disabled.** Epic Rite has no defined mechanics. We do not replace its 5% selection with another bonus or charge for an incomplete mode.
- **No RTP or volatility claim.** All values in `config.mjs` under `TEST_MATH` are visibly labeled, disposable development data, not approved design decisions.
- **No production total-win cap.** The separate altar ceiling is ×2500. The 200-cascade safety guard throws and aborts the entire uncommitted round; it never silently clips a payout or counts as a game rule.
- No deposits, withdrawals, real-money gambling, Engine authentication, or production RGS integration.
- The generated cinematic art is a first draft, not final approved production artwork. Additional altar-tier priest states, refined effects, and final audio are pending; current tones are synthetic placeholders.

## Working assumptions isolated from confirmed rules

These remain candidates, as identified in GDD v1.5:

1. Apply orphan clearing independently for every winning symbol type, against one pre-clear board.
2. Natural features use the bought 10/12/12 spin counts and ×8/×16/×32 start, empty meters, and the same test generator. Their wins belong to the same local round.
3. Symbol frequencies, neighbor-copy generation, scatter frequencies, mark frequency, raw payouts, and conditional promotion weights are temporary test settings. All three purchased rites share one Offering probability. Ante modes change only scatter chance.

No GDD rule, target RTP, or open decision was silently ratified by implementing these candidates.

## Files

| File | Purpose |
|---|---|
| `config.mjs` | Confirmed ladder/mode structure plus separately labeled test math |
| `engine.mjs` | Deterministic headless game logic, event books, and integer payout units |
| `scenarios.mjs` | Explicit scripted examples, separate from paid sandbox outcomes |
| `server.mjs` | Loopback-only HTTP server and atomic play-credit settlement |
| `public/pixi-view.mjs` | PixiJS sprites, pooled effects and GSAP playback timelines |
| `public/view-math.mjs` | Visual-only survivor mapping for recorded tumble boards |
| `public/blood-fx.mjs` | Wet dissolve shader and reusable liquid ribbon geometry |
| `public/` | Responsive playback, accessible HTML mirror, draft art, controls and rules |
| `public/vendor/` | Pinned browser bundles, integrity metadata and license notices |
| `art/` and `design/assets.csv` | Image provenance, shared style and asset manifest |
| `test/` | Engine rules, HTTP settlement, recovery, intervention settlement and legacy playback |

Raw win amounts use integer hundredths of the base bet. The ledger uses integer ten-thousandths of a play credit, so supported bet sizes settle exactly. Random sandbox seeds are created on the server; no outcome probability depends on balance or play history. This generator is a local exercise harness, not the final Engine weighted outcome library.

## Checks

From this folder:

```powershell
node --test test/*.test.mjs
node server.mjs
```

Browser flow verification covers every enabled mode, playback/replay accounting, scripted interventions, mobile layouts, rules, reduced motion, and refresh recovery. See the project verification report for results.

Optional browser checks, with the server running and `playwright-cli` installed:

```powershell
playwright-cli -s=ninth open http://127.0.0.1:3014 --browser=chrome
playwright-cli -s=ninth run-code (Get-Content test/browser/play-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/rules-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/legacy-rules-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/purchase-entry-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/recovery-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/art-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/pixi-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/ritual-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/altar-check.js -Raw)
playwright-cli -s=ninth run-code (Get-Content test/browser/dark-art-check.js -Raw)
```

The recovery check deliberately interrupts one request after the server has committed it. Its expected failed-request console entry is part of that test.

The Pixi check observes actual symbol movement, liquid streams, pose selection, skip, resize, reduced motion and context-loss recovery. The ritual check verifies monotonic falls without overshoot or scale pulses, wet dissolves, orphan exclusion, seal destinations and meter response. The art check deliberately fails one atlas request to verify the basic display. See `../docs/NINTH_RITE_RITUAL_REVISION.md` for the latest presentation changes.

Next development stage: resolve Epic and the remaining working assumptions, select paytable/probability candidates and total-win cap, then port/freeze the mathematical model and generate validated Engine-compatible books. Preserve the frontend's separation from outcome calculation.

## Dark art · v0.8

The active art now uses J/Q/K/A ranks, four weathered relics, a horned faceless Hollow Halo Scatter and a skull/candle/occult border. All were generated through Soul 2.0's free website allowance. Original IDs and game math are unchanged. See `../docs/NINTH_RITE_DARK_ART.md` and `art/dark-art-v08-generations.json`.

## GDD v1.5 rules revision

Five winning clusters advance the altar. Red-dot chance is 4% per ordinary bonus symbol. Three Offerings buy a pending offer that only a winning next tumble confirms; failure keeps earned progress and spends the Offerings. God’s pre-spin guarantee is unchanged. See [the current GDD](../docs/THE_NINTH_RITE_GAME_DESIGN_v1.5.md) and [the verification/frequency report](../docs/NINTH_RITE_RULES_V1.5_VERIFICATION.md).

## GDD v1.6 intervention awards

Offers advance at least two steps below ×120, or one step from ×120 upward, evaluated after normal blood progression. Existing eligible-target weights are retained. Pending offers use a restrained halo/status cue; full invocation effects wait for confirmation. See [v1.6](../docs/THE_NINTH_RITE_GAME_DESIGN_v1.6.md) and [the comparison](../docs/NINTH_RITE_PROMOTION_FLOOR_VERIFICATION.md).

### Style 2 repeat-retrigger concept (v1.8)

Style 2 now requests `repeat-retriggers-v1`. Lesser, Blood and Greater award +5 for 3+ Scatters on each qualifying initial free-spin board, with no once-per-feature restriction. Awarded spins can retrigger, including their final spin. Refills and God Mode retain their previous exclusions. Altar, Blood and Offerings carry over; the existing maximum win still ends the round.

`repeat-engine.mjs` is a separate development generator sharing v1.7 cascade/payout/intervention functions. This concept uses uncalibrated generator probabilities; the existing 96.50% catalog does not apply. Prices use the same server mode configuration. The original engine, calibrated catalog fingerprints and `/` selection are unchanged. Recalibration/export is a separate required release step.

The rules version is frozen in the saved request and server idempotency signature, so recovery from either presentation reuses the original rules and charge. Old recorded rounds replay as recorded. A no-charge `/api/scenario` request with `scenario: retrigger` and this rules version demonstrates three awards (+15, 25 total Lesser Rite spins).

Verification: 107 automated tests passed, covering all three free-spin modes, 3/4/5 Scatters, natural entry, retriggers on final awarded spins, state persistence, refill exclusion, God Mode, maximum win, replay/skip and lost-response recovery. Live browser review displayed the first, second and third +5 ceremonies with distinct event keys.
