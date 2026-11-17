# THE NINTH RITE — Style 2 direction

## Illustrated rite selector — 25 October 2026

- Replaced the text-only selector with a full-screen dimmed-game layout: four bonus cards above three centered Base & Chance cards. Original generated art, ivory information panels, ruby Buy actions, teal Activate actions and a bottom balance/bet control row.
- Four new transparent bonus illustrations and illustrated confirmation. Existing Style 2 symbols compose the base/chance headers. Source art, prompt specifications and checks: `prototype/art/style-2/rite-cards-v1.md`.
- All amounts and spin counts come from configuration. Bet changes update displayed prices; an open confirmation freezes the selected wager. No invented volatility ratings, changed prices, mechanics or outcome books.
- Seven targeted tests passed. Live browser visual verification remains unavailable. Server restarted to add new media/CSS routes; temporary local credit sessions reset.

## Stable cluster label anchor — 25 October 2026

- Separated cluster positioning/centering from the animated text. GSAP now animates only an inner span, preserving the outer percentage anchor throughout entrance, hold and exit. Removed entrance transform clearing on the text so the exit starts from its retained settled state.
- Six targeted tests passed. Bundled-GSAP regression checks sample label anchors during both tweens and verify unchanged coordinates and centering transforms. Live browser inspection remains unavailable.

## Cluster payout labels — 25 October 2026

- Ordinary cascade amounts now appear over each individual winning cluster as outlined ivory type, without a fixed badge. Each label uses that cluster's recorded credited payout times the recorded wager, including cap allocations.
- Prefer the cluster's center when it falls on a winning cell; otherwise choose a winning cell near that center. Measured label bounds keep amounts inside the board and prioritize non-overlapping positions among simultaneous clusters. Disconnected clusters retain separate labels even when their symbol is identical.
- Labels rise into view, remain during the win reaction, and float/fade as symbols clear. Skip, replay completion and round initialization remove temporary labels. Scatter-award captions retain their separate ceremony.
- Six targeted tests passed, including adjacent-column and irregular-cluster positioning, live GSAP cleanup, playback and purchase recovery. No rule or payout changes. Browser visual verification remains unavailable.

## Winning-symbol and scatter presentation — 25 October 2026

- Replaced rectangular red/gold win fills with subdued non-winning artwork, silhouette lighting, engraved halo details and an alpha-masked silver light sweep. Ranks make a small tilt; the chalice and crown lift; the eye expands; the reliquary rises with a vertical ruby glow. Original images and symbol identities are preserved.
- Tumble payouts appear in a compact lower-center badge, replacing the wide strip over the middle row. Amounts still come from recorded payouts.
- Purchased entries, recorded natural bonus awards and retriggers activate a separate scatter ceremony: staggered halo charge, illuminated frame, priest invocation and explicit rite/retrigger caption. Ordinary scatter landings do not play this award animation. No near-miss amplification was added.
- Effects use existing artwork, local CSS and GSAP. No new generated media or credits. Reduced motion uses static highlights; Skip and background-tab resolution clean up all temporary layers.
- Extended the bundled-GSAP DOM checks for winning-only effects, unchanged payout captions, unactivated scatter boards, natural activation and skipped retrigger cleanup. Live browser visual inspection remains unavailable.

## Spin and tumble motion — 25 October 2026

- Fixed grid cells now contain independently animated symbol artwork, labels and Offering marks. New spins sweep the previous artwork down and out before incoming columns arrive; the board no longer disappears at replacement.
- Recorded tumble survivors retain their actual DOM artwork and fall from the recorded source positions. Only cleared symbols are replaced. Unmoved survivors remain stationary.
- Winning artwork briefly enlarges, then contracts and dissolves with short crimson fragments. Orphan clears remain non-paying and do not emit winning particles. Each falling column settles with a small compression; the grid/frame never bounce.
- Fast mode scales entire tweens, including stagger, delays and repeats. Skip resolves repeating animations completely; hidden tabs, reduced motion and missing GSAP retain recorded-state playback.
- Real bundled GSAP exercised in DOM tests for exit-before-replacement, surviving-symbol identity, clear/particle cleanup and Skip during exit/arrival. This is not a live-browser visual verification. Existing math and payout records remain unchanged.

