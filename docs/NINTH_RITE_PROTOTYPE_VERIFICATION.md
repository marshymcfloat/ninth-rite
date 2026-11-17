# THE NINTH RITE — prototype verification

Date: 21 October 2026. Design reference: GDD v1.4.

## Result

The local playable prototype implements the defined core mechanics. Seven modes are enabled. Mystery is deliberately disabled while Epic Rite is undefined. PixiJS now animates the realistic cinematic image drafts; audio remains synthetic placeholder sound. Game math and settlement are unchanged. All payout and generation parameters are unvalidated test data.

Local URL: http://127.0.0.1:3014. Start with `Start-Prototype.cmd` in the project root.

Presentation v0.4 replaces the bouncy motion with accelerating falls and firm stops, blood dissolves and liquid streams, and an enlarged occult seal behind the priest on desktop and phones. Its independent ritual browser check passed without page errors or payout/balance changes. See `NINTH_RITE_RITUAL_REVISION.md`. The earlier Pixi migration record remains in `NINTH_RITE_PIXI_UPGRADE.md`.

Presentation v0.5 removes the separate meter bars and integrates blood drops and Offering sigils with the seal. Its altar browser check passed: filled drops match the count, ×16 is step 5 with ×32 next, banked totals stay intact, complete sets appear before ordinary progression, and the final step shows sealed charges and no further multiplier. Layouts pass at 320/390/768/1440px. No game math, source artwork or settlement code changed; 31 automated tests still pass.

Presentation v0.6 replaces the dashboard layout with a full cathedral game scene, a larger central architectural frame, a priest/seal on the right, and compact bottom controls. Rules, settings, history, replay and demonstrations move into the Game menu. The composition check passed at 1440×900, 1208×676, 1920×1080, 1024×768, 768×1024, 390×844, 320×740, 844×390 and 740×400: no horizontal overflow, the control bar never covers symbols, and the spin button stays inside the viewport. All seven paid modes passed with motion enabled and fast playback, with matching payouts/balances, uncharged replay and refresh recovery. All eight scripted scenarios passed with reduced motion. Normal-speed motion checks confirmed firm landings without bounce or scale pulses, paid-symbol blood dissolves, no orphan streams, and streams reaching the repositioned seal. The 31 Node tests still pass, including byte-for-byte game/API/source-art parity. No AI credits were used. See `NINTH_RITE_SCENE_REDESIGN.md`.

Presentation v0.7 installs a new thick carved Soul 2.0 ring and adds recessed liquid blood/Offering channels. The altar browser check now confirms one blood charge fills one channel, complete sets fill three before progression, banked totals are retained, and sealing clears every channel. All eight scripted outcomes still reconcile, with unchanged balance. Live reflections move with motion enabled and stay fixed with reduced motion. A forced graphics-context loss showed matching SVG tracks; reloading restored Pixi. All 31 Node tests pass. One free website generation was used (2,996 → 2,995); no paid credits were used. See `NINTH_RITE_LIQUID_SEAL.md`.

## Dark art revision · v0.8

J/Q/K/A now display over C1–C4. Four darker relics and a horned faceless Hollow Halo Scatter replace the earlier symbol art. A new segmented skull/candle border decorates the board. The rejected bright sheet is retained only as provenance. Six Soul 2.0 website submissions used the free allowance (2,995 → 2,989), including two unused drafts; no paid generation was submitted. See `NINTH_RITE_DARK_ART.md`.

Current automated result: **32 passed, 0 failed**. All existing math, ledger and original source-art hashes still match; all seven fixed-seed mode books and eight scripted books are unchanged. The additional mapping check confirms nine distinct in-bounds source cells across the three sheets, and prevents a missing rank sheet from substituting a relic.

Current browser checks passed:

- Art loading, standing/kneeling poses, unchanged intervention payout, fallback after a missing relic sheet and reload recovery.
- Pixi motion, streams, skip, resize during playback, reduced motion, replay balance, context-loss fallback and restoration. No page errors; the deliberate context loss produces an expected WebGL warning.
- Monotonic falls, no scale pulses, paid blood dissolve, orphan exclusion, streams arriving at the seal, meter response and the unchanged 1.60-credit orphan demonstration. Motion samples now come directly from animation frames; transient assertions run independently of screenshot capture.
- All eight reduced-motion demonstrations with matching recorded payouts and unchanged balances.
- Nine viewport shapes with the board clear of controls and the Spin button inside the viewport. Dedicated new-art checks at 1440×900, 390×844 and 844×390 show the frame entirely inside the viewport and above the HUD.
- A real recorded retrigger board shows all nine symbol IDs and exactly four one-cell Scatters. The native captions and accessible names match. Final previews show this uncharged demonstration, without injected board fixtures.
- Missing frame restores the previous SVG border while Pixi symbols remain active. Missing rank or Scatter sheets select native fallbacks without hiding other available art. Recovery restores Pixi. Three intentional 404s are expected during this fault test.

