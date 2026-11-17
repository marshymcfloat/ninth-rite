# THE NINTH RITE

**Comprehensive Game Design Document (GDD) — Draft v1.4**  
**Prepared:** 21 October 2026  
**Intended platform:** Stake Engine  
**Document purpose:** Self-contained handoff to another AI conversation, game designer, math developer, artist, or frontend engineer.  
**Status:** Gameplay direction and purchase menu selected; mathematical model **not yet built or validated**; several edge-case rules remain open.

> **CRITICAL HANDOFF NOTE:** This document is a design specification, **not** a tested or approved slot game. The desired **96% RTP**, **high volatility**, bonus prices, multiplier ladder, and Mystery Rite selection mix are design inputs/targets. No simulations, weighted outcome-library validation, certified payout calculations, or platform approvals have been completed. Do not describe the game as already achieving 96% RTP, or silently invent symbol weights, hit frequencies, or maximum payouts.

## Revision v1.4 — confirmed marks, scatters, and Mystery reveal, 21 October 2026

The creator confirmed all three proposed rules in this project chat. These decisions supersede earlier OPEN/WORKING annotations on these points.

- Blood Offering marks never appear in the ordinary base-game portion of standard or boosted/ante spins, including their cascades. Offering marks are available only in eligible bonus/feature play.
- Lesser/Blood/Greater retriggers require **3 or more simultaneously visible scatters on the initial free-spin board, before cascades**. The existing limit of one retrigger per feature and award of +5 spins remain. Scatters award **no direct payout** in any mode.
- Mystery's reel reveal is **presentation only**: it displays the selected bonus and is not a separate paying spin. All Mystery winnings come from the awarded feature.
- Paytables, probabilities, the total-round win cap, Epic Rite, and mathematical validation remain unresolved. This revision updates the design only.

---

## Revision v1.3 — confirmed settlement rules, 21 October 2026

The creator confirmed the following in this project chat. These decisions supersede earlier OPEN/WORKING annotations on these points; other unresolved rules remain open.

- Normal blood progression is evaluated first. An eligible entity promotion selects a strictly higher tier than that post-normal tier, applies to every winning cluster on the same cascade, and persists afterward. Credit the cascade once.
- A banked set of three Offerings activates on the next eligible winning cascade even if that cascade collects no new marked symbols. Resolve at most one intervention per cascade.
- On reaching altar ×2500, seal both meters and clear unused ordinary blood and Offering charges. No further intervention is possible.
- If normal progression reaches ×2500, suppress an otherwise eligible intervention; the current cascade pays at its previous altar tier, and later cascades use ×2500. If an entity promotion awards ×2500, that triggering cascade already pays at ×2500.
- The separate total-round win cap, probabilities, paytable, Epic Rite, and mathematical validation remain unresolved. No gameplay code or outcome mathematics has been changed by this document revision.

---

## Revision v1.2 — confirmed decisions, 21 October 2026

The creator confirmed the following in this project chat. These updates supersede earlier OPEN/WORKING annotations on the same points; all other unconfirmed rules remain unconfirmed.

- Clusters connect through horizontal/vertical edges only; diagonal contact does not count.
- Disconnected qualifying clusters of the same type each pay separately and each award one blood charge.
- Smaller disconnected groups of a winning type clear without payout, blood, or collected Offerings.
- Scatters fall normally. Count simultaneously visible scatters per settled board, without cumulative appearance counting.
- Award the highest natural bonus reached once, after the base cascade chain finishes.
- At most six qualifying clusters fit on the 30-cell board. The former seven-cluster example and its charge remainder have been corrected.
- RTP, volatility, paytables, probabilities, win cap, and Epic Rite remain unvalidated or unresolved as specified below. The existing SDK demonstration is not validation of THE NINTH RITE.

---

## 0. How to interpret this document

- **CONFIRMED — user-selected:** Directly chosen by the creator; preserve unless the creator requests a change.
- **WORKING / INFERRED:** A practical interpretation or recommendation that follows from the creator's examples but has **not** received explicit final confirmation.
- **PROVISIONAL / UNTESTED:** A chosen target or candidate that requires math analysis, simulation, regulatory/platform review, or implementation feasibility testing.
- **OPEN:** A question without a final answer. Do not resolve it silently when implementing payout-affecting logic.

When rules seem contradictory, prioritize explicit user selections, identify the contradiction, and ask for a decision before freezing the math model. If an OPEN issue prevents a production-ready model, prototype explicitly labeled candidate behaviors rather than treating one as approved.

---

## 1. Executive concept

**THE NINTH RITE** is an original, gothic dark-fantasy video slot inspired by the *atmosphere* of dark fantasy games such as Diablo, but **not** their copyrighted characters, symbols, music, or art.

The game takes place in an ancient, ruined cathedral. A lone ceremonial priest worships an unknowable presence called **the Hollow Halo**: a black circular void enclosed by a narrow, almost white ring of light. The entity never becomes a recognizable demon, angel, or creature. Mystery, absence, shadow, distorted geometry, and restrained supernatural effects are central to the identity.

**Core gameplay pitch:** A **6-column × 5-row cluster-pays grid** generates cascading wins. Every independently qualifying **winning cluster** contributes one blood charge to an altar. Every three blood charges raise a shared global altar multiplier along a fixed tier ladder. In free-spin bonuses, marked **Blood Offering** symbols independently fill a three-charge sigil. When completed, the unknown entity intervenes, possibly promoting the altar multiple tiers at once. More expensive bonus purchases start with a higher altar. All winnings and effects are determined by the game's validated outcome mathematics, not frontend animations.

### Design pillars

1. **One signature ritual:** ordinary cluster wins build blood; marked winning symbols can invoke the entity.
2. **Simple, transparent arithmetic:** all winning clusters in a single cascade use one clearly displayed active multiplier.
3. **Ritual escalation:** the priest, altar, audio, and environment respond to genuine awarded events and multiplier states.
4. **Unknowable horror:** never reveal a conventional monster behind the Hollow Halo.
5. **Original and legible presentation:** readable reels and payouts on desktop, mobile, and small popout views.
6. **Auditable math:** selected bets and probabilities must correspond exactly to the published payout distribution and actual game rules.

---

## 2. Locked design snapshot

| Category | Selected direction | Status |
|---|---|---|
| Title | **THE NINTH RITE**, intended public title | CONFIRMED; IP clearance still required |
| Genre | Gothic occult / dark fantasy | CONFIRMED |
| Entity | **Hollow Halo**, unknowable black void with thin white halo | CONFIRMED |
| Priest | Kneels at bonus start, becomes progressively possessed/affected | CONFIRMED |
| Grid | **6 × 5**, 30 positions | CONFIRMED |
| Win model | Connected clusters of **5+** matching ordinary paying symbols | CONFIRMED |
| Ordinary symbols | **8 types: 4 common + 4 premium** | CONFIRMED; individual identities/paytable OPEN |
| Standard Wild | **None in v1** | CONFIRMED |
| Cascade | Winning clusters disappear together; columns collapse; symbols enter from above | CONFIRMED |
| Blood charges | **1 per independent winning cluster**, including simultaneous clusters | CONFIRMED; separate qualifying groups and non-paying orphan clearing resolved |
| Normal level-up | Every **3 blood charges**, leftover charges carry; can jump multiple tiers in a cascade | CONFIRMED |
| Upgrade timing | Normal upgrades apply from the **next winning cascade** | CONFIRMED |
| Base-game altar | Starts at **×1**, resets after a full paid spin with cascades | CONFIRMED |
| Bonus altar | Persists across free spins and one retrigger | CONFIRMED |
| Altar tier ceiling | **×2500**, then remains capped; both meters seal and unused charges clear | CONFIRMED |
| Blood Offerings | Marks on ordinary paying symbols, max one per symbol; absent throughout ordinary base/boosted play | CONFIRMED |
| Offering collection | **One Offering per marked symbol belonging to a winning cluster** | CONFIRMED |
| Invocation threshold | **3 Offerings**; sigil carries across bonus spins | CONFIRMED |
| Offering overflow | At most one intervention per eligible winning cascade; banked complete sets need no new marks | CONFIRMED |
| Entity intervention | Higher-tier, permanent altar promotion; may jump to any higher tier up to ×2500 | CONFIRMED |
| Intervention reward weights | Smaller promotions generally more common; rare larger jumps | DESIGN DIRECTION, precise weights UNTESTED |
| Intervention in ordinary base spins | **No. Interventions are available in feature/bonus modes, including one-spin God Mode** | CONFIRMED latest clarification, with God exception made explicit |
| Free-spin retrigger | One per Lesser/Blood/Greater feature; **3+ scatters** on initial free-spin board before cascades; **+5 spins** | CONFIRMED |
| Target RTP | **96% separately for every mode** | CONFIRMED TARGET, NOT ACHIEVED |
| Volatility | **High** | CONFIRMED TARGET, NOT MEASURED |
| Maximum total win | One uniform cap in base-bet multiples; amount after simulation | OPEN |
| Target stack | **Stake Engine first**, independent math and animated frontend | CONFIRMED |

