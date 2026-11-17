# Illustrated rite selector

Implemented 22 October 2026. Uses the supplied references' illustrated-card and category-navigation approach with the existing Crimson Cathedral artwork.

- Four bonus cards: Lesser, Blood, Greater and God. Each shows starting spins/altar, exact cost in play credits and its base-bet multiplier.
- Separate Base & chance tab for Standard and both ante modes. No fabricated probability or volatility ratings.
- Preview a card, read its mechanics, then apply with Select. Selection does not send a play request or charge the balance; Spin retains that responsibility.
- Shared base-bet selector and bounded steppers update all costs. Current balance is refreshed when opening the dialog.
- Mystery remains unavailable. God explicitly states that the guaranteed intervention can still pay zero.
- Native modal focus/Escape behavior, keyboard tab navigation, visible focus indicators, reduced motion and an independently scrolling card area on small screens.
- The initial selector reused symbol/priest/scatter compositions. These remain as loading and missing-image fallbacks beneath seven dedicated narrative illustrations.

Validation: 32 automated tests pass. `rite-selector-check.js` passes prices, bet synchronization, no-charge selection, cancellation, keyboard navigation and six viewports (1440×900, 1208×676, 1024×768, 390×844, 320×740, 844×390). `play-check.js` passes actual starts and settlement for all seven enabled modes, replay, refresh recovery, Mystery exclusion and rules access. No browser errors in either check.

Only presentation and two static-file routes changed; engine, mode configuration and settlement behavior are preserved. Preview images: `work/rite-selector-desktop.png` and `work/rite-selector-mobile.png` in the project root.

## Dedicated rite illustrations · 22 October 2026

Seven separate 3:2 scenes replace the repeated symbol compositions. Their visual language uses burgundy robes, ivory stone, antique gold, crimson liquid and faceless ceremonial figures.

| Rite | Illustration |
| --- | --- |
| Standard | A quiet priest beside a modest altar and candle, establishing ordinary play. |
| Enhanced Chance | A small horned effigy awakening above one palm, a restrained summoning. |
| Maximum Chance | Both arms raised, stronger crimson ribbons and a bright portal surrounding the effigy. |
| Lesser Rite | A priest offering a chalice, one thin blood stream marking the beginning ceremony. |
| Blood Rite | Glossy blood streams filling a gold ritual channel with offering sockets. |
| Greater Rite | A raised crown within illuminated gold rings, showing a higher starting ritual. |
| God Mode | A colossal horned entity directing power onto a small priest and altar. |

The scenes communicate theme and relative ritual intensity; coded labels retain exact spins, altar values, costs and rules. Blood/Greater do not imply exclusive mechanics: both preserve the existing shared progression and Offering system. Chance illustrations do not imply guaranteed entry. No odds, payout, engine, settlement or mode parameters changed.

Generated on the user's Higgsfield website with Soul 2.0, 2k, 3:2, one image per submission. Ten successful free generations: seven selected images and three rejected originals with unwanted lettering/solid disks. Observed allowance 2,981 → 2,971. No paid credits used. Exact prompts/source URLs/rejection reasons: `prototype/art/rite-illustrations/prompts.json`; selected source dimensions and hashes: `prepared.json` in the same folder. Untouched originals are preserved. `scripts/prepare-rite-scenes.cjs` only resizes proportionally to 1008 px and compresses WebP.

The full composition is preserved so the small priest in God Mode remains visible. Chance cards are centered at a bounded width on desktop; phone cards use the existing independently scrolling area. Missing images restore the original composition without disabling selection.

Validation for this illustration pass: all seven unique images load; missing-image fallback works; no phone horizontal overflow. Selector checks pass prices, bet synchronization, uncharged selection, Escape cancellation, keyboard navigation and all six existing viewports. The deliberate fallback test produces expected image 404s; normal selector checks report no page errors. Preview files: `work/rite-art-bonuses.png`, `work/rite-art-chance.png`, `work/rite-art-mobile.png`.
