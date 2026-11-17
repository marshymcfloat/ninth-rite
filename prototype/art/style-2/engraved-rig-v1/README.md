# Ninth Rite — theatrical motion pack v1

Enabled on `/style-2`. Verified 2 November 2026, Asia/Manila.

## Review

- Game: http://127.0.0.1:3014/style-2
- Individual reactions, interruption and background checks: http://127.0.0.1:3014/style-2/rig-review.html
- Retained still presentation: http://127.0.0.1:3014/style-2?motion=still
- Recorded two-chance walkthrough: http://127.0.0.1:3014/style-2?review=deferred_confirm
- Expiry with a retrigger: http://127.0.0.1:3014/style-2?review=deferred_expire

Start the existing local server from `prototype` with `npm start`. Review scenarios use local play credits and the existing recorded-event player.

## Delivered

The priest uses one transparent PixiJS canvas, 19 optimized transparent layers and the existing GSAP clock. His feet remain fixed in the 1000 × 1600 registration space. Head and prop transforms are rigid; sleeves use weighted shoulder/elbow deformation, while cloth has restrained secondary motion. Hand drawings switch between closed, intermediate and open states without overlapping fades. Eye patches supply attentive and closed-lid states.

Breathing and idle phase continue across round boundaries. Gestures retain current pose and velocity when interrupted. Resolution takes priority over invocation, then bonus, altar progression and ordinary reactions. Rejected events are consumed rather than queued. Pending and deferred poses are driven by the recorded intervention state; they do not replay the invocation.

Named live anchors are available for the head, free hand, vessel and ruby. Invocation streams follow the vessel while it moves. The vessel's base remains attached to its supporting hand through every permitted arm angle.

The scene also has perimeter dust, mist, stained-glass light and local light flicker; collection arrivals synchronize with the recorded counts. Earned ladder progress animates separately from pending offers. Winning symbols retain fixed cluster-label anchors while gleams, clearing and landing motion play. Celebration artwork uses tier-specific particles, light reveals and cancellable amount count-ups. No gesture adds a four-second gameplay wait.

## Files and registration

- `sources/`: full-resolution generated originals; 14 outputs, including two superseded supporting-hand attempts.
- `generation-complete.json`: original prompts, generation locations and reference roles. Built-in imagegen only; zero Higgsfield credits.
- `asset-manifest.json`: source/runtime dimensions, alpha, bounds, registration, pivots, permitted angles, crop and draw order.
- `../../../public/style-2/media/engraved-rig-v1/`: runtime WebP layers and rig manifest. Resolve from the prototype root as `public/style-2/media/engraved-rig-v1/`.
- `../../../scripts/prepare-priest-rig.cjs`: reproducible export recipe; resolve from the prototype root as `scripts/prepare-priest-rig.cjs`.
- `qa/`: desktop screenshots, transparent-edge comparison, lifecycle evidence, protected-file hashes and regression output.

Runtime textures total **835,424 bytes**. Body masks share their source coordinate space and deformation so their joins stay aligned. Upper arms and forearms overlap around the elbow. The free-hand crop ends at source Y=1050; pivots remain in the uncropped source coordinates. Names beginning with `@` in draw order identify procedural chain/glow layers, not image files. Native detail is preserved in the sources; resizing exports does not add detail.

This is a bounded 2D cutout rig. Larger perspective turns or gestures beyond the manifest limits require additional drawings.

## Runtime behavior

- Optional rig loading begins after essential initialization/recovery. Play does not wait for it.
- Missing media, failed graphics initialization or `motion=still` retains the registered still presentation.
- Reduced motion avoids rig downloads and uses static poses/short fades.
- Hidden-tab handling cancels the gesture and stops rendering; resume returns to idle without replaying stale events.
- Skip suppresses collection-arrival callbacks, clears the offer presentation and applies recorded final state.
- Back navigation remains usable, including retained-page lifecycle handling.
- Rendering resolution is capped at 2×. Ambient dust is capped at 28; celebration particles at 44. No new video, audio, Spine dependency or paid-generation call was introduced.

## Verification

`npm test`: **133 passed, 0 failed**. Focused checks cover interruption continuity, duplicate/stale events, fixed cuff attachments, continuous idle, deferred holds, cancellation during collection and exact amount resolution on dismissal. Existing regression checks cover rules, recorded payouts, purchases, replay, recovery, retriggers and cap termination.

Browser checks at **1920 × 1080** and **1280 × 720** covered:

- Invocation → pending → deferral → next-spin confirmation: earned ×16 remains separate until ×64 confirms.
- Second-chance expiry with +5 retrigger: earned ×16 and two banked Offerings remain, while the offer disappears.
- God purchase: one invocation, no duplicated confirmation gesture; replay and skip preserve payout and balance.
- Two ordinary spins: two attention gestures, with no extra gesture at round completion.
- All four celebration tiers and the separate cap ending, including interrupted count-ups and long amounts. These screenshots use presentation-only fixtures, not altered outcome books.
- Reduced motion, unavailable WebGL, failed optional artwork, stalled optional rig download, pause/resume, hidden-state cancellation and back navigation.
- Hair, hands, sleeves, shoulders and vessel on black/light backgrounds; all visible game images loaded without browser warnings or errors.

The rig interruption sample rendered **270 frames in 4.51 seconds (59.9 FPS)**. Foot anchors and uniform scale remained constant; vessel/hand attachment error was zero throughout the sample. This is an observed desktop sample, not a guarantee for every device.

Normal page resources measured about **5.91 MB decoded**, including the optional rig, below the 10 MB essential-startup target. Secondary screens remain separately loaded. Of 23 protected files checked, 22 are byte-identical; the only exception is `server.mjs`, whose change adds namespaced static routes. Original `/` presentation, rules, books, prices and audio files remain unchanged.