**CONFIRMED connectivity (21 October 2026):** Matching symbols connect through shared edges only (up/down/left/right). Diagonal-only contact does not connect clusters. The diagram demonstrates one branching orthogonal component.

---

## 3. Glossary and unit conventions

- **Base bet (`B`):** The selected ordinary wager amount, e.g., $1. A `100×` bonus purchase costs `100 × B`.
- **Purchase cost multiplier:** The cost to enter a mode, not a reel payout multiplier.
- **Raw cluster payout:** A paytable amount awarded for symbol type and cluster size, *before* applying the global altar multiplier. Expressed as multiples of `B`.
- **Qualifying cluster:** A connected component of at least 5 identical ordinary paying symbols, subject to the unresolved adjacency/grouping edge cases below.
- **Cascade step / tumble evaluation:** One settled grid evaluation. A step can contain **zero, one, or several qualifying clusters**. Simultaneous qualifying clusters share a payout multiplier.
- **Complete paid round:** One wager plus every cascade and any naturally triggered free-spin feature within that wager, ending when the round settles or the maximum-win cap is reached.
- **Blood charge:** One charge per qualifying winning cluster for the normal altar's three-charge level-up.
- **Blood Offering mark:** Special attribute attached to a normal paying symbol. A marked paying symbol contributes an Offering charge **only when it belongs to a qualifying winning cluster**.
- **Offering Sigil:** Separate three-charge meter used to trigger an entity intervention in bonus modes.
- **Intervention:** A special event that permanently raises the global altar to a **higher** allowed tier, with a provisional immediate-effect settlement convention detailed in §7.
- **Natural bonus:** A free-spin feature triggered by scatter symbols during a regular paid round.
- **Purchased bonus:** A mode directly bought for the published multiplier of `B`.
- **RTP:** `expected total paid amount / total amount wagered` over the weighted outcome distribution; not a session guarantee.
- **Win cap:** A maximum **total round payout** in base-bet units, distinct from the altar tier ceiling of ×2500.

All examples use hypothetical events to explain logic. They do **not** imply particular probabilities or achieved payouts.

---

## 4. Reel model, symbol taxonomy and connectivity

### 4.1 Layout and ordinary symbols

- **Grid:** 6 columns × 5 rows.
- **8 ordinary paying symbols:** placeholders `C1`–`C4` (four common symbols) and `P1`–`P4` (four premium symbols).
- **No conventional Wild symbols** in the initial design.
- **Scatter symbols:** Special trigger symbols, separate from the eight ordinary paying types. They award **no direct payout** in any mode. They are not Blood Offering marks.
- **Blood Offering:** an optional mark **on** ordinary paying symbols, not a ninth paying type. At most one mark can be attached per ordinary symbol instance.
- **Raw paytable:** separate entries for ordinary symbol type and qualifying cluster size or size bands (e.g., 5; 6–7; 8–10; 11+). **All numerical entries TBD.**

Potential thematic symbols (illustrative creative candidates, **not approved final symbol roster**): cracked reliquary, bone crown, sealed eye, ritual candle, ancient key, iron censer, bleeding chalice, forbidden manuscript. Avoid imitating specific Diablo iconography.

### 4.2 Creator's connectivity example

```text
x x x x x a
x x x a a a
x x x a a x
x x x x x x
x x x x x x
```

- The six `a` cells appear at row/column coordinates `(1,6), (2,4), (2,5), (2,6), (3,4), (3,5)`.
- They form **one connected component of 6** through horizontal and vertical adjacency, even though the shape crosses rows and branches.
- **CONFIRMED:** Edge-touching adjacency (up/down/left/right), evaluated using flood-fill/BFS or DFS over identical symbols. No straight line or rectangle is required.
- **RESOLVED R1:** Diagonal-only corner-touching does not connect symbols.
- **Critical sample caveat:** If every `x` above represents the **same ordinary paying symbol**, those 24 `x` cells also form a large qualifying cluster. If `x` merely represents arbitrary filler symbols, it must not be interpreted as a single paying type. This matters in implementations and unit tests.

### 4.3 Disconnected same-symbol groups / orphan clearing

Creator's latest expressed intention:

> If a connected cluster of a symbol wins on the right, other symbols of the same type on the left that are not connected to it should also disappear, but should not be included in that cluster's winning payout.

This is unusual for cluster-pays games and has meaningful implications. **Do not silently replace it with standard cluster clearing.**

**CONFIRMED behavior: Orphan clearing.** On a cascade step, if symbol type `S` has at least one qualifying connected group:

1. Identify and pay the qualifying group(s) using the paytable.
2. Remove their symbols for the cascade.
3. Also clear remaining, disconnected **non-qualifying** symbols of the same type `S` from the grid.
4. Do **not** pay, award blood charges, or collect Offering marks from those non-winning cleared symbols.
5. Collapse the grid and refill all positions cleared by this operation.
6. Do not clear symbols of a type that has **no qualifying cluster** merely because other symbols are winning.

**RESOLVED R2:** Every independent qualifying 5+ cluster of the same symbol type receives its own cluster payout and one ordinary blood charge. Smaller disconnected groups of that winning symbol type also clear, but receive no payout, blood charge, or collected Offering.

**Additional open detail:** In a single cascade, when several different symbol types win, orphan clearing should be applied independently by winning symbol type, with all removals evaluated against the same pre-clear board. Recommended, not explicitly confirmed.

This orphan-clearing feature is not equivalent to ordinary cluster pay evaluation and may require custom post-evaluation board-clear logic in the math engine. It could increase cascade frequency by removing additional cells without paying for them; test its effect on RTP and perceived fairness. The rules screen must disclose it if retained.

### 4.4 Cascade behavior

1. Reveal or settle the current 6×5 board.
2. Determine scatter conditions according to the applicable game mode and trigger rules.
3. Find all qualifying ordinary-symbol clusters on the same settled board.
4. If at least one cluster wins, calculate its raw payout and ritual effects using §6–7.
5. Clear winning cluster cells simultaneously, together with all non-qualifying disconnected cells of each winning symbol type. Those orphan cells do not pay or contribute charges.
6. Remaining symbols fall downward within columns; new symbols enter from above.
7. Evaluate the next settled board.
8. Continue until there are no more qualifying clusters, or the round ends because the eventual total-win cap is reached.

