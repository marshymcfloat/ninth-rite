# Intervention minimum — v1.6 comparison

23 October 2026. 10,000 seeded rounds per bonus per revision (60,000 total). Seeds `promotion-audit:<mode>:<0..9999>`. Run `node scripts/compare-promotion-floor.mjs` from `prototype/`. The previous engine/config are preserved in `work/rules-v1.5-baseline/`. [Raw results](../work/promotion-floor-comparison.json).

## Observed results

All returns below are gross multiples of the base bet, not profit or multiples of the bonus purchase cost. Prices remain 100×/200×/500× for Lesser/Blood/Greater. These samples are not validated RTP estimates.

| Bonus | Rules | Invocations / bonus | Confirmations / bonus | No confirmation | Mean confirmed tier factor | Mean return | Median return | 99th percentile |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| lesser | 1.5 | 0.3261 | 0.0545 | 94.63% | 5.03× | 46.71× | 30.40× | 245.44× |
| blood | 1.5 | 0.4306 | 0.0742 | 92.75% | 5.38× | 129.52× | 81.76× | 864.80× |
| greater | 1.5 | 0.4444 | 0.0748 | 92.74% | 4.57× | 252.78× | 165.12× | 1608.32× |
| lesser | 1.6 | 0.3259 | 0.0544 | 94.63% | 9.78× | 55.89× | 30.56× | 424.80× |
| blood | 1.6 | 0.4302 | 0.0741 | 92.75% | 9.20× | 154.45× | 82.08× | 1618.00× |
| greater | 1.6 | 0.4434 | 0.0746 | 92.74% | 7.31× | 283.40× | 166.40× | 2535.20× |

The minimum improves successful rewards without changing Offering generation or the next-win requirement. Average gross returns rise about 12–20%, while median returns change less than 1%; most of the impact is in the upper payout tail. Approximately 93–95% of sampled bonuses still have no confirmed Offering intervention. The revision does not solve rarity, and does not establish final balance.

## Tail measurements

| Bonus | Rules | 95th percentile return | Largest sampled return | Returns ≥1000× base bet / 10,000 |
|---|---|---:|---:|---:|
| lesser | 1.5 | 110.00× | 10026.80× | 20 |
| blood | 1.5 | 316.08× | 9725.96× | 83 |
| greater | 1.5 | 619.22× | 17306.84× | 220 |
| lesser | 1.6 | 125.20× | 11959.12× | 44 |
| blood | 1.6 | 386.16× | 12104.60× | 165 |
| greater | 1.6 | 694.88× | 17531.84× | 316 |

The sample maximum is not a game win cap. No total win cap is configured. Exact ending-tier distributions and dot frequencies are in the raw results.

## Implementation checks

46 Node tests pass, including every minimum tier, the ×120 boundary after normal progression, preserved eligible-target weights, 800 seeded bonus/God rounds, confirmation/expiry accounting, cap behavior, legacy replay metadata and unchanged settlement.

The award remains pending until the next tumble wins. Rejected offers consume three Offerings. God Mode’s guaranteed initial award is unchanged. GDD v1.5 and v1.4 remain historical documents.

Browser verification passed for pending offers without a celebration overlay, confirmed awards with the full overlay, failed offers without celebration, ×2500 confirmation/expiry, desktop/mobile, reduced motion, fallback rendering, replay and skipping. Recorded payouts and demo balances matched; no page JavaScript errors. Two expected resource-load errors were caused by intentionally blocking the Pixi bundles for fallback testing.
