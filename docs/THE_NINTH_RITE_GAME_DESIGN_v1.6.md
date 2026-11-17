# THE NINTH RITE — Game Design v1.6

23 October 2026. This revision changes intervention minimum award distance and presentation. All other rules in [v1.5](THE_NINTH_RITE_GAME_DESIGN_v1.5.md) remain in force.

## Minimum intervention award

Use the earned altar **after normal five-charge progression** as the starting point.

| Earned altar | Minimum offer |
|---|---:|
| ×1 | ×4 |
| ×2 | ×8 |
| ×4 | ×16 |
| ×8 | ×32 |
| ×16 | ×64 |
| ×32 | ×120 |
| ×64 | ×250 |
| ×120 | ×250 |
| ×250 | ×500 |
| ×500 | ×1000 |
| ×1000 | ×2500 |
| ×2500 | None; both meters sealed |

Below ×120, offers advance at least two ladder steps. At ×120 or higher, at least one. Larger jumps remain possible. Steps follow the existing ladder, not a formula that doubles the numeric multiplier.

Filter out targets below the minimum, retain each eligible target's existing promotion-distance weight, and normalize the remaining weights when drawing. Do not shift the old one-step weight onto the two-step outcome. The weights remain provisional test math.

Example: ×16 with 4/5 blood wins one cluster. That cascade pays at ×16, normal blood earns ×32, and the minimum intervention offer is ×120. If blood instead moves ×64 to ×120, the minimum offer is ×250.

## Confirmation and presentation

- An offer is still pending until the immediately following tumble wins. A failed offer spends its three Offerings, preserves earned progress and surplus charges, and cannot carry to another spin.
- Show pending offers through the altar status and a short, restrained halo glow. Keep the grid visible, without the full invocation overlay or invocation chord.
- When a win confirms the offer, show the full invocation animation and “INTERVENTION CONFIRMED” before presenting the winning payout.
- God Mode's guaranteed pre-spin award still uses its original weights and full introduction. Its later Offering-driven offers use the new minimum-distance rule.

## Versioning and unchanged settings

Outcome books remain format version 2 and identify GDD 1.6. Recorded rules include `lowTierBoundary: 120`, `lowTierMinimumSteps: 2`, and `highTierMinimumSteps: 1`. Playback always uses recorded payouts and tiers, including older books. New presentation may render old pending/confirmed events without recalculating them.

Five clusters per ordinary step, 4% mark chance, three Offerings per invocation, next-tumble confirmation, failure consumption, bonus costs, spins, scatter rules, paytables and God guarantees are unchanged. No new image assets are required.

This is a prototype balance candidate, not validated production mathematics. Compare rewards, confirmation frequency and payout tails before further tuning. Larger awards address reward size; they do not resolve low confirmation frequency.