**CONFIRMED:** Scatters fall normally within their columns during tumbles. Count simultaneously visible scatters per settled board, without cumulatively counting appearances across boards. Award the highest natural feature reached once, after the base cascade chain finishes.

---

## 5. Ordinary altar and multiplier ladder

### 5.1 Selected tier ladder (provisional mathematically)

```text
×1 → ×2 → ×4 → ×8 → ×16 → ×32 → ×64 → ×120 → ×250 → ×500 → ×1000 → ×2500
```

- The ladder and ×2500 altar ceiling are **selected for testing**. Actual payouts and attainment probabilities are untested.
- The altar is a single **global multiplier**, not a separate multiplier per reel or symbol position.
- **Every qualifying winning cascade pays at its active global altar multiplier**, subject to the entity-intervention timing exception in §7.
- The base game begins at ×1 on every new paid spin and resets upon round completion.
- Bonus modes begin at their specified purchased/natural starting altar tier and retain it for the full feature, including its one permitted retrigger.

### 5.2 Blood collection and upgrades

- Each independent qualifying winning cluster awards **+1 ordinary blood charge**.
- **3 collected charges = +1 altar tier**.
- Excess charges **carry forward** and can cross **multiple** tier thresholds in one cascade.
- All simultaneous qualifying clusters are **paid at the same multiplier**. Ordinary blood charges are evaluated after identifying the winning clusters; their new multiplier becomes effective **from the following successful cascade**.
- At **×2500**, the normal blood meter visibly seals; the altar stays ×2500 until that bonus/round ends. Blood collected beyond the top tier cannot increase it.

**Example A:** At ×16 with 0/3 charge, three winning clusters disappear simultaneously. All three pay at ×16, then the altar reaches ×32 for the next cascade.

**Example B:** At ×16 with 0/3 charge, six independent winning clusters appear in one evaluation. They all pay at ×16. Six charges advance two tiers (×16 → ×32 → ×64), leaving 0/3 charge. The next cascade can pay at ×64. Six is the maximum simultaneous qualifying-cluster count on a 30-cell board with a five-cell minimum; it is not a total-win cap.

**Example C:** At ×16 with 2/3 charge, two clusters win. The current cascade normally pays at ×16; after counting both charges, the altar advances to ×32 and carries 1/3 charge. An intervention, if simultaneously triggered, uses the exception below.

**CONFIRMED (v1.3):** When the altar reaches ×2500, both the ordinary blood meter and Offering Sigil seal. Clear all unused charges in both meters, including overflow collected on that cascade. Ordinary progression to ×2500 takes effect for later cascades; without an entity intervention, the current cascade still pays at its previous altar tier.

---

## 6. Blood Offering Sigil

### 6.1 Eligibility and collection

- Blood Offering marks may appear on **ordinary paying symbols only**, at most **one mark per symbol**.
- Marks are collected only if their **host ordinary symbol** belongs to a qualifying winning cluster.
- **CONFIRMED:** An orphan-cleared but non-winning marked symbol does not pay or award blood or Offerings. Only marked symbols in qualifying winning clusters contribute Offering charges.
- A qualifying cluster contributes its **ordinary +1 blood charge** independently of Offering collection.
- A qualifying cluster containing, for example, two marked winning symbols contributes **+1 ordinary blood charge and +2 Offering charges**.
- The Offering Sigil has **three charges per intervention** and is separate from the ordinary blood meter.
- Offering progress persists across free spins and the one retrigger until the entire bonus feature ends.

### 6.2 Invocation and overflow

- At 3 Offering charges, the entity is eligible to intervene in a bonus-mode winning cascade.
- **At most one intervention resolves per cascade evaluation.**
- **CONFIRMED (v1.3):** Charges above 3 are banked. A stored complete set of three activates on the next eligible winning cascade even if no new marked symbols are collected there; at most one intervention resolves on that cascade.
- One intervention selects a multiplier tier **strictly higher** than the effective pre-intervention tier, up to ×2500.
- The award becomes the persistent altar tier; it is not a separate temporary multiplier or a multiplication of `old × award`.
- Smaller tier jumps are intended to be more common than extreme tier skips. **No actual probability weights have been defined.**

**Confirmed timing, illustrative tier award:** Altar ×16; three marked symbols are collected in a qualifying winning cascade, and normal progression remains below ×64. Suppose the predetermined Hollow Halo award is ×64. All qualifying clusters on that same triggering cascade pay once at ×64, and the persistent altar becomes ×64. The example specifies timing, not an intervention probability.

**CONFIRMED at altar ×2500 (v1.3):** Disable further promotions, seal both meters, and clear all pending/banked charges. If ordinary progression reaches ×2500 first, no higher entity tier exists, so no intervention occurs and the current cascade pays at its previous altar tier. If an entity promotion awards ×2500, the current cascade pays at ×2500. Later cascades retain ×2500 in either case.

### 6.3 Base-game intervention restriction

**CONFIRMED LATEST DECISION: Entity interventions cannot occur in ordinary paid base-game spins.** They are available in awarded/purchased bonus features, **including God Mode**, whose mandatory intervention occurs before its one initial spin. Interpret the phrase “exclusive to free-spin bonuses” as excluding ordinary base and boosted spins, **not** as canceling the separately confirmed God Mode intervention. This supersedes an earlier suggestion to permit interventions during normal paid spins.

**CONFIRMED (v1.4):** Blood Offering marks never appear during ordinary standard/base or boosted/ante spins, including every cascade in that base-game portion. Marks may appear only after entry into eligible feature/bonus play, including God Mode. Purchased Lesser/Blood/Greater share the same Offering probability; its numerical value remains undefined. Base/ante Offering-mark probability is zero.

---

## 7. Deterministic settlement order for simultaneous events

Payout timing, upgrade priority, banked Offering scheduling, and altar-cap behavior below are **CONFIRMED in v1.3**. The algorithm expresses those rules without double crediting. Event format and presentation sequencing remain implementation guidance; paytable values, outcome probabilities, and the separate total-round win-cap amount/clipping details still require definition and validation.

### 7.1 Key creator selections

1. Normal altar level-ups are evaluated **before** entity promotions.
2. Normal upgrades do not retroactively change the pay for their triggering cascade.
3. **Entity promotions do** apply immediately to every qualifying cluster on their triggering winning cascade, including when a previously banked complete Offering set triggers without new marks.
4. All qualifying clusters within one cascade use **one global payout multiplier**.
5. Excess Offering charges can trigger **at most one intervention per cascade**; others remain banked for later eligible cascades.

### 7.2 Atomic cascade algorithm — confirmed payout ordering

For each settled board containing one or more qualifying winning clusters:

1. Snapshot `altar_before`, `blood_before`, and `offerings_before`.
2. Identify every qualifying connected cluster and determine all raw cluster payouts **before** clearing any cells.
3. Calculate total raw payout `raw_sum = sum(paytable(symbol, cluster_size))`.
4. Count normal blood increments = number of qualifying winning clusters; compute resulting post-step tier by spending sets of 3 charges, carrying remainder, up to tier ×2500.
5. Unless the altar was already sealed at ×2500, collect Offering increments = number of marked winning ordinary symbols; add these to any banked Offering progress. Already sealed meters collect no charges.
6. If interventions are allowed, the post-normal-upgrade tier is below ×2500, and total stored Offerings are at least 3, resolve at most one intervention. Draw a target tier strictly above the post-normal-upgrade tier, deduct 3 Offering charges, and bank the rest. A banked complete set qualifies even with zero new marks. Otherwise do not intervene; in particular, ordinary progression to ×2500 suppresses intervention.
7. Determine the **single payout multiplier** for all clusters on the current board:
   - If an eligible entity intervention resolves: `payout_multiplier = promoted_tier`.
   - Otherwise: `payout_multiplier = altar_before`.