Updated 25 October 2026. Style 2 now supports local play-credit rounds. Existing catalog, prices and rules are unchanged.

## Latest user direction

Life and Death is the primary visual reference. This supersedes the initial simplified cartoon chapel and exaggerated comic priest direction. Both initial Soul 2.0 outputs were rejected by the user. Do not integrate them or use them as animation references.

Use original gothic ecclesiastical illustration: engraved linework, sculptural relief, ivory and silver, dark cathedral masonry, and selective jewel-colored stained glass. Preserve the separate `/style-2` route plan and the existing `/` comparison version. No full asset set or video generation before visual review.

## Observations from the supplied reference and live Brave tab

Inspected the feature introduction, idle demo game, and bonus selection menu. No spin or bonus purchase was performed. These are visual observations, not evidence of animation timing or mathematical performance.

- The introduction uses pointed-arch window panels, draped cloth, botanical tracery and sharply legible pale gothic headings. Illustrations and colored glass carry the accents.
- Main scene: a dark cathedral with a much lighter tiled foreground creates architectural depth. Pale foreground ornament and bright carved symbols separate clearly from near-black recesses.
- Four restrained stained-glass colors differentiate feature columns. Most surfaces remain monochrome; color has a purpose rather than covering every surface.
- Symbols resemble engraved devotional emblems and carved objects. Fine hatching models volume; broader contours preserve silhouette. This differs from both photorealistic cutouts and flat outline cartoons.
- Side figures are subordinate to the grid. Their lower silhouettes merge into floor mist, integrating them into the environment.
- The bonus menu dims the game and uses simple high-contrast cards with names, short explanations, representative icons, full prices and clear actions. Readability takes priority over ornamental UI.

Reference: https://stake.ac/casino/games/hacksaw-life-and-death

## Original adaptation

- Priest: natural adult proportions, deliberate three-quarter pose facing the grid, identifiable solemn face, restrained expression. Black cassock, ivory embroidered stole, silver ritual vessel and small oxblood lining. Avoid the rejected oversized hat, elongated comic nose and theatrical grin.
- Patron: an original nine-ray halo apparition with a distinct face/silhouette. Do not copy the reference's horsemen, masks or symbol compositions.
- Materials: engraved silver, carved ivory limestone, deep woven fabric, ruby stained glass. Give each material distinct highlight and linework behavior.
- Palette: charcoal #17191b, stone #777b7a, ivory #e4dfcf, silver #bbc3c5, oxblood #971f35. Restrained antique gold #b69b5d. Color is concentrated in Blood, Offerings, special symbols and confirmed feature effects.
- Background: coherent cathedral perspective, layered pillars and arches, restrained light shafts, lighter foreground stone. No oversized crescent moon or empty illustrated wall.
- Grid: keep the planned 6x5 cells, quiet interior and original chapel frame. Do not copy the reference's variable-height reels or feature columns, which belong to different mechanics.
- HUD: earned multiplier and five Blood segments above the grid; visible remaining-spin counter upper-right; three Offering slots beside priest. Pending awards stay separate and explicitly require the next winning tumble.
- Motion later: fine drifting dust/mist, candle flicker, slight cloth motion and precise ritual gestures. Shape stability and symbol readability before effects.

## Review sequence

1. One priest concept with three material studies, using the user's supplied screenshot as a style reference.
2. Assess face, silhouette, fabric, metal and engraving at game scale. Approve direction or revise it before generating the full asset library.
3. Generate separate background, frame and representative symbol assets, then assemble the isolated browser scene for review.
4. Only after scene review: complete assets, launcher, interaction dialogs, recorded-event playback, responsive verification and separate packaging.

Generated concept sheets are not runtime sprites. Runtime foreground assets require verified alpha, clean edges and consistent scale; generated labels are never used for UI text.

## Generation ledger

