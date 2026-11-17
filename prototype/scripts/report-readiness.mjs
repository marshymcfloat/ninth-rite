import {readFile,writeFile,statfs,stat,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const math=resolve('../work/ninth-math'),release=resolve('../release/ninth-rite-math-v1.7.0');
async function optional(path){try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
const report=await optional(resolve(math,'calibration-report.json')),exported=await optional(resolve(release,'validation-manifest.json')),contract=await optional(resolve(release,'contract-audit.json'));
const disk=await statfs(release),free=(disk.bavail*disk.bsize/1e9).toFixed(2);
let bytes=0;if(exported)for(const name of Object.keys(exported.files))bytes+=(await stat(resolve(release,name))).size;
const status=`# Readiness status — 23 October 2026

Submission candidate; nothing has been submitted or published.

## Completed implementation and local checks

- GDD v1.7 and format-3 books: 50,000× complete-round cap, integer proportional allocation, immediate terminal cap behavior, existing ×2500 altar ceiling preserved.
- Historical baseline: 100,000 rounds per mode, seven modes. Candidate pool: 1,000,000 valid outcomes per mode, seven million total. Original engine/configuration preserved in work/v1.6-readiness-backup.
- All seven fixed integer-weight catalogs pass local calibration targets, including conditional natural-feature distributions. Exact weighted RTP is within 96.50% ±0.005 percentage points for every mode. Payouts were not edited to fit RTP.
- God price is 100×; its guaranteed pre-spin altar remains distinct from a guaranteed win. God nonzero rate is ${(report.results.god.nonzero*100).toFixed(2)}%, profit rate ${(report.results.god.profit*100).toFixed(2)}%. Greater and God have higher mode-cost standard deviation than Lesser/Blood.
- Local server uses the fixed weighted catalog by default. Explicit NINTH_USE_GENERATOR=1 enables uncalibrated development generation. Seven live-mode checks match catalog events, positive weights and prices, with idempotent purchases and original-result refresh recovery.
- RGS adapter: dynamic authentication/bet levels/mode limits, six-decimal amounts, original-wager recovery, uncertain purchase and settlement resolution, zero-round automatic closure, public replay, social wording and SC/GC formatting.
- Server jurisdiction restrictions for feature activation, speed, fullscreen, spacebar and slamstop; optional net-position/session/RTP display. Unsupported nonzero minimumRoundDuration fails closed pending protocol clarification.
- 69 automated tests passed. Packaged browser checks pass desktop 1440×900, phone 390×844 and popout 640×360 without scrolling, duplicate charges or external asset requests. Public replay makes no wallet calls. Original 0.5 wager survives interrupted-play refresh. Legacy recorded replay retains three-charge rules and recorded payouts.
- Offering regression: inspected 6,000 catalog outcomes. All 380 eligible cases with Blood 4/5, Offerings 2/3 and a marked winner invoked an intervention; one additional case reached ×2500 and correctly suppressed it. Pending offers now visibly reveal the entity; confirmation/expiry remains explicit. Four browser cases pass: confirmed/expired in PixiJS and mobile reduced-motion fallback. No math changed.
- Static frontend is packaged at release/ninth-rite-frontend-v1.7.0 with local fonts/licenses, active art only and file hashes. Marketing source layers, 3:4/16:9 layout references, description, distribution CSVs and reviewer IDs are in release/ninth-rite-submission-kit.

## Export status

${exported?`All ${exported.validatedBooks.toLocaleString('en-US')} books were regenerated, validated and streamed into the final seven-mode export. Actual compressed books and CSVs total ${(bytes/1e9).toFixed(2)} GB. Final index.json exists.`:'Full export is running. Each book is validated before writing. An incomplete export has no final index.json and must not be uploaded.'}

${contract?.passed?`Final file audit passed for ${contract.rows.toLocaleString('en-US')} rows: all lookup weights and payouts agree with the calibrated catalog, and compressed-file hashes match the validated exports. See contract-audit.json for per-mode scope; the Maximum Chance file additionally received a complete decompressed book/CSV round-trip audit.`:'Final compressed-file/lookup audit is pending. The initial exact catalog audit and representative replay validation have passed.'}

## Remaining release gates

- Actual Studio launch/wallet/replay tests and account-specific checklist. Current integration tests mock RGS; connected browser control failed to initialize during this pass.
- Studio reconciliation of conservative math risk calculations, maximum exposure and viable currency-specific bet limits. Local math checks do not establish platform approval.
- Clarification of nonzero minimumRoundDuration units/semantics before supporting affected jurisdictions.
- Final art/third-party resemblance and library-license review; composed production audio and physical-device performance/visual review. Higgsfield commercial-use terms and provenance are documented; local font licenses are included. Three-star presentation is not established.
- Recreate/save both marketing formats in Studio's Media Editor and confirm team branding. References and source layers are prepared; no account writes were performed.

## Storage and operation

The user cleared the named npm downloaded-package cache after authorization. Approximately 19.4 GB became free; no project files were deleted by this task. Current free space: ${free} GB. Older source/art/books and the unrelated SDK release remain preserved.

Dev server: http://127.0.0.1:3014/ . Its in-memory play-credit sessions were reset when the fixed catalog was loaded. Source/presentation files can be refreshed without resetting sessions.

Evidence: work/ninth-math/calibration-report.json, catalog-audit.json, local-release-check.json; release math validation/contract manifests; frontend build-manifest.json; docs/NINTH_RITE_OFFERING_VISIBILITY_CHECK.md and NINTH_RITE_ASSET_REGISTER.md. No validated RTP is claimed for the unweighted development generator.
`;
await writeFile(resolve('../docs/NINTH_RITE_READINESS_STATUS.md'),status);
let mathReport=await readFile(resolve(math,'MATHEMATICAL_REPORT.md'),'utf8');
mathReport=mathReport.replace(/(?:Storage|Export):[\s\S]*?(?=\n\nRemaining release gates:)/,exported?`Export: ${exported.validatedBooks.toLocaleString('en-US')} validated books; ${(bytes/1e9).toFixed(2)} GB of compressed books and lookup CSVs. ${contract?.passed?'Final file/lookup audit passed.':'Final file/lookup audit pending.'}`:'Export: sufficient space was recovered. Full validation and streaming export are running; final file audit remains pending.');
mathReport=mathReport.replace(/Remaining release gates:[\s\S]*$/,'Remaining release gates: actual account integration and checklist; Studio risk and bet-limit reconciliation; nonzero jurisdiction timing clarification; final art/library rights and presentation/audio review; saving prepared marketing layers in Studio. No submission was performed.\n');
await writeFile(resolve(math,'MATHEMATICAL_REPORT.md'),mathReport);
for(const [source,dest] of [[resolve(math,'MATHEMATICAL_REPORT.md'),'MATHEMATICAL_REPORT.md'],[resolve('../docs/NINTH_RITE_READINESS_STATUS.md'),'READINESS_STATUS.md']])await copyFile(source,resolve('../release/ninth-rite-submission-kit',dest));
console.log(JSON.stringify({exportComplete:Boolean(exported),contractPassed:Boolean(contract?.passed),freeGB:free}));