8. Credit the current cascade as `raw_sum × payout_multiplier` (then clip to remaining overall round cap if a cap is chosen).
9. Commit persistent altar = promoted tier if intervention occurred; otherwise post-normal-upgrade tier. If the committed altar is ×2500, clear all remaining ordinary blood and Offering charges to zero and seal both meters. This does not retroactively change the payout multiplier chosen in step 7.
10. Emit deterministic, ordered events for the frontend: winning cells and raw values; normal blood fill; normal tier transition; Offering fill; entity invocation/selection; finalized payout multiplier and credited win; clearing/falling/refill (specific animation sequence may visually defer effects but cannot change outcome).
11. Stop if the total win cap is reached; otherwise continue to the next cascade.

**CAUTION:** Steps 4–7 intentionally make a same-cascade intervention override the otherwise-applicable current multiplier while preserving the normal level-up calculation first. This exception is conceptually complex; display it clearly and unit-test it thoroughly.

### 7.3 Worked simultaneous example

Starting state: `altar = ×16`, ordinary blood `2/3`, Offering Sigil `2/3`. New board produces **two qualifying winning clusters**, one of which contains **one marked winning symbol**.

- Both clusters are found and raw payouts summed.
- Two ordinary blood charges move the meter from 2 to 4 charges, advancing the normal altar one tier to **×32** and leaving **1/3** charge.
- One Offering charge raises the sigil from 2 to 3, activating an intervention.
- Suppose the independently predetermined intervention outcome is **×120** (hypothetical).
- **Both clusters on this very cascade receive ×120**, not ×16 and not ×32.
- The persistent altar becomes **×120**; 1 ordinary blood charge carries into the following cascade; Offering progress resets to 0 after consuming 3 charges.

If the intervention had **not** occurred, the same two clusters would have paid at **×16** and the altar would have progressed to **×32** for the next cascade.

### 7.4 Confirmed altar-cap and Offering-overflow rules

- **CONFIRMED:** If ordinary leveling reaches ×2500 on the same cascade that completes or already holds an Offering set, disable the intervention because no higher tier exists. Pay the current cascade at `altar_before`, commit ×2500 for later cascades, clear unused charges in both meters, and seal them.
- **CONFIRMED:** If banked Offerings already contain 3+ at the start of the next eligible winning cascade, they activate without any newly collected marks. Eligibility still requires an intervention-enabled feature and a post-normal-upgrade tier below ×2500.
- **CONFIRMED:** Draw at most one entity result per eligible winning cascade. Remaining complete Offering sets wait for later eligible winning cascades; they never resolve together on the same cascade.
- **CONFIRMED:** An intervention never decreases or repeats a tier. An entity award of ×2500 applies immediately to the current cascade, then both meters seal and unused charges clear. Subsequent cascades retain ×2500 without further interventions.
- **STILL OPEN:** The separate total-round maximum and exact concurrent-cluster clipping allocation remain to be defined. Any selected cap must apply to aggregate actual credited win. The altar ceiling ×2500 is not itself that total-win cap.

---

## 8. Natural free spins and scatter behavior

### 8.1 Natural bonus thresholds — confirmed

| Scatter count | Natural bonus |
|---|---|
| Exactly 3 | **Lesser Rite** |
| Exactly 4 | **Blood Rite** |
| 5 or more | **Greater Rite** |

- Count qualifying scatter symbols **anywhere** on the 6×5 board; they need not occupy separate reels.
- Base-game scatter checks may occur on the initial board **and on boards created during cascades**.
- **CONFIRMED:** Award one natural bonus per paid round: the highest qualifying tier reached on any settled board of the base cascade chain. Start it after that chain finishes.
- Natural versions of Lesser, Blood, and Greater use the same 10/12/12 free-spin counts and x8/x16/x32 starting altars as their corresponding bought versions, **WORKING interpretation**. Whether a naturally triggered feature uses precisely identical probabilities to its direct purchase must be evaluated and disclosed.

**RESOLVED:** Evaluate 3/4/5+ simultaneously visible scatters on each settled board. Do not accumulate scatter appearances from separate boards.

**RESOLVED:** If one board qualifies for Lesser and a later board qualifies for Greater, award Greater once, after the base cascade chain finishes. Retain only the highest unlocked feature tier.

**RESOLVED:** Scatters fall normally with other remaining symbols; there is no special fixed-position or cumulative-scatter retention mechanic.

### 8.2 Bonus trigger timing and natural transition

- Do not interrupt an already-settling cascade prematurely unless the math book explicitly defines that transition.
- **WORKING recommendation:** Finish evaluating the paid base-spin outcome, choose its one naturally awarded bonus according to the final trigger rules, reset the ordinary base-game altar, and enter the awarded free-spin mode at its specified start tier with both bonus meters empty.
- The point at which a natural bonus starts and whether its bonus payouts are part of the same overall bet are important for the final win cap and Stake Engine book structure.

---

## 9. Purchased bonus menu and rules

All purchase multipliers below are relative to the **current base bet B**. A selected `$1` base bet makes a `200×` buy cost **$200**, not $2, and an altar `×16` is a *separate* win multiplier.

| Mode / internal working ID | Cost | Initial feature spins | Starting altar | Confirmed behavior |
|---|---:|---:|---:|---|
| Standard/base (`base`) | **1× B** | 1 paid spin | ×1 | Cascades; may naturally trigger free spins |
| Enhanced Chance (`ante_15`) | **1.5× B** | 1 paid spin | ×1 | Increase scatter/bonus-trigger odds only |
| Maximum Chance (`ante_30`) | **3× B** | 1 paid spin | ×1 | Higher scatter/bonus-trigger odds only |
| Lesser Rite (`lesser`) | **100× B** | **10 free spins** | **×8** | Three-charge altar; Offering Sigil and interventions |
| Blood Rite (`blood`) | **200× B** | **12 free spins** | **×16** | Same fundamental rules and Offering probability as Lesser |
| Greater Rite (`greater`) | **500× B** | **12 free spins** | **×32** | Same fundamental rules and Offering probability as Lesser/Blood |
| Mystery Rite (`mystery`) | **250× B** | Non-paying reveal animation, then awarded feature | Depends | Weighted selection, potentially Epic |
| God Mode (`god`) | **1500× B** | **1 initial spin** | Pre-spin intervention ≥×250 | No guaranteed win; cascades and Offerings can occur |

**CONFIRMED:** Higher-cost Lesser/Blood/Greater modes do **not** inherently use higher Blood Offering probabilities. Separate overall board or symbol weighting may nevertheless be mathematically necessary and is allowed as a modeling design choice, provided game rules and regulatory constraints are met.

### 9.1 Ante/boosted spins

- Enhanced Chance (1.5×) and Maximum Chance (3×) affect **scatter/bonus-trigger probability only**.
- Their exact trigger probabilities, relative ratios, chance of 3/4/5+ scatters, and whether natural feature composition changes are **UNTESTED/OPEN**.
- Both modes have separate **96% target RTP measured against their actual 1.5× / 3× purchase cost**.
- Do not assume a 1.5× purchase means 1.5× bonus odds; those multipliers describe the **cost**, not an established probability ratio.

### 9.2 Starting bonus state

**CONFIRMED:** Purchased Lesser/Blood/Greater start at their specified multiplier with **0 ordinary blood charges** and **0 Offering charges**. The altar and meters persist across all free spins and one retrigger within the bought bonus.

### 9.3 Single retrigger rule

For Lesser, Blood, and Greater, both purchased and naturally triggered:

- At most **one retrigger per entire bonus**.
- **CONFIRMED (v1.4):** A retrigger occurs when **3 or more scatters** are simultaneously present on a single free-spin initial board, before any cascades. This includes initial boards containing 4, 5, or more scatters.
- The retrigger adds **+5 free spins**.
- Persist the **current altar multiplier, normal blood charge count, and Offering Sigil charge count** unchanged.
- Additional scatters after the retrigger has already been consumed award no second retrigger.

**CONFIRMED (v1.4):** Scatters award no separate/direct payout in any mode. They fall normally when other symbols tumble; scatter counts on later bonus cascade boards cannot trigger a retrigger. The initial-board threshold is 3 or more, not exactly 3.

**CONFIRMED:** God Mode does **not** add initial spins and is not included in Lesser/Blood/Greater retrigger rules. Epic Rite has no settled rules yet.

---

## 10. God Mode — 1500× base bet

**CONFIRMED:** One **initial** spin. Before the reel result is shown, the entity performs a **guaranteed intervention** selecting one of the altar tiers:

```text
×250, ×500, ×1000, ×2500
```

- Tier selection is **weighted**; **weights UNTESTED**.
- The intervention happens **before the only initial spin**, even if no winning clusters appear later.
- **No payout is guaranteed.** A zero-win result is mathematically possible.
- The single initial spin can produce **multiple ordinary cascades**.
- Ordinary blood charges, normal altar progression, and additional qualifying Blood Offerings/interventions remain active throughout that cascade chain, subject to the ×2500 cap and one-intervention-per-cascade rule.
- No additional initial spins are awarded.

**Design warning:** The label “God Mode” can sound as if winnings are guaranteed. The rules/purchase UI must clearly distinguish **guaranteed intervention** from **guaranteed payout**.

At the 96% design target, a 1500× purchase requires an **expected total payout of 1440× B**; this is not a promise that any single God Mode returns 1440× B. Pricing feasibility is unverified, particularly at x250 or above with cascades.

---

## 11. Mystery Rite — 250× base bet

### 11.1 Selected distribution target

| Selected outcome | Target probability | Follow-on bonus |
|---|---:|---|
| Lesser Rite | **40%** | 10 free spins, ×8 start |
| Blood Rite | **40%** | 12 free spins, ×16 start |
| Greater Rite | **15%** | 12 free spins, ×32 start |
| **Epic Rite** | **5%** | **Unique feature, not yet designed** |
| **Total** | **100%** | |

**These percentages are provisional selection targets, subject to math balancing. They are not verified published probabilities.**

### 11.2 Mystery reveal experience

**CONFIRMED user preference:** Buying Mystery Rite starts with a mystery reel reveal animation showing the selected bonus. The revealed bonus then plays normally.

**CONFIRMED (v1.4):** The Mystery reveal is presentation only, not an independently win-eligible spin. It awards zero additional payout; all winnings for the 250× purchase come from the awarded feature.

The selection outcome must be established by the validated math/RGS outcome and **not** chosen by frontend reel animation. The reveal must represent the selected result honestly; avoid false near-hit displays or claims that a selected Epic outcome was almost reached.

### 11.3 Epic Rite

- **CONFIRMED:** Epic Rite is **unique** and accessible **only through Mystery Rite**.
- **CONFIRMED:** No direct Epic purchase.
- **OPEN:** Exact mechanics, free-spin count, starting altar, intervention rules, symbol distribution, retriggers, audiovisual transformation, and expected payout.
- Earlier brainstorming mentioned an Epic ×250 start, but this was **not selected**; do **not** lock it as a rule.

### 11.4 Mystery expected-value constraint

If Lesser, Blood, and Greater each reach precisely **96% RTP** against their respective purchase costs, their target mean payouts in base-bet units are:

- Lesser: `100 × 0.96 = 96× B`
- Blood: `200 × 0.96 = 192× B`
- Greater: `500 × 0.96 = 480× B`

The Mystery purchase at 250× B with 96% target RTP must average `250 × 0.96 = 240× B`.

With the confirmed non-paying reveal, and assuming the component mean payouts above and the provisional selection mix, the target implies:

```text
0.40 × 96 + 0.40 × 192 + 0.15 × 480 + 0.05 × E = 240
38.4 + 76.8 + 72 + 0.05E = 240
E = 1,056× B
```

Thus the **Epic Rite must have a conditional average payout of 1,056× the base bet** if those component means and selection weights hold. This is a **derived requirement, not a guaranteed Epic payout and not a simulation result**. Changing selection weights or component mean payouts changes this requirement. The reveal contributes zero payout under the confirmed rule.

---

## 12. Mathematical model, 96% RTP and high volatility

### 12.1 Confirmed targets vs untested reality

**CONFIRMED target:** **96% RTP for each distinct mode**, including base, 1.5× booster, 3× booster, Lesser, Blood, Greater, Mystery, and God Mode. Epic's contribution must be included in Mystery math; if Epic is ever introduced as a separate eligible mode, its requirements must be specified then.

**CONFIRMED qualitative profile:** **High volatility**. Not yet quantified. High volatility is about payout variability, not an assurance of larger expected player returns.

**OPEN:** A maximum **total win per round**, measured in base-bet multiples, common across all modes. The cap is **not** synonymous with the ×2500 altar ceiling.

**CONFIRMED eventual cap behavior:** Upon reaching the selected total-win cap, credit only up to that amount and **immediately end the round**, clearly displaying the maximum-win event. Exact clipping and concurrent-cluster payout ordering require deterministic specification and testing.

### 12.2 Target payout examples at B = $1

| Mode | Purchase cost | 96% target average payout |
|---|---:|---:|
| Base | $1 | $0.96 |
| Enhanced Chance | $1.50 | $1.44 |
| Maximum Chance | $3 | $2.88 |
| Lesser | $100 | $96.00 |
| Blood | $200 | $192.00 |
| Greater | $500 | $480.00 |
| Mystery | $250 | $240.00 |
| God Mode | $1,500 | $1,440.00 |

These figures are simply `cost × 0.96` and **do not demonstrate that the proposed mechanics can reach those numbers**.

**RTP formula (for each mode `m`):**

```text
RTP_m = sum_over_outcomes(probability_i × total_round_payout_i) / mode_cost_m
```

Equivalently, when probabilities are represented as nonnegative selection weights, normalize each weight by the total weight for that mode. Report all RTP calculations from the **final published** weighted distribution, not just informal Monte Carlo estimates.

### 12.3 Untested parameters — never fabricate

The following have **no approved numeric values**:

- Eight-symbol base paytable values and cluster-size bands.
- Symbol frequencies and reel-generation distributions, by mode.
- Scatter symbol frequency, interaction with cascades, base bonus trigger rates, and booster odds.
- Blood Offering mark frequency (the *same* between Lesser/Blood/Greater, but not numerically specified).
- Conditional probability of each entity promotion tier as a function of current altar tier and mode.
- Distribution of cascades, number of independent winning clusters per cascade, and ordinary level-up rates.
- Probability of reaching ×2500, expected time at high altar tiers, and possible resulting payout exposure.
- Retrigger probability and impact of +5 free spins on every eligible bonus.
- God Mode outcome and intervention-tier probabilities.
- Mystery Epic mechanics, resulting conditional payout distribution, and any altered Mystery weights.
- Win cap, actual win-cap probability, variance/standard deviation, payout quantiles, tail risk, payout frequency, and jackpot-like extreme outcome frequencies (no progressive jackpot feature is planned).
- Final verified 96% RTP by mode, platform acceptance, legal compliance, and studio economics.

### 12.4 Math-balancing priority