- Earlier exploration: 2 Soul 2.0 free generations (allowance 2971 to 2969), rejected background and priest. Paid credits: 0. Video credits: 0.
- Gothic study v1: Seedream 4.5, 2K Auto, one image. Saved as prototype/art/style-2/gothic-study-v1.webp. Silverwork and frame study improved; priest face and hands rendered too dark, figure cropped. Not accepted for production.
- Priest v2: Seedream 4.5, 2K 3:4, one image, supplied reference attached. Saved as prototype/art/style-2/gothic-priest-v2.webp (1728x2304). User accepted this direction. The original remains on ivory; a separate verified alpha cutout is now used in the scene.
- Both gothic generations used Unlimited Relax with the Unlimited submit label verified before submission. Paid credits selected: 0. Video credits: 0.

## Assembled scene milestone

- `/style-2` now serves an isolated presentation study with separate artwork, CSS, preview interactions and a versioned manifest. `/` remains the existing game.
- Seven further free Seedream still generations: two cathedral plates, one frame, one individual Jack study (not used), chalice, scatter and a four-rank sheet. Unlimited Relax was verified before submission. The second cathedral was a duplicate exploration; the unbordered plate is used.
- Five background removals at one credit each: priest, frame, scatter, chalice and rank sheet. All foreground sources and runtime sprites have real alpha. No video generation. Connector balance decreased from 200.65 to 195.65, matching the authorized five credits exactly.
- Original sources are retained under `prototype/art/style-2`; optimized media is under `prototype/public/style-2/media`. Runtime art totals approximately 1.24 MB, excluding shared fonts and animation library.
- Preview includes 30 sample cells, five Blood segments, three Offering slots, a prominent remaining-spin counter, rite preview states, a separate pending-award example, symbol drops, ambient motion and motion-off handling.
- The sample board and counters are presentation states, not recorded outcomes. No wager, wallet, purchase, payout, outcome catalog or engine logic is connected or altered by this milestone.

## Verification record and remaining work

- Existing test suite: 71 passed, zero failed after adding the isolated route. Final scene JavaScript syntax check passed.
- Browser checks completed: desktop, 390×844 portrait without page overflow, all artwork loaded, symbol fit inside cells, pending ×120 displayed while earned ×16 remains visible, God Mode showing one ritual spin, rite dialog selection, and motion-off preview behavior.
- Corrected percentage image sizing that clipped symbols. Removed the portrait heading overlap and enlarged portrait control labels.
- Final small-landscape check and screenshot capture were interrupted by a browser security-policy block. Do not mark these checks passed. OS reduced-motion, fallback behavior and production replay integration remain unverified; motion-off was checked manually.
- Development server remains on port 3014. Its local sessions reset when it was restarted for the route additions.
- Scene review is the next gate. Full premium-symbol set, completed introduction/purchase UI, real recorded-event playback and video are subsequent milestones. The rank sheet is a representative study; final typography/material consistency still needs review.

No claim of mathematical balance or platform approval is made by this visual work.

## Mascot motion — 25 October 2026

- User approved the scene direction and requested mascot animation, including identical end/start positioning for continuous looping.
- Seedance 2.5, four seconds, same approved reference in start/end slots: 28 credits. Video Background Remover: 1 credit; rejected because it removed part of the silver vessel and returned opaque MP4. No further paid generation. Animation budget spent 29/60; 31 remain. Account balance verified at 166.65, from 195.65 before motion work.
- Original motion MP4 retained in `prototype/art/style-2/motion/priest-source.mp4`. Local video matting preserves the vessel and ivory clothes against true alpha. Nine final frames ease to the exact initial image using premultiplied-alpha blending.
- Runtime `priest-motion.webm`: 374×960, 24 fps, 96 frames, exactly four seconds, VP9 with alpha, 5,073,942 bytes. Decoded first and last RGBA frames were compared: maximum channel difference zero. Transparent corner alpha is zero. See `motion/report.json`.
- Runtime uses an uninterrupted loop, lazily loaded after essential assets. Poster fallback applies to reduced motion, paused motion, failed video, blocked autoplay and opaque-alpha decoding. Hidden tabs pause playback. The priest can be tapped for a subtle invocation aura; the existing preview also invokes it. These are presentation reactions, not new game rules.
- Correct video MIME and single-byte-range/HEAD support added. The source and output do not alter outcome math. Browser security-policy access remains blocked; final live browser animation verification is not claimed.

