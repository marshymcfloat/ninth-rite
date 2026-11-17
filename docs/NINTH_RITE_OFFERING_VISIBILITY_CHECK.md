# Offering intervention investigation — 23 October 2026

Reported condition: Blood 4/5, Offerings 2/3, followed by a winning cluster with a marked symbol.

## Findings

- The existing unit test for exactly this state passes: a win at ×16 earns normal ×32, spends three Offerings, and offers pending ×120. A following win confirms ×120 before its payout; a losing board keeps ×32.
- Inspected 6,000 fixed catalog outcomes across Lesser/Blood/Greater. There were 381 matching cascades: 380 invoked an intervention; one reached the normal ×2500 ceiling and correctly suppressed an additional intervention. No unexplained missing invocation was found in this inspection. This is a regression diagnostic, not a probability estimate.
- Marked non-paying orphans still collect nothing. Reaching the total-round payout cap terminates charge collection. These preserved exceptions are distinct from a missing intervention.
- The pending presentation was too subtle: only a small text/glow cue appeared, while the entity reveal waited for confirmation. An expired offer could therefore look as though nothing happened.

## Presentation correction

- Show the entity and multiplier when the Offerings invoke an offer, explicitly labelled “Pending · win the next tumble.” Keep the earned altar visible.
- Explain that three Offerings were spent and confirmation is pending.
- Keep the last confirmation/expiry message through the remainder of the round. Reset it when a new recorded round starts.
- Preserve a readable hold in reduced-motion mode; skip still resolves immediately.
- No engine, payout, weight, probability or outcome-book changes.

## Verification

`test/browser/offering-intervention-check.js` passes all four cases: confirmation and expiry, each in desktop PixiJS and mobile reduced-motion fallback. The earned altar remains ×32 while ×120 is pending; confirmed play uses ×120, expiry keeps ×32, and three Offerings remain spent. Recorded history includes both outcomes. No page errors occurred.

Fixtures are generated from the authoritative engine by `test/make-offering-fixtures.mjs`; they are clearly marked demonstrations and never charge credits. Preview: `work/offering-expired-pending.png`.
