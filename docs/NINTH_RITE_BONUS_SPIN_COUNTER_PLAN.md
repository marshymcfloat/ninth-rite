# Bonus spin counter — implemented presentation

## Placement

Replace the tiny top-right reel text during features with a gold-edged burgundy plaque attached to the upper-right reel frame. Keep the bonus name at the upper-left. The count belongs beside the reels, separate from the Halo's Blood and Offering meters.

Use a large ivory numeral (36–44 px desktop, 26–32 px phone), a small FREE SPINS label, and LEFT beneath. A small engraved hourglass can provide the motif; the number must remain readable without decoration. Avoid a second ring or segmented meter that could be mistaken for Blood or Offerings.

On portrait phones, use a compact strip directly above the grid: bonus name on the left, count on the right. In short landscape/popout layouts, move the plaque into the empty left margin beside the upper reels so symbols lose no space.

## Count semantics

- Entry: show all awarded spins, e.g. 10 LEFT, as the intro closes.
- Starting a spin: change to the recorded number of future spins, with a small CURRENT SPIN IN PLAY caption. The number excludes the spin currently resolving.
- Cascades: keep the count unchanged. A tumble never consumes a free spin.
- Final spin: show FINAL SPIN instead of a misleading 0 LEFT while its cascades continue.
- Retrigger: flash +5 SPINS beside the plaque, then display the recorded updated remaining count. If the final spin retriggers, return to the numeric count.
- God Mode: use RITUAL SPIN and ONE SPIN while playing; never label it a free-spin bundle.
- Completion: change to RITE COMPLETE after the final cascade and keep it visible until the next round, which restores the base-play header. At the round cap, say MAX WIN REACHED rather than implying unused spins were played.

## Movement and accessibility

Use a restrained 180–250 ms number crossfade and a gold edge sweep on retrigger. No bounce, constant flashing, or escalating urgency as spins run out. Keep the counter visible throughout tumble animations. Reduced motion uses an immediate number change with a static +5 caption. Announce count changes once per spin/retrigger, never on every cascade.

## Implementation and checks

Consume featureStart.spins, spinStart.remaining, retrigger.remaining and recorded round-end/cap events. Do not calculate awards, edit books, or alter engine timing. This also keeps replay, refresh recovery and animation skipping consistent.

Verify purchased and natural bonuses, the one permitted retrigger, last-spin cascades, God Mode, early capped rounds, replay/skip, mobile/popout fit and reduced motion.

Status: implemented. The counter uses recorded event values, never changes the engine, and keeps retrigger text inside the plaque to avoid covering symbols. All 71 automated tests pass. Browser checks pass at 1440×900, 390×844 (fallback renderer), and 640×360, including reduced motion, entry/retrigger counts, God Mode and animation skipping. Geometry checks confirm the plaque overlaps neither the grid nor the title. Screenshots: work/bonus-counter-1440.png, work/bonus-counter-390.png, work/bonus-counter-640.png.