### Mascot matte revision 2

- Removed the enclosed ivory background pocket beside the raised fingers throughout the video. Refined the full silhouette with an inward feather and replacement of contaminated edge colors from nearby interior pixels; ivory vestments, fingers, bead and silver vessel remain visible.
- Updated both the static poster and animated asset, with cache-versioned references. Current runtime is 372×960, 4,404,255 bytes, 96 frames at 24 fps. All decoded frames retain alpha; first and last RGBA frames remain identical (maximum difference zero).
- Inspected eight decoded hand poses on contrasting dark backgrounds and first/middle/last full silhouettes. Reproducible checks: `prototype/scripts/verify-mascot-motion.py`; visual review: `prototype/art/style-2/motion/matte-hand-review.jpg`.
- No new generation or credits spent. This supersedes the earlier runtime dimensions and file size above.

### Mascot matte revision 3 — temporal edge cleanup

- User reported intermittent pale contour pixels during movement. Added optical-flow alignment of adjacent frames, followed by a three-frame contour median; stabilized contour colors and replaced pale contamination along dark clothing edges. Extended hidden edge colors into transparent pixels before video encoding to reduce chroma bleed.
- Processing uses the archived v2 video and `prototype/scripts/stabilize-mascot-matte.py`. Runtime remains 372×960, 96 frames, four seconds; current size is 4,928,282 bytes. Poster and video references use `matte-3` cache versions.
- All 96 decoded frames were checked, with six complete contact sheets generated and inspected. Decoded endpoints remain identical. The broad robe-edge brightness diagnostic fell 11.06%; this diagnostic also includes legitimate gray trim, so it is not a percentage of visible flicker removed. Source contour deviation after motion alignment fell from 0.0925 to 0.0835 pixels. These offline checks do not substitute for live browser playback review.
- No additional credits used. Existing browser-access restriction remains; no live-browser verification is claimed.

### Mascot matte revision 4 — front hairline

- Located an intermittent pale fleck beneath the front hair curl. Applied a small clean reference patch tracked to the head motion, using `prototype/scripts/refine-mascot-hairline.py`; retained the existing face, body motion and clothing cleanup.
- Inspected magnified head crops for all 96 encoded frames (`head-after-1.jpg` through `head-after-4.jpg`) and before/after forelock close-ups. The intermittent white fleck is absent in the reviewed output. End/start RGBA difference remains zero.
- Runtime references now use `matte-4`. No generation or credits used. Browser playback verification remains unavailable.

## Style 2 playable milestone — 25 October 2026

- Connected `/style-2` to the existing `/api/config`, session and play endpoints. The running server continues using the fixed calibrated catalog; no engine, probability, paytable, price or book-format changes.
- Added recorded-event playback for symbol drops, connected wins, non-paying orphan clears, gravity/refills, natural bonus entry, all four purchases, retriggers, God Mode, banked Offerings, pending/confirmed/expired interventions, cap termination and final results. Gravity uses the shared survivor mapping. Payouts and counters use recorded values.
- Buy opens one confirmation; confirming charges once and starts the decorative scatter entrance. Free spins run automatically after Continue. Standard and Enhanced activate directly; Maximum Chance requires confirmation. The selected base mode persists after a purchased bonus.
- Both styles now use the same local session/request store and Web Lock. Unknown request outcomes keep their original mode, bet and request identity for recovery. Refresh restores the recorded final result without a new purchase. Replay changes no wallet balance. Original presentation and hosted Stake flow remain in place.
- Added bet controls, speed, skip (including a skip requested during network resolution), visible round returns and bonus counts. Reduced motion and missing GSAP retain complete recorded playback. Hidden tabs resolve presentation without changing outcomes. Motion toggle and refined mascot video remain available.
- P2–P4 use the existing premium sprite sheet with subdued styling until original Style 2 assets are complete. No paid media generation. Style 2 is a local-credit frontend; hosted-wallet launch, public replay URLs, full launch sequence and release packaging remain later work.
- Verification: full 80-test suite passes. New checks cover all seven modes, scenarios and legacy books; exact payout/state reconciliation; survivor continuity; purchase scatter counts; DOM controls and dialogs; cancellation; double-clicks; selected-mode retention; recovery after response loss; cross-tab exclusion; replay; and restored final state. The final server/interaction checks also passed after the queued-skip change. DOM tests are not a live browser layout or animation test; browser access remains restricted.
- Dev server restarted on port 3014 with the fixed catalog; temporary in-memory sessions reset.


