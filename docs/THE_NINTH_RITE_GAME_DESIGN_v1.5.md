# THE NINTH RITE — Game Design v1.5

Confirmed revision: 23 October 2026. This document supersedes v1.4 on ordinary blood progression and intervention timing. The unchanged art direction, modes, prices, scatter rules, paytable assumptions and open production decisions remain documented in [v1.4](THE_NINTH_RITE_GAME_DESIGN_v1.4.md), retained as history.

## Winning clusters and ordinary blood

- The board is six columns by five rows. A win requires five or more identical ordinary symbols joined by shared edges. Diagonal-only contact does not connect.
- Independently qualifying disconnected groups each pay and each award one blood charge. Several clusters on the same settled board award several charges; this is not one charge per tumble.
- Non-winning disconnected cells of a winning symbol type clear as orphans. They pay nothing and contribute neither blood nor Offerings.
- **Five blood charges advance one tier**, with overflow carried. Resolve all clusters on the same pre-clear board. All use one payout multiplier.
- Tier ladder: ×1 → ×2 → ×4 → ×8 → ×16 → ×32 → ×64 → ×120 → ×250 → ×500 → ×1000 → ×2500.
- Ordinary progression is earned after the current win and applies to later wins. It remains earned even when the immediately following board loses. Blood and earned tiers persist through the feature and its retrigger; independent paid rounds reset them.
- Blood is 0–4 between evaluations. Six simultaneous clusters at ×16 and 0/5 produce ×32 with 1/5. Six at ×16 and 4/5 produce ×64 with 0/5. Both triggering boards pay at ×16.

## Red-dot Offerings

- Marks appear only on ordinary paying symbols in eligible bonus play, including God Mode. Never on scatters or ordinary base/ante symbols.
- **Prototype probability: 4% per newly drawn ordinary bonus symbol**, reduced from 12%. A surviving symbol retains its existing mark. This is a test setting, not a validated production probability.
- Only marked symbols in qualifying winning clusters award Offerings, one per symbol. Marked orphans do not count.
- **Three Offerings invoke one pending intervention.** At most one new intervention can be invoked on each winning cascade. Consume three at invocation; bank all surplus.
- Banked complete sets may invoke on an eligible winning cascade even without new marks.

## Pending interventions

1. Resolve any intervention pending from the preceding cascade against this settled board.
2. If this board wins, confirm that offer before paying: its tier becomes the earned altar and every winning cluster uses it. If the board does not win, expire the offer and end the cascade chain.
3. Pay a winning board once at its active earned multiplier. Collect blood and eligible Offerings.
4. Apply ordinary five-charge progression. If eligible Offerings remain and the resulting tier is below ×2500, select a strictly higher tier using the existing promotion weights, consume three Offerings, and record a new pending offer.
5. Clear and refill. Only the **immediately following tumble in this same spin** can confirm the offer. A pending offer never carries into a later free spin.

The triggering win receives no retroactive intervention boost. A confirmed boost remains permanent for the rest of the feature. A failed offer does not remove earned normal progression, blood remainder or surplus Offerings, and does not refund the three Offerings spent. A winning board that confirms an offer may itself invoke another from banked charges.

Example: ×16 with 4/5 blood, one qualifying cluster and enough Offerings. The cluster pays at ×16, blood earns ×32, and the entity offers ×120. A winning next tumble confirms and pays at ×120; otherwise the altar remains ×32.

## Maximum tier and God Mode

- A pending ×2500 offer does not seal the meters or discard charges. Confirmation seals both and clears unused blood and Offerings before paying that confirming board at ×2500.
- An expired ×2500 offer preserves the earned tier and remaining charges.
- Normal progression to ×2500 still seals both meters immediately after the triggering win. That win uses its previous tier. No higher intervention can then be offered.
- God Mode's mandatory pre-spin ×250/×500/×1000/×2500 award remains guaranteed and permanent, even if its only initial board loses. It does not guarantee a payout. Any later Offering intervention follows the pending rules above.

## Presentation and recorded outcomes

- Five blood segments, three Offering segments. Numeric counts and accessible progress descriptions match the recorded rules.
- Show the earned altar while the offer reads “×120 pending · win the next tumble.” Confirm or expire only after the next board is visible. Never present an unconfirmed offer as earned.
- Version 2 event books identify GDD 1.5, include separate blood/Offering thresholds, and record `interventionPending`, `interventionConfirmed` and `interventionExpired` events with tier and state. The existing `promotedTier` cascade field identifies the new offer, not its payout multiplier; `payoutMultiplier` remains authoritative.
- `interventionCount` counts invocations including God's guaranteed award. `interventionConfirmedCount` counts confirmed offers plus that God award; `interventionExpiredCount` counts failed offers. Every completed round reconciles invoked = confirmed + expired.
- Legacy version 1 recordings retain their original payouts, immediate promotion behavior and three-charge blood display. Never regenerate their result with current rules.
- Purchased scatter entrances remain presentation-only: Lesser 3, Blood 4, Greater 5; God one prominent entity scatter. They consume no additional charge or free spin.

## Unchanged rules and validation status

Five-symbol minimum, orthogonal connectivity, orphan clearing, natural bonus thresholds, free-spin counts, retriggers, mode prices, starting tiers, symbol weights, neighbor-copy behavior, scatter frequencies, paytable, promotion distributions and God award weights are unchanged. Mystery remains disabled until Epic Rite is defined. No total win cap or validated RTP model has been selected.

The current server is a local play-credit prototype. Restarting it expires its in-memory sessions. The v1.5 seeded comparison reports frequency and progression measurements only; it is not RTP certification or a production balance recommendation.