## Verified flow

User selects a base bet and rite → browser submits one request ID → loopback server generates a complete deterministic event book → integer ledger commits cost and payout once → browser renders recorded boards, clusters, meters and payouts → replay uses the same book without changing the ledger.

| Boundary | Result | Evidence |
|---|---|---|
| Server and environment | Passed | Node built-ins only; listens on 127.0.0.1:3014; no installation or external service required |
| Engine rules | Passed | 25 automated engine tests, including a 175-round seeded invariant sweep |
| HTTP and ledger | Passed | One integration test covering session creation, cost, payout, idempotency, validation, recovery and uncharged demonstrations |
| Pixi upgrade parity | Passed | Five additional tests verify source/game-logic hashes, all seven fixed-seed outcome books, eight examples, survivor mapping and mismatch rejection |
| Animated renderer | Passed | Actual WebGL canvas, observed symbol motion, pooled charge particles, Halo pulse, priest pose switch and exact recorded board after skip |
| Motion and fallback | Passed | Resize during playback, reduced motion, replay, forced context loss, basic display and reload recovery |
| UI → API → result | Passed | Played all seven enabled modes in Chromium; visible balance and payout matched server responses |
| Replay and refresh | Passed | Replay preserved balance; reload recovered the latest recorded round |
| Interrupted request | Passed | Forced failure after server commit; retry returned the same round ID and balance, with no duplicate charge |
| Scripted examples | Passed | All eight examples completed with matching payouts and unchanged balance |
| Responsive layout | Passed | 30 cells remained visible with no horizontal page overflow at widths 320, 390, 768 and 1440 |
| Accessibility controls | Passed | Rules dialog fits at 320px; reduced-motion playback works; controls use labels and native buttons/dialogs |
| Browser errors | Passed in normal flow | No page errors in seven-mode verification. Fault injection intentionally produced one failed network request; server restart produced an expected expired-session 404, both recovered |

Automated result: **32 passed, 0 failed**. Run `node --test test/*.test.mjs` from `prototype`.

Desktop sizing keeps the play controls within a 1440×900 viewport. Retrigger playback reveals the initial scatter board before announcing its extra spins. The seven-mode browser flow was repeated after the Pixi upgrade with zero page errors. Replay remains available on mobile. Static PNG serving, missing-file handling and traversal rejection are covered by the HTTP test. The art browser check verified all 30 atlas cells, standing/kneeling selection, unchanged intervention payout, canvas sizing and visible replay at 320/390/768/1440px, and recovery to SVG placeholders when the atlas was deliberately unavailable. Its intentional missing-image error is expected. Context-loss injection also produces an expected browser warning. See `NINTH_RITE_PIXI_UPGRADE.md` for the animation upgrade details.

## Scripted evidence (base bet 1 play credit)

| Demonstration | Recorded payout | Key result |
|---|---:|---|
| Same-cascade intervention | 102 | Normal ×32 progression, then entity ×120; current clusters pay at ×120 |
| Banked Offerings | 9.6 | Two invocations consume separate stored sets without new marks |
| Normal progression to cap | 100 | Current payout uses ×1000; altar becomes ×2500 and both meters seal |
| Entity award of cap | 250 | Current payout uses ×2500; both meters clear and seal |
| Natural bonus | 0.1 | One Lesser feature starts after the base cascade chain |
| One retrigger | 0 | Four initial scatters award five extra spins once; 15 total spins |
| God Mode zero | 0 | Pre-spin invocation occurs; one initial spin; no guaranteed win |
| Marked orphan | 1.6 | Non-winning marked orphan clears without collecting an Offering |

These are explicit fixtures, not probability samples, expected returns or representative player outcomes.

## Limits and remaining work

- Epic Rite and therefore full Mystery play remain undefined.
- Paytable, symbol/scatter/Offering probabilities, promotion weights, RTP, volatility and total-win cap still need design and mathematical validation.
- Natural-feature starting state and simultaneous multi-type orphan handling are documented working assumptions, not newly approved GDD decisions.
- No total-win cap was invented. A runaway-cascade guard aborts an entire uncommitted round instead of clipping its winnings.
- This local event generator has not been integrated with production Engine RGS or exported as a validated weighted outcome library.
- Final approval of the draft cathedral/priest/symbols, further priest states and animation polish, sound, platform review, and production release work remain.

Browser verification scripts are included in `prototype/test/browser/`. They run through the installed `playwright-cli`; unit and HTTP tests require only Node.
