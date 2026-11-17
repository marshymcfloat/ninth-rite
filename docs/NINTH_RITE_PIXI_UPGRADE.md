# THE NINTH RITE · PixiJS upgrade v0.3

21 October 2026 · GDD v1.4 · local prototype at http://127.0.0.1:3014.

## Changes

- One PixiJS 8.22.0 WebGL canvas renders the generated symbol atlas, both priest poses, Hollow Halo and particles.
- GSAP 3.15.0 sequences initial drops, actual surviving-symbol tumbles, bounce settling, winning pulses, non-paying orphan fades, blood/Offering flights and invocation effects.
- Priest movement uses the existing standing/kneeling images with subtle idle movement and pose crossfades. Additional poses and skeletal animation need additional assets.
- The cathedral, controls, rules, play-credit ledger, sound placeholders and existing compact phone layout are retained. The priest panel stays hidden on phones.
- Fast, skip and reduced-motion controls work with the canvas. Resize and hidden-tab handling finish recorded steps. Missing art or GPU context loss retain a basic display; reloading can restore WebGL.
- Bundles, notices and integrity metadata are local. No additional Higgsfield credits were used, and the game makes no AI calls.

## Unchanged logic

Before the renderer migration, SHA-256 baselines were captured for the engine, configuration, scenario generator, settlement code and three original PNGs. All still match. Complete fixed-seed result books match for all seven enabled modes; all eight scripted examples match as well. The visual tumble mapper preserves recorded symbols, marks and columns. The canvas never calculates an outcome or payout.

## Verification

31 Node tests pass, including the five migration/parity tests. Browser checks passed on desktop Chromium with WebGL:

- All seven playable modes reconciled visible payouts and balances with server responses. Replay and reload preserved the ledger.
- Actual symbol positions changed between frames. Charge particles appeared within their 84-particle pool, and Halo effects and pose changes ran.
- Skipping settled to the exact recorded symbols, marks and cell positions with no remaining timelines or particles.
- Switching to reduced motion and resizing during playback preserved the result.
- Widths 320, 390, 768 and 1440 fit without horizontal page overflow; the canvas resized with the stage and replay stayed available.
- Forced GPU context loss restored the basic display and replay still worked. Reload restored PixiJS. Missing-atlas injection used visible SVG placeholders and subsequently recovered.

Intentional context-loss and missing-image tests produce expected console diagnostics. Normal flow had no JavaScript page errors. This was desktop Chromium testing with resized viewports, not physical-device performance certification.

Run `node --test test/*.test.mjs` from `prototype`. Reproducible browser checks are in `prototype/test/browser/`; they require the running server and `playwright-cli`.

## Remaining work

Test math, RTP/volatility validation, the production total-win cap, Epic/Mystery definition, final art approval, additional character states, final audio and Engine integration remain as previously documented. This upgrade changes presentation only.

Official implementation references: [PixiJS Application](https://pixijs.com/8.x/guides/components/application), [textures](https://pixijs.com/8.x/guides/components/textures), and [GSAP timelines](https://gsap.com/docs/v3/GSAP/Timeline/).
