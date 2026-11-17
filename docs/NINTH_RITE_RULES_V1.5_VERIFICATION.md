# GDD v1.5 — rules verification

23 October 2026. Local play-credit prototype only.

## Frequency comparison

10,000 seeded rounds for each of Lesser, Blood and Greater, under both v1.4 and v1.5 (60,000 rounds total). Seeds: `rules-audit:<mode>:<0..9999>`. The original engine/config are preserved in `../work/rules-v1.4-baseline/`; raw output is [rules-comparison.json](../work/rules-comparison.json). Repeat with `node scripts/compare-rules.mjs` from the prototype directory.

Dots are counted across settled boards, including surviving marked symbols. Interventions and clusters are averages per complete bonus, including its retrigger. Old interventions were immediately permanent; new confirmations require a next-tumble win.

| Bonus | Rules | Dots / board | Invoked / bonus | Confirmed / bonus | Expired / bonus | Clusters / bonus |
|---|---|---:|---:|---:|---:|---:|
| lesser | 1.4 | 3.498 | 1.4633 | 1.4633 | 0.0000 | 8.0712 |
| blood | 1.4 | 3.508 | 1.6717 | 1.6717 | 0.0000 | 9.6245 |
| greater | 1.4 | 3.506 | 1.5367 | 1.5367 | 0.0000 | 9.6360 |
| lesser | 1.5 | 1.167 | 0.3191 | 0.0570 | 0.2621 | 8.0610 |
| blood | 1.5 | 1.167 | 0.4374 | 0.0723 | 0.3651 | 9.6578 |
| greater | 1.5 | 1.171 | 0.4320 | 0.0765 | 0.3555 | 9.6211 |

The combined revisions make confirmed interventions much rarer than merely reducing the mark frequency: approximately 0.057–0.077 confirmed boosts per bonus. Most pending offers expire because the next board does not win. This is the requested behavior, not a guarantee of the eventual game balance. Paytable and other probability settings were not retuned.

## Ending multiplier distribution

Percent of sampled bonuses ending at each earned tier. Pending offers are not counted as earned.

| Ending tier | Lesser 1.4 | Lesser 1.5 | Blood 1.4 | Blood 1.5 | Greater 1.4 | Greater 1.5 |
|---|---:|---:|---:|---:|---:|---:|
| ×8 | 1.80% | 12.56% | 0.00% | 0.00% | 0.00% | 0.00% |
| ×16 | 8.49% | 56.02% | 0.49% | 5.08% | 0.00% | 0.00% |
| ×32 | 10.75% | 23.95% | 3.73% | 45.54% | 0.64% | 5.49% |
| ×64 | 13.54% | 4.54% | 6.10% | 35.77% | 4.27% | 44.80% |
| ×120 | 13.19% | 1.54% | 10.69% | 9.11% | 6.18% | 36.18% |
| ×250 | 12.63% | 0.74% | 12.72% | 2.47% | 10.68% | 9.04% |
| ×500 | 10.46% | 0.38% | 12.81% | 1.10% | 12.40% | 2.62% |
| ×1000 | 9.37% | 0.16% | 12.95% | 0.44% | 13.43% | 1.05% |
| ×2500 | 19.77% | 0.11% | 40.51% | 0.49% | 52.40% | 0.82% |

## Automated checks

- 42 Node tests pass: five-charge progression and overflow, orthogonal/disconnected clusters, orphan exclusions, next-board confirmation/expiry, spent and banked Offerings, consecutive offers, pending/confirmed caps, God exception, deterministic results, exact payout accounting, HTTP idempotency and versioned playback.
- Browser rules checks pass: confirmed/expired offers and both cap paths; five Pixi blood segments and three Offering segments; earned altar retained while pending; mobile layout, reduced motion, DOM fallback, skip and replay.
- A saved v1.4 Greater book replays at its original 1,896.88-credit payout, with three blood segments; a subsequent v1.5 book restores five segments.
- All seven playable modes pass server-to-display balance/payout reconciliation and refresh recovery.
- Purchased entrance checks pass for all four bonuses: correct scatter counts, unchanged free-spin awards, one play request per purchase, exact payout, skip and refresh recovery.
- Altar checks pass at widths 320, 390, 768 and 1440: five segments, banked totals, filled-set preview and cap clearing.
- An intentionally interrupted response after server commit recovers the same round and balance without charging twice.
- Fallback tests deliberately block both Pixi bundles; their two failed-resource messages are expected. The recovery test adds one intentional failed-request message. No page JavaScript errors were observed.

## Compatibility and presentation

New books use version 2, GDD 1.5, and recorded rule thresholds. `promotedTier` is a pending offer in new books; use `payoutMultiplier` for settlement. Explicit pending/confirmed/expired events drive the browser. Legacy books are never regenerated. The old pre-Pixi math hashes remain historical fixtures; obsolete equality tests were replaced with revised-rule and legacy playback checks.

The meter count is above the canvas and the cascade toast is dismissed before an invocation introduction. No new imagery was generated.

These results are prototype measurements. They establish neither production RTP nor a final volatility model.
