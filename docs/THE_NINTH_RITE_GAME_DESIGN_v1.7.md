# THE NINTH RITE — Game Design v1.7

23 October 2026. Submission candidate; not an approved or published game.

This revision extends [v1.6](THE_NINTH_RITE_GAME_DESIGN_v1.6.md). Earlier specifications and recorded books remain historical artifacts. Replay never reruns math to replace recorded payouts.

## Round cap

The entire charged round pays at most **50,000× base bet**, including a natural feature. This is separate from the **×2500 altar ceiling**.

For simultaneous clusters crossing the remaining cap, compute each share as its uncapped payout divided by the sum of uncapped payouts, multiplied by the remaining payout. Use integer hundredths of base bet: floor each share, then allocate leftover units to the largest fractional remainders. Break ties in recorded cluster order. Record uncapped and credited amounts. A capped cascade terminates gameplay immediately: no further charge collection, intervention, retrigger, natural feature, or spin follows it. Only terminal reporting events follow.

## Preserved mechanics

- Five or more matching symbols connected by shared edges qualify; diagonal contact does not. Disconnected qualifying groups pay separately.
- Non-paying orphans of winning symbol types clear without charges.
- Five clusters earn an altar step; concurrent clusters each count and overflow carries.
- Ordinary feature symbols have a 4% mark probability in the candidate generator. Three collected Offerings invoke one intervention per cascade; surplus remains banked.
- Pay the triggering cascade at its existing multiplier. Apply normal progression before selecting an intervention. Below ×120, the offer advances at least two ladder steps; at ×120 and above, at least one.
- The offer remains pending until the immediately following tumble wins. Confirmation applies before that board's payouts. Failure consumes the Offerings without replacing earned progress. Nothing pending carries into another free spin.
- Pending ×2500 does not seal the meters. Confirmed or normally earned ×2500 does.
- God retains one spin and a guaranteed pre-spin multiplier, including genuine zero-return outcomes.
- Existing spin counts, retrigger rule, scatter entry counts and connectivity remain unchanged. Mystery remains disabled.

## Production distribution

Seven fixed catalogs replace per-play generation in release validation and production. JavaScript remains the single authoritative generator. A catalog stores fixed integer weights and deterministic outcome seeds; replay uses its recorded events. Player history and wallet balance never alter probabilities.

For mode cost c, outcome payout x in base bets and integer weight w:

`RTP = sum(w × x) / (sum(w) × c)`

Target each mode at 96.50% with tolerance ±0.005 percentage points. A generated sample's average is not theoretical RTP. Final RTP is calculated from integer weights, including positive-weight maximum outcomes. All result figures and selected prices come from the calibration report and release configuration.

Standard, Enhanced Chance, Maximum Chance, Lesser, Blood and Greater retain their costs. God is selected at **100×** from 100, 150, 200, 250, 300, 500, 750 and 1000×: the feasible price nearest the unweighted mean divided by 0.965, ties toward the lower price. The unweighted God mean is approximately 107.414 base bets, giving an ideal price of 111.310×. The closest candidate, 100×, satisfies the local calibration targets. Its weighted standard deviation in mode-cost units is at least 5% above both Lesser and Blood; Greater is also above both. Studio reconciliation remains pending.

All seven fixed catalogs pass the specified local experience and risk checks. Their exact integer-weight RTP rounds to 96.5000%. This does not establish platform approval. The original generator configuration remains preserved for development; local release validation overrides prices from the calibrated report and draws only from fixed weighted outcomes.

Internal experience targets are those in `prototype/math/targets.json`; they are not platform approval rules. Incompatible targets block release rather than being silently relaxed. The report separately measures naturally triggered features, tails, concentration, standard deviation and maximum frequency. Studio risk reconciliation remains a separate gate.

## Books and integration

New books use format version 3, GDD 1.7, explicit thresholds, cap events and uncapped/credited payouts. Versions 1 and 2 remain playable with their recorded rules and results.

Export headerless lookup CSVs and matching Zstandard-compressed JSONL books. The same row order, integer weights and integer payout hundredths are used locally and for upload. Validate every exported book, enforce 1 MiB per book and less than 4 GiB per compressed file, and retain source/configuration hashes. An incomplete export has no final index and must not be uploaded.

RGS integration uses integer millionths, server bet levels and currencies, original-wager recovery, explicit winning-round completion and automatic zero-round closure. Public replay does not authenticate or expose betting controls. Modes costing more than 2× require activation confirmation. Social wording and SC/GC amounts apply to runtime text and replay.

An Offering intervention visibly reveals the entity and the proposed multiplier before the next tumble. The earned altar stays visible. The offer is explicitly pending; the following settled board confirms it or expires it. The last confirmation/expiry message remains available through the rest of the round. Reduced motion removes travel effects without eliminating the readable offer hold; skipping still settles the recorded result immediately.

## Release gates

Mathematical compliance does not establish visual approval, asset rights, commercial safety or publication. Before freezing: complete all seven million-book catalogs, validate/export every book, reconcile Studio calculations, test the actual account's integration and checklist, verify asset/font rights, finish audio and presentation, and prepare reviewed 3:4/16:9 marketing images. No automated submission is authorized by this document.

Official references: [math](https://stake-engine.com/docs/approval-guidelines/math-verification), [file contract](https://stake-engine.com/docs/math/math-file-format), [integration](https://stake-engine.com/docs/approval-guidelines/rgs-communication), [replay](https://stake-engine.com/docs/approval-guidelines/game-replay-requirements), [submission](https://stake-engine.com/docs/approval-guidelines/submission-checklist).
