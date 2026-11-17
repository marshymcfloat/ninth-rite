# Bonus balance check — 100 purchases per bonus

Run: 23 October 2026, Asia/Manila. GDD v1.6. Base bet: 1 play credit. Four available purchased bonuses, 400 complete rounds. Mystery remains disabled because Epic Rite is undefined.

## Method and integrity

Completed in 1.01 seconds. Used the actual /api/play endpoint on an isolated instance of the existing server, with its ordinary random-seed generator and unchanged math. Animations were omitted. Test sessions were replenished when needed to allow 100 independent purchases per mode; this does not simulate survival of a finite bankroll. The user’s running session was untouched.

All 400 rounds passed: purchase-cost checks, exact wallet settlement, cluster/cascade/round payout reconciliation, full seeded outcome regeneration, no aborted outcomes, and resolution of every pending Offering intervention. A duplicate request for the first purchase in each mode returned the same result without another charge. All seeds, boards, and events are saved.

## Purchase returns

Gross return includes the original stake where returned; profit requires return above the purchase price. Observed return is total payout divided by total purchase spend. It is not validated RTP.

| Bonus | Purchase cost | Total spent | Total returned | Observed return | Median payout | Profitable / 100 | Zero returns |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lesser Rite | 100.00 | 10,000.00 | 6,957.62 | 69.58% | 32.48 | 10 | 0 |
| Blood Rite | 200.00 | 20,000.00 | 21,131.38 | 105.66% | 81.92 | 13 | 0 |
| Greater Rite | 500.00 | 50,000.00 | 24,677.14 | 49.35% | 141.44 | 8 | 0 |
| God Mode | 1,500.00 | 150,000.00 | 10,092.50 | 6.73% | 0.00 | 0 | 55 |

## Offering interventions

| Bonus | Invoked | Confirmed | Expired | Rounds with confirmation / 100 | Mean winning clusters per round |
|---|---:|---:|---:|---:|---:|
| Lesser Rite | 38 | 5 | 33 | 5 | 8.13 |
| Blood Rite | 37 | 6 | 31 | 6 | 9.18 |
| Greater Rite | 39 | 12 | 27 | 12 | 9.16 |
| God Mode | 0 | 0 | 0 | 0 | 0.59 |

God Mode’s guaranteed pre-spin multiplier is separate: all 100 purchases received it (62 at ×250, 27 at ×500, 11 at ×1000, none at ×2500). It does not guarantee a winning cluster.

## Assessment

- God Mode is the first candidate for a balance review. At a 1,500-credit price, its mean payout was 100.93, its best payout was 1,000, and every sampled purchase lost money. The expensive single-spin configuration is a clear concern; this sample does not determine its true long-run return.
- Lesser and Greater also look harsh in this batch: 90 and 92 losing purchases out of 100. Their median payouts recovered only 32.48% and 28.29% of the purchase price.
- Blood’s 105.66% observed return is not evidence it is balanced or player-profitable long term. Its biggest return (8,896.12) accounted for about 42.10% of all Blood payouts. The median payout recovered 40.96% of the price; 87 purchases still lost money.
- Confirmed Offering interventions occurred in only 5%, 6%, and 12% of Lesser, Blood, and Greater purchases. If the intended experience is frequent entity interaction, this batch suggests the mechanic remains rare. Frequency should be reviewed separately from the size of its awards.
- There is no agreed target return or volatility profile yet. Do not choose new prices or probabilities from these 100-round results. Next, define those targets and run at least 100,000 purchases per mode across multiple batches, expanding further if rare outcomes still dominate. Compare return uncertainty, median returns, loss rates, tail contributions, and intervention frequency before tuning.

No game rules or probabilities were changed.

## Saved evidence

- [Summary CSV](../work/bonus-balance-latest.csv)
- [Full statistics, rules and source fingerprints](../work/bonus-balance-latest.json)
- [All 400 recorded outcome books and seeds](../work/bonus-balance-books.json)
- [Reusable audit runner](../prototype/scripts/audit-bonus-balance.mjs)