## Bonus entrance presentation — 25 October 2026

- Replaced the compact feature card with a full-screen chapel stage, rite-specific artwork, an oversized recorded spin award, and a separate recorded starting altar readout. Retriggers show additional spins and the current altar; result screens show the return without entry-only labels.
- Added staged title, artwork, award and action reveals, followed by a guarded exit transition. Continue/Escape resume once; Skip and hidden-tab handling resolve active motion. Reduced-motion and missing-GSAP paths remain immediate.
- Enlarged the scatter ceremony announcement with a centered inscription and silver rules. Existing local illustrations are reused; no media generation or credits spent.
- Included portrait and short-landscape layouts with safe overflow scrolling. Seven targeted playback/control checks pass, including real GSAP early dismissal, duplicate clicks, all four awards and retrigger skipping. No live browser visual verification; browser access remains restricted.

## Offering seals and altar vessels — 25 October 2026

- Replaced the small Offering diamonds with bespoke silver rosette seals containing faceted ruby drops. The same vector artwork appears in three gothic arched Offering vessels; the altar now uses five lancet-shaped Blood vessels and an engraved silver enclosure.
- Reuse meter nodes across readouts. Only recorded paying clusters generate Blood flights, and only recorded collected marked winners generate Offering seal flights. Source paths arc toward their corresponding meter; tracked GSAP motion resolves cleanly on skip, with no flights for reduced motion or instant playback.
- Meter arrivals pulse, earned tier increases illuminate the altar, pending offers appear separately, and confirmation/expiry withdraw their offer before the authoritative readout changes. Dormant, active, pending and sealed states have distinct styling and labels.
- Inline SVG and CSS remain local, scalable and transparent. No images or videos generated, and no credits spent. Eight targeted control/playback tests pass, including exact collected counts and cleanup during flight. Responsive rules cover portrait layout; live browser visual verification remains unavailable.

## Generated reliquaries and liquid collection — 25 October 2026

- Replaced the lightweight SVG seals/vessels and CSS altar arch with three built-in imagegen assets: carved silver/ivory ruby seal, crystal Offering reliquary, and a wide carved altar frame. Runtime WebP total: 300,856 bytes. Real alpha verified in all three files, including the altar's central opening. Full PNG sources and exact prompts are retained in prototype/art/style-2/reliquaries-v2-prompts.md and its adjacent source files.
- Layered dormant and illuminated artwork uses the exact same silhouette, avoiding animated matte drift. Collection arrivals reveal the ruby layer upward and trigger a local highlight. Earned altar increases illuminate the carved frame. Original math and event formats are unchanged.
- Added a bounded, high-DPI Canvas collection renderer: cubic liquid ribbons with dark body, crimson/specular spine, moving droplets, warm Offering trails and expanding arrival ripples. Real destination coordinates determine the paths. One tracked GSAP clock per collection batch supports speed, skip and hidden-tab resolution; unsupported canvas retains sprite flights, and reduced-motion playback updates directly.
- Updated desktop/portrait layout to accommodate substantial artwork instead of large empty panels. No Higgsfield or video credits spent. Ten targeted HTTP, control, recorded-playback, stream-geometry and cleanup checks pass. No live browser visual verification is claimed.
- Dev server restarted on port 3014 using the same fixed calibrated catalog; temporary in-memory sessions reset.