**Selected approach:** Try tuning **symbol/reel distributions and intervention weights first**. Preserve a single raw symbol paytable across modes if feasible, while allowing mode-specific board/symbol probability distributions as needed. Keep Offering probability identical among Lesser/Blood/Greater. If the desired RTP cannot be reached without violating the agreed rules, **report the contradiction and propose changes to pricing or mechanics**, instead of covertly adjusting outcomes or misreporting RTP.

No system can guarantee the casino never experiences a losing period. A 96% theoretical RTP corresponds to a 4% theoretical house edge **before operator costs**, not a guaranteed 4% income on each bet, player, day, or payout sequence. Studio revenue/profit sharing is a separate commercial arrangement.

### 12.5 Required simulations and audits

1. Begin with small deterministic tests and inspect all relevant state/event sequences.
2. Implement raw paytable and grid-generation candidates.
3. Simulate and/or enumerate enough results per mode to characterize reward distributions; rare tail outcomes require careful targeted sampling and analysis.
4. Measure **RTP per mode**, symbol-group hit rates, payout frequencies, average qualified clusters per tumble, tumble-chain lengths, blood-level progression, Offering accumulation, invocation distribution, cap frequency, retrigger frequency, percentage of zero-payout bonuses, and payout quantiles.
5. Compare candidate maximum-win caps and their effect on mode RTP and advertised gameplay.
6. Verify independent weighted outcome-library RTP, event-level payout reconciliation, integer/decimal rounding, and no missing results.
7. Have math and game logic independently reviewed before any real-money release.

**Feasibility constraint:** Because God Mode costs 1500× B and its 96% target mean is 1440× B, a universal win cap **below 1440× B** makes that RTP mathematically impossible in God Mode; any nonzero probability of a zero payout implies the maximum possible payout must be **strictly above** the required mean. The chosen cap must be compatible with every mode’s target expectation, not simply its visual multiplier ladder.

**No simulations have been run for this GDD.**

---

## 13. Event and game-state architecture — Stake Engine first

### 13.1 Platform approach

- Build and validate the **math/game logic independently** of visual rendering.
- Stake Engine's documented Math SDK includes Python game modeling, cluster-win calculation helpers, event generation, simulations, lookup tables, and mode configuration.
- The frontend may use Stake Engine's PixiJS/Svelte SDK or compatible custom rendering, but must consume the resolved server/outcome-book events as its source of truth.
- Engine's game format is **stateless across bets**. All altar and meter persistence in this GDD is **within a single wagered round and its free-spin feature**, never from one unrelated wager to the next.
- Game outcomes are selected from the platform's pre-generated, weighted library; the UI must **not** re-roll or revise a game outcome because of animation, previous wins, the current bet amount beyond the selected mode, or player behavior.

### 13.2 Recommended mode identifiers (working names)

```text
base
ante_15
ante_30
lesser
blood
greater
mystery
god
```

Epic is a Mystery outcome/feature **within** the `mystery` mode, not an independently purchasable mode unless later approved.

### 13.3 Recommended simulation state per round (not a finalized API schema)

```text
mode_id
base_bet
purchase_cost_multiplier
spin_index
spins_remaining
retrigger_used
board[5][6]
altar_tier_index
altar_multiplier
normal_blood_charges   # 0–2 until sealed; may temporarily overflow in calculation
offering_charges       # can bank >2 after a multi-mark cascade
interventions_enabled
intervention_count
last_intervention_award
round_total_win_base_bet_units
round_win_cap_reached
current_cascade_index
```

For every winning cluster, record:

```text
symbol_id
positions[]
size
raw_payout_base_bet_units
marked_winning_positions[]
credited_payout_base_bet_units
```

For the confirmed orphan-clearing rule, also record `nonpaying_cleared_positions[]` separately so these cells cannot mistakenly collect Offerings or blood charges.

### 13.4 Example semantic event types (custom event design; NOT an existing API contract)

```text
roundStart
initialReveal
scatterCounted
qualifyingClustersFound
clusterWinCalculated
normalBloodCollected
altarLevelUp
bloodOfferingCollected
offeringSigilCompleted
entityInterventionAwarded
cascadePayoutCredited
winningAndOrphanSymbolsCleared
tumbleRefill
naturalBonusAwarded
freeSpinsStarted
freeSpinsRetriggered
freeSpinsUpdated
maxWinReached
roundFinished
```

Front-end events must fully explain the state: winning positions, any non-paying cleared positions, each payout and multiplier, normal and Offering charges, resulting altar tier, triggering intervention, awarded extra spins, and final credited payout. A replay must reproduce the same outcome and payline/cluster settlement identically.

### 13.5 Platform reference notes (checked October 2026)

Useful official starting points:

- [Stake Engine Math overview](https://stake-engine.com/docs/math)
- [Stake Engine cluster pays](https://stake-engine.com/docs/math/source-files/calculations/cluster)
- [Stake Engine math file format](https://stake-engine.com/docs/math/math-file-format)
- [Stake Engine events](https://stake-engine.com/docs/math/game-state-structure/events)
- [Stake Engine approval guidelines](https://stake-engine.com/docs/approval-guidelines)
- [Frontend display and communication rules](https://stake-engine.com/docs/approval-guidelines/front-end-communication)
- [Bet Replay requirements](https://stake-engine.com/docs/approval-guidelines/game-replay-requirements)

Platform docs describe pre-calculated outcomes mapped to weights, per-mode game files, event-based frontend playback, mobile/popout support, paytable and RTP disclosure, and stateless independent bets. **Current submission requirements must be checked again before release.** Bet Replay is documented as mandatory for new game approvals. Use original assets; sample SDK artwork is not production-cleared.

---

## 14. Visual and narrative direction

### 14.1 Cathedral

- Vast ruined gothic architecture; black stone, tarnished metal, pale ash, deep crimson blood, sparse warm candles, restrained spectral illumination.
- Clear distinction between decorative shadows and **high-contrast reel symbols and multiplier values**.
- Visual progression through genuine altar tiers: subtle stained-glass distortion, white halo flicker, cracks in ceremonial stone, metallic tension, environmental shadows reacting to recorded gameplay events.

### 14.2 Hollow Halo

- An **absolute black circular void** with a narrow pale white luminous rim and occasional orbiting geometric glyphs.
- Remains **abstract and unknowable**. It does **not** reveal a humanoid demon, monstrous face, giant horns, or conventional deity form at max multiplier.
- During actual intervention events, geometry/light may briefly distort; do not tease nonexistent or nearly selected big rewards through misleading near-hit animation.
- Alternate visual intensity for small versus large **actual awarded** tier promotions, while ensuring the numerical result is plainly legible.

### 14.3 The priest

- A single enigmatic ritual officiant, partially cloaked, weathered ceremonial attire; neutral idle movements in base play.
- **Kneels upon entry into a free-spin bonus** and remains in ritual posture while the feature continues.
- Gradually becomes visibly possessed or physically affected at higher altar tiers, through posture, voice, clothing/chains, and subtle environmental reactions, not explicit gore.
- The actor's movements **react to actual resolved game events**; they do not secretly indicate changing probabilities or imply that an unrevealed payout is imminent.
- God Mode has a distinct pre-spin invocation ritual to convey its genuinely guaranteed intervention, not a guarantee of winnings.

### 14.4 Blood altar and Offering Sigil UI

Use one central ritual assembly with **two clearly distinct indicators**:

1. **Outer blood ring / ordinary meter:** each **winning cluster** grants one charge, 3 charges advance one tier. Shows the current tier prominently; overflow and simultaneous multi-tier progress must be visibly correct.
2. **Inner Offering Sigil:** marked **winning symbols** grant Offering charges. Three trigger one intervention. Extra charges can bank for later eligible cascades.

The visual metaphor must not hide the mathematical distinction. The normal altar meter is not the same as the Offering Sigil, and a marked winning cluster can contribute to both.

### 14.5 Audio and animation

- Cinematic audio palette: low choir, metal resonance, ritual murmurs, wind, stone movement, and disciplined use of silence. All audio must be original/cleared.
- **Cinematic default**, with skippable win animations where permitted; reduced-motion settings; faster gameplay where permitted, while preserving readable win and payout displays.
- Display real credited wins accurately throughout the cascade chain; do not overstate payout certainty, stage misleading near-misses, or modify results in response to player behavior.

### 14.6 Mobile and smaller layouts

- The reel grid remains visually dominant on all sizes.
- Desktop can place the priest beside the reels; mobile compresses or repositions the priest and meters above/below the grid while keeping multiplier and win information readable.
- Support commonly used mobile sizes and platform popout/small-player modes.
- Settings, rules/paytable, mode cost, current balance, bet selector, mute, and actual payout info must remain usable.

### 14.7 Game marketing / description candidate (working copy)

> Beneath an abandoned cathedral, each winning cluster offers blood to a forbidden altar. Build its multiplier, collect marked Offerings, and witness the Hollow Halo intervene in ways no priest can explain. Ten and twelve-spin rituals, a Mystery Rite, and one-spin God Mode offer distinct ways to enter the ceremony.

*Marketing copy is not final, and must be checked against actual verified features and appropriate responsible-gambling advertising rules.*

---

## 15. Responsible presentation and commercial safeguards

- RTP is an expected average over the weighted result distribution, **not** the probability that any player profits and not a promise to return 96% on each bonus.
- Do not intentionally imitate a high-value near-win that the outcome generator did not select.
- Clearly show the purchase cost in base-bet multiples and currency amounts before the player confirms.
- Clearly disclose that **God Mode guarantees an intervention but not a winning payout**.
- State each mode's actual certified RTP, verified maximum win, payable clusters, promotion tiers, collection rules, and bonus-trigger rules in the player-facing rules/paytable when finalized.
- Do not implement loss-responsive, player-profile-responsive, or bet-history-responsive hidden probability adjustments.
- Honor operator/jurisdiction rules for age restrictions, spending limits, purchase modes, autoplay, spin speed, and responsible-gambling features.
- A theoretical 4% house edge does not ensure risk-free casino operation or guaranteed publisher revenue.

---

## 16. Testing and acceptance matrix

### Core cluster logic

- [ ] A bent/snake-shaped orthogonally connected group of 5+ matching symbols pays, including the exact `a` shape supplied by the creator.
- [ ] A group of 4 identical symbols is not a qualifying cluster.
- [ ] Two qualifying clusters of **different** types on one settled board both pay, each adding one normal blood charge.
- [ ] A single cluster pays based on its **own** symbol type and size, not the total count of that symbol anywhere on the grid.
- [ ] Two independent qualifying clusters of the same symbol type both pay separately and each award one ordinary blood charge (confirmed R2).
- [ ] Disconnected non-winning symbols of an already winning type clear with zero payout, zero blood charges, and zero collected Offering marks.
- [ ] `x` placeholder confusion in supplied grid is resolved with actual symbol identifiers in tests.
- [ ] Diagonal-only contact never connects two same-symbol groups (confirmed R1).

### Normal blood and multiplier logic

- [ ] One qualifying cluster gives one blood charge.
- [ ] Three simultaneous clusters pay at the same original multiplier; new tier starts after that cascade (without intervention).
- [ ] Six clusters from an empty ordinary meter advance two levels and leave zero charges. Five clusters starting with 2/3 charges advance two levels and leave 1/3.
- [ ] Starting with 2/3 charges, multiple clusters cause the expected tiers and rollover.
- [ ] At ×2500, the meter seals; no multiplier above ×2500 is produced.
- [ ] Base spin resets its altar and charges for the next unrelated paid bet.
- [ ] Purchased and naturally triggered free-spin state persists across every feature spin and its single retrigger.

### Blood Offerings and intervention

- [ ] A marked winning symbol contributes one Offering; multiple marked symbols in one cluster each contribute one.
- [ ] An unmarked winning cluster contributes ordinary blood but no Offering.
- [ ] A non-winning, orphan-cleared marked symbol yields no Offering.
- [ ] Exactly three Offerings lead to one eligible intervention.
- [ ] 6+ Offerings collected in a single cascade trigger at most one intervention; remainder is banked.
- [ ] A banked complete Offering set triggers on the next eligible winning cascade even with zero new marks; no more than one intervention resolves per cascade.
- [ ] An intervention selects only a tier **higher** than the post-normal-upgrade tier and ≤×2500.
- [ ] When normal level-up and intervention coincide, the whole current winning cascade receives the intervention tier and is credited exactly once.
- [ ] If normal progression reaches ×2500 with a complete Offering set, no intervention occurs: current payout uses the previous altar, future payouts use ×2500, and both counters clear and seal. If an entity awards ×2500, the current payout uses ×2500 and both counters clear and seal.
- [ ] No entity intervention occurs and no Offering marks appear during any ordinary standard/base or boosted/ante spin or its cascades.

### Scatters, bought features and Mystery

- [ ] Exactly 3 / exactly 4 / 5+ simultaneous eligible scatters trigger the appropriate natural bonus, subject to final cascade-timing rules.
- [ ] Natural bonus cannot multiply-award several features in a single paid round unless specifically redesigned.
- [ ] Initial free-spin boards with 3, 4, or 5+ simultaneous scatters each trigger +5 spins, at most once per Lesser/Blood/Greater feature. Scatters award no direct payout in any mode.
- [ ] Even 3+ simultaneous scatters on a later bonus cascade board cannot retrigger; only the initial free-spin board is eligible.
- [ ] Naturally triggered and bought Lesser/Blood/Greater have correct starting tiers and counts.
- [ ] God Mode's pre-spin tier is one of ×250/×500/×1000/×2500; it can pay zero; one initial spin can cascade multiple times.
- [ ] Mystery's non-paying reel reveal displays a preselected Lesser/Blood/Greater/Epic result, never re-rolls via UI effects, and adds zero payout to the awarded feature's winnings.
- [ ] Epic is never directly purchasable.
- [ ] Bonus costs are correctly represented in actual wager currency and payout math.

### Statistical tests and production acceptance

- [ ] RTP computed and independently reconciled from final published weights for **every** mode.
- [ ] High-volatility claim backed by numeric payout-distribution statistics.
- [ ] Maximum payout cap selected, enforced, publicly displayed and audited per mode.
- [ ] No rounding/overflow issues when raw payout is multiplied by ×2500 or clipped at the win cap.
- [ ] No frontend-side payout changes; visible win totals exactly match RGS output.
- [ ] Replay reproduces the same result for all important outcomes; covers errors and mobile/popout views.
- [ ] Original licensed/owned visuals and audio; legible rules/paytables/bonus costs/verified RTP/caps.
- [ ] Stake Engine approval, legal and regulatory checks passed before production launch.

---

## 17. Remaining open decisions — prioritized

These are the **actual unresolved items**, not silently defaulted design features.

### Decision register before production math freeze

Items 1–5 were resolved in v1.2; items 7–9 in v1.3; items 6 and 15 in v1.4. They are retained for traceability. The remaining open numbered decisions below are items 10–14. The 3+ initial-board retrigger threshold and zero direct scatter payout are also confirmed in v1.4 (§9.3).

1. **RESOLVED — R1 connectivity:** Orthogonal only; diagonal-only touches do not connect symbols.
2. **RESOLVED — R2 same-symbol groups:** Every disconnected qualifying 5+ group pays separately and awards one blood charge.
3. **RESOLVED — R2 orphan clearing:** Smaller disconnected groups of a winning type clear without payout, blood, or collected Offerings, including when those non-winning cells carry marks.
4. **RESOLVED — Scatter persistence/counting:** Scatters fall normally; evaluate simultaneous visible counts on each settled board, not cumulative appearances.
5. **RESOLVED — Natural bonus selection:** Award the highest qualifying bonus once, after the base cascade chain finishes.
6. **RESOLVED — Offering marks in base mode:** No Offering marks appear in ordinary base or boosted/ante play, including its cascades. Marks are available only in eligible bonus/feature play.
7. **RESOLVED — Offering overflow timing:** A banked complete set activates on the next eligible winning cascade without requiring new marks, limited to one intervention per cascade.
8. **RESOLVED — At-cap handling:** At ×2500 clear and seal both meters. Normal progression to the cap suppresses intervention and affects later payouts; an entity award of ×2500 affects the current payout immediately.
9. **RESOLVED — Same-cascade payout settlement:** Evaluate normal progression before entity selection. A qualifying entity award applies globally to the current cascade and persists; otherwise current payout uses the previous altar. Credit once. Separate total-round cap/clipping details remain open under item 13.
10. **Individual symbol types, raw payouts and cluster-size payout bands:** Not specified yet; central to any viable RTP model.
11. **Exact scatter trigger probabilities** by mode and **Offering probabilities in eligible feature play**, required to balance the 96% target. Offering probability is zero during ordinary base/ante play; Lesser/Blood/Greater share the same undefined feature Offering probability.
12. **Exact intervention tier distributions** conditional on current altar and mode, plus God Mode guaranteed-tier weights.
13. **Exact total-win cap** and deterministic simultaneous payout clipping, selected after simulation.
14. **Epic Rite** mechanics and conditional payout distribution; blocks final 250× Mystery mode evaluation.
15. **RESOLVED — Mystery reveal:** Presentation only, with no separate paying spin or additional payout. The 1,056× Epic conditional mean remains a derived requirement subject to the stated component means and provisional selection weights.

### Lower-priority UI and creative refinements

16. Eight final paying symbol designs and ranks, Scatter visual, Offering mark shape, and specific rune/altar graphic identity.
17. Detailed timing, audio stems, animation transitions, and accessibility text for every game event.
18. Priest transformation milestones relative to altar tiers.
19. Exact game-rule wording, localization, jurisdiction-specific mode availability and price display conventions.
20. Trademark clearance and final title registration/assets ownership.

### What is explicitly **not** open unless revisited

- 6×5 cluster-pays format; 5+ minimum.
- Eight ordinary paying symbol types, no standard wild.
- One normal blood charge per qualifying cluster.
- Three normal charges per tier, multi-level overflow.
- Standard tier ladder ending at ×2500.
- Separate, three-charge Offering Sigil; marks on ordinary paying symbols only, absent in ordinary base/boosted play; multiple marked winning symbols count.
- Permanent strictly upward interventions with smaller jumps generally favored; only in bonus modes.
- 100×/200×/500× purchased free-spin tiers with 10/12/12 spins and ×8/×16/×32 start.
- +5 free-spin retrigger, maximum once per Lesser/Blood/Greater feature, requiring 3+ simultaneous scatters on the initial free-spin board before cascades. Scatters award no direct payout.
- 1.5× and 3× booster costs affecting bonus-trigger odds only.
- 250× Mystery with a non-paying reveal animation and proposed 40%/40%/15%/5% mix; unique Mystery-exclusive Epic.
- 1500× God Mode: one initial spin, pre-spin guaranteed intervention ≥×250, no guaranteed payout.
- 96% per-mode RTP **target**; high-volatility **target**; uniform win cap amount left open until simulation.
- Hollow Halo remains unknowable; priest kneels during bonus; stylized blood without explicit gore; original art, responsive mobile design, Stake Engine-first architecture.

---

## 18. Implementation roadmap

### Phase 0 — Resolve blockers

Connectivity, disconnected groups/orphan clearing, scatter movement/counting, highest-tier natural bonus selection, intervention timing, banked Offering scheduling, altar-cap behavior, absence of marks in base/boosted play, the 3+ initial-board retrigger threshold, zero direct scatter payout, and the non-paying Mystery reveal are confirmed. Resolve other explicitly OPEN/WORKING details, paytable/probabilities, and total-round cap. Define Epic Rite before final Mystery evaluation. Publish versioned finalized math rules.

### Phase 1 — Headless deterministic prototype

Build grid state, confirmed orthogonal cluster detection, paytable hooks, cascade and custom orphan-clear logic, blood-charge overflow, dual-meter mechanics, confirmed intervention settlement and altar-cap behavior, God Mode pre-award and free-spin state. Add unit/property tests before expensive graphical production.

### Phase 2 — Statistical/math generation

Fill paytables and symbol distributions; generate weighted candidate outcomes for every mode. Evaluate RTP, volatility, cap sensitivity, selection mix, retriggers and God Mode. Revisit infeasible prices honestly; do not invent balancing achievements. Target complete game-book libraries with deterministic event output.

### Phase 3 — Game frontend

Implement validated event playback, responsive reel UI, two concentric sigils, priest animation state machine, Hollow Halo entity states, sound, mode-selection panel, rules and paytable, mute/fast/reduced motion, replay/debug tools.

### Phase 4 — Acceptance and release preparation

Audit all payout outcomes against math files; confirm per-mode RTP from final weights; verify max win, UI disclosures, responsible-gambling requirements, betting modes, replay, CDN assets, originality, performance and Stake Engine compatibility before submission.

---

## 19. Instructions for any AI receiving this file

1. Treat this Markdown file as the main source of truth for **THE NINTH RITE**. Do not assume access to the conversation where it was drafted.
2. Preserve **CONFIRMED** decisions. Distinguish **WORKING**, **PROVISIONAL**, and **OPEN** sections rigorously.
3. Do not claim that **96% RTP** or **high volatility** has been demonstrated; there are currently **no validated simulations or complete paytables**.
4. Do not quietly invent exact drop chances, bonus trigger rates, intervention weights, Epic Rite mechanics, symbol payouts, or a maximum-win amount.
5. When discussing the `a`/`x` grid, note that the `a` cells connect orthogonally; `x` was possibly just a placeholder. If `x` is one real paying symbol type, it forms another winning cluster.
6. Preserve the confirmed non-paying orphan-clearing behavior and separate payouts/charges for disconnected qualifying same-symbol clusters.
7. Do not confuse a **winning cluster** (blood charge), a **cascade step** (one board evaluation), a **free spin**, and the **complete paid round**.
8. Preserve the **entity-in-bonus-only** decision: no interventions in ordinary paid base-game play.
9. Flag the same-cascade intervention settlement order; no double payout and no hidden post-result rewrites.
10. If asked to implement the game, resolve payoff-affecting OPEN rules first, then build a deterministic mathematical prototype **before** production art, sound, or deployment.

### Suggested prompt to continue in another conversation

> Read the attached `THE_NINTH_RITE_GAME_DESIGN.md` in full. Use its CONFIRMED decisions as the specification, and keep WORKING/OPEN and UNTESTED values separate. First help me resolve the remaining payout-affecting rules in §17. Then propose an implementation architecture and math-testing plan for Stake Engine. Do not claim that 96% RTP has already been achieved or manufacture probabilities. Preserve the gothic Hollow Halo / priest / blood altar identity.

---

**End of GDD v1.4.**  
**Release-readiness:** Not production-ready. **Next milestone:** Resolve key edge cases, define Epic Rite and paytable candidates, then implement and validate the headless math engine.
