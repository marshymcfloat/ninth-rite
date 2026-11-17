# Priest arm and chalice correction · engraved-rig-v2

Active on `/style-2`. Interactive comparison: `/style-2/rig-review.html?rig=v1` and `?rig=v2`. The default review uses the current game pack.

## Artwork and attachments

- His left hand, on the viewer's right, retains its original wrist and cupped pose. Two masks from the same source render rear palm/thumb → chalice → foreground fingers. Both masks share native dimensions, pivot, scale and attachment transform. The fingers overlap the lower base; the bowl remains clear.
- His right hand, on the viewer's left, retains all three drawings, each uniformly enlarged from 0.075 to 0.09. The old 1050-pixel wrist cutoff is removed.
- One new transparent wrist/forearm connector was generated with built-in imagegen. Its original and exact prompt are in `sources/free-wrist-original.png` and `generation.json`. Existing fingers, face and clothing were preserved. No Higgsfield spending or video generation.
- The gesturing wrist root is `[265,775]` in the sleeve's native coordinates. Its concealed overlap is approximately 14 character-coordinate pixels. The generated connector uses uniform scale 1.25 and offset `[-700,470]` into the existing hand's coordinates.
- Rear crimson lining and foreground cuff rim are separate masks. Layer partitions retain three native pixels of overlap to avoid filtering seams. The cuff opening follows the forearm rigidly; the elbow blend remains continuous. The upper arm stays beneath the cape, while the forearm renders above the torso.
- All 23 part depths, including the new connector and fingers, follow the manifest's explicit draw order. The chain and ruby glow also have named entries.

## Files and reproduction

`asset-manifest.json` records original dimensions, runtime dimensions, transparency, bounds, attachment coordinates, crop region, source mapping and layer order. Unaffected textures reference the preserved v1 pack. Corrected full-resolution layers are in `sources/`; optimized runtime exports are under `public/style-2/media/engraved-rig-v2/`.

Rebuild the correction exports with `node scripts/prepare-priest-rig-v2.cjs` from the prototype directory. This does not modify v1 assets. The complete optional rig is 854,834 bytes and remains lazy-loaded after essential initialization.

## Validation

- `npm test`: **138 passed**, including five new artwork tests. Those tests decode the actual PNG alpha masks to check silhouette preservation, restored wrist pixels, generated join coverage throughout the wrist range, cuff occlusion, and foreground-finger contact without bowl obstruction.
- Browser review at **1920×1080** and **1280×720**, with enlarged arm checks on black, gray, light and chapel backgrounds. `qa/arm-comparison.png` shows neutral and invocation before/after; the folder also contains every major pose and a maximum-range arm pose.
- Actual rendered alpha masks checked at 24 points across every gesture. Foreground-finger/chalice intersection stayed present in every sample; wrist overlap remained continuous. Feet stayed at `[500,1520]`, with uniform body scale.
- Invocation interrupted by confirmation preserved the current pose and velocity. Stale lower-priority gestures were discarded. Idle phase survived round boundaries. Observed 181 frames during a roughly three-second desktop sample.
- Reduced motion, missing wrist download, unavailable WebGL, explicit still fallback, pause/resume and hidden-tab suspension passed. Recorded pending intervention replay and Skip resolved with no remaining halo and no page errors.
- All 20 v1 runtime pack files are byte-for-byte unchanged. All 22 protected gameplay/default-presentation files are unchanged; the server difference only adds asset routes. Reaction state and timing code are unchanged; the motion helper only adds optional cuff skinning registration.

Detailed browser results, protected-file hashes and the full regression log are in `qa/`. The original registered still remains the fallback.
