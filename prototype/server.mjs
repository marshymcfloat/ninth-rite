import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { loadCatalog } from './math/catalog.mjs';
import { loadCandidateCatalog } from './math/catalog-v19.mjs';
import { generateRound as generateCandidateRound } from './engine-v19.mjs';
import { MODES as CANDIDATE_MODES, RULES as CANDIDATE_RULES, RULES_VERSION, MODEL_STATUS as CANDIDATE_STATUS } from './rules-v19.mjs';
import { candidateScenario, CANDIDATE_SCENARIOS } from './scenarios-v19.mjs';
import { generateRound } from './engine.mjs';
import { generateRound as generateRepeatRound, REPEAT_RULES_VERSION, RULES as REPEAT_RULES, MODEL_STATUS as REPEAT_STATUS } from './repeat-engine.mjs';
import { MODES, MODEL_STATUS, RULES, TEST_MATH, WORKING_ASSUMPTIONS } from './config.mjs';
import { SCENARIOS, generateScenario, quietBoard, withCells } from './scenarios.mjs';
import { serveVideo } from './static-media.mjs';
import { ART as engravedArt } from './public/style-2/art-data.mjs';
import { MOTION_ASSETS } from './public/style-2/motion-assets.mjs';
import { MOTION_ASSETS_V2 } from './public/style-2/motion-assets-v2.mjs';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const files = { '/': ['index.html', 'text/html'], '/app.mjs': ['app.mjs', 'text/javascript'], '/pixi-view.mjs': ['pixi-view.mjs', 'text/javascript'], '/view-math.mjs': ['view-math.mjs', 'text/javascript'], '/vendor/pixi.min.js': ['vendor/pixi.min.js', 'text/javascript'], '/vendor/pixi-csp.min.js': ['vendor/pixi-csp.min.js', 'text/javascript'], '/vendor/gsap.min.js': ['vendor/gsap.min.js', 'text/javascript'], '/vendor/versions.json': ['vendor/versions.json', 'application/json'], '/style.css': ['style.css', 'text/css'] };
files['/blood-fx.mjs'] = ['blood-fx.mjs', 'text/javascript'];
files['/rite-selector.mjs'] = ['rite-selector.mjs', 'text/javascript'];
files['/bonus-counter.mjs'] = ['bonus-counter.mjs', 'text/javascript'];
files['/rite-selector.css'] = ['rite-selector.css', 'text/css'];
files['/ceremony.mjs'] = ['ceremony.mjs', 'text/javascript'];
files['/stake-client.mjs'] = ['stake-client.mjs','text/javascript'];
files['/social.mjs'] = ['social.mjs','text/javascript'];
files['/money.mjs'] = ['money.mjs','text/javascript'];
files['/slot-controls.mjs'] = ['slot-controls.mjs','text/javascript'];
files['/slot-controls.css'] = ['slot-controls.css','text/css'];
files['/slot-audio.mjs'] = ['slot-audio.mjs','text/javascript'];
files['/slot-tempo.gif'] = ['slot-tempo.gif','image/gif'];
files['/style-2/media/engraved-v1/cathedral-music.mp3'] = ['style-2/media/engraved-v1/cathedral-music.mp3','audio/mpeg'];
files['/ceremony.css'] = ['ceremony.css', 'text/css'];
files['/style-2/scene.css'] = ['style-2/scene.css', 'text/css'];
files['/style-2/rite-selector.css'] = ['style-2/rite-selector.css', 'text/css'];
files['/style-2/scene.mjs'] = ['style-2/scene.mjs', 'text/javascript'];
files['/style-2/review.mjs'] = ['style-2/review.mjs', 'text/javascript'];
files['/local-session.mjs'] = ['local-session.mjs', 'text/javascript'];
files['/style-2/playback.mjs'] = ['style-2/playback.mjs', 'text/javascript'];
files['/style-2/game-view.mjs'] = ['style-2/game-view.mjs', 'text/javascript'];
files['/style-2/collection-fx.mjs'] = ['style-2/collection-fx.mjs', 'text/javascript'];
files['/style-2/intervention.mjs'] = ['style-2/intervention.mjs', 'text/javascript'];
files['/style-2/revelation.css'] = ['style-2/revelation.css', 'text/css'];
for(const name of ['engraved','typography']) files[`/style-2/${name}.css`] = [`style-2/${name}.css`, 'text/css'];
for(const name of ['art','art-data']) files[`/style-2/${name}.mjs`] = [`style-2/${name}.mjs`, 'text/javascript'];
for(const name of ['mascot-still','mascot-motion','mascot-rig','motion-assets','scene-motion','rig-review']) files[`/style-2/${name}.mjs`] = [`style-2/${name}.mjs`, 'text/javascript'];
for(const name of ['motion','rig-review']) files[`/style-2/${name}.css`] = [`style-2/${name}.css`, 'text/css'];
files['/style-2/rig-review.html']=['style-2/rig-review.html','text/html'];
files['/style-2/media/engraved-rig-v1/rig.json']=['style-2/media/engraved-rig-v1/rig.json','application/json'];
files['/style-2/media/engraved-rig-v2/rig.json']=['style-2/media/engraved-rig-v2/rig.json','application/json'];
for(const url of [...MOTION_ASSETS,...MOTION_ASSETS_V2]) files[url]=[url.slice(1),'image/webp'];
for(const {url} of Object.values(engravedArt)) files[url] = [url.slice(1), 'image/webp'];
for(const name of ['Cinzel-Variable','CinzelDecorative-Bold','SourceSans3-Variable']) files[`/style-2/fonts/${name}.ttf`] = [`style-2/fonts/${name}.ttf`, 'font/ttf'];
for(const name of ['rose-window','stained-rays','priest-invocation-pose','priest-expiry-pose','priest-bonus-pose','priest-benediction-pose']) files[`/style-2/media/${name}.webp`] = [`style-2/media/${name}.webp`, 'image/webp'];
for(const name of ['invocation','bonus','benediction']) files[`/style-2/media/priest-${name}.webm`] = [`style-2/media/priest-${name}.webm`, 'video/webm'];
files['/style-2/frame-layout.mjs'] = ['style-2/frame-layout.mjs', 'text/javascript'];
files['/style-2/mascot.mjs'] = ['style-2/mascot.mjs', 'text/javascript'];
files['/style-2/media/priest-motion.webm'] = ['style-2/media/priest-motion.webm', 'video/webm'];
files['/style-2/media/engraved-v1/cathedral-ambient.webm'] = ['style-2/media/engraved-v1/cathedral-ambient.webm', 'video/webm'];
files['/style-2/media/engraved-v1/priest-idle-generated.webm'] = ['style-2/media/engraved-v1/priest-idle-generated.webm', 'video/webm'];
files['/style-2/manifest.json'] = ['style-2/manifest.json', 'application/json'];
for (const name of ['cathedral','frame','priest','priest-poster','jack','queen','king','ace','chalice','crown','eye','reliquary','scatter','rite-lesser','rite-blood','rite-greater','rite-god','offering-seal-v2','offering-vessel-v2','altar-frame-v2']) files[`/style-2/media/${name}.webp`] = [`style-2/media/${name}.webp`, 'image/webp'];
for(const font of ['Inter','LibreBaskerville'])files[`/fonts/${font}.ttf`]=[`fonts/${font}.ttf`,'font/ttf'];
const UNIT = 1000000;
const START_BALANCE = 10000 * UNIT; // Integers in millionths; no deposits or withdrawals.
const allowedBets = [0.01, 0.02, 0.05, 0.1, 0.5, 1, 2, 5];

export function makeServer({catalog=null,candidateCatalog=null}={}) {
  const modes=Object.fromEntries(Object.entries(MODES).map(([id,spec])=>[id,{...spec,...(catalog?.report.results[id]?{cost:catalog.report.results[id].cost}:{})}]));
  const sessions = new Map();
  function reply(response, code, data) {
    response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
  }
  async function body(request) {
    let text = '';
    for await (const chunk of request) {
      text += chunk;
      if (text.length > 8192) throw new Error('Request too large.');
    }
    return text ? JSON.parse(text) : {};
  }
  const info = session => ({ sessionId: session.id, balance: session.balance / UNIT, lastRound: session.lastRound });
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (request.method === 'GET' && ['/style-2', '/style-2/', '/style-2/index.html'].includes(url.pathname)) {
        response.writeHead(302, { Location: '/' + url.search, 'Cache-Control': 'no-store' });
        return response.end();
      }
      if(['GET','HEAD'].includes(request.method)&&files[url.pathname]?.[1].startsWith('video/')){
        const [name,mime]=files[url.pathname];
        return await serveVideo(request,response,publicDir+name,mime);
      }
      if (request.method === 'GET' && files[url.pathname]) {
        const [name, mime] = files[url.pathname];
        const bytes = await readFile(publicDir + name);
        const cache = mime==='image/gif'||mime==='audio/mpeg' ? 'public, max-age=3600' : 'no-store';
        response.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8`, 'Cache-Control': cache });
        return response.end(bytes);
      }
      if (request.method === 'GET' && url.pathname.startsWith('/assets/')) {
        const name = url.pathname.slice('/assets/'.length);
        if (!/^[a-z0-9_-]+\.(png|webp|jpg|json)$/i.test(name)) return reply(response, 404, { error: 'Asset not found.' });
        let bytes;
        try { bytes = await readFile(publicDir + 'assets/' + name); }
        catch (error) { if (error.code === 'ENOENT') return reply(response, 404, { error: 'Asset not found.' }); throw error; }
        const mime = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', json: 'application/json' }[name.split('.').at(-1).toLowerCase()];
        response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
        return response.end(bytes);
      }
      if (request.method === 'GET' && url.pathname === '/favicon.ico') { response.writeHead(204); return response.end(); }
      if (request.method === 'GET' && ['/api/config','/config.json'].includes(url.pathname)) {
        const candidate=url.searchParams.get('rulesVersion')===RULES_VERSION;
        const repeat=url.searchParams.get('rulesVersion')===REPEAT_RULES_VERSION;
        const scenarios=repeat?{...SCENARIOS,retrigger:{name:'Repeated retriggers',description:'Three Scatters award +5 on three separate free spins, including final added spins.'}}:SCENARIOS;
        let art = null;
        try { art = JSON.parse(await readFile(publicDir + 'assets/manifest.json', 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        const selected=candidate?candidateCatalog:repeat?null:catalog;
        const modelStatus = selected
          ? `FIXED OUTCOME CATALOG — ${(selected.report.targetRtp * 100).toFixed(2)}% RTP candidate`
          : candidate ? CANDIDATE_STATUS : repeat ? REPEAT_STATUS : MODEL_STATUS;
        return reply(response, 200, { modes:candidate?CANDIDATE_MODES:modes, catalog:selected?.report.results??null, catalogVersion:selected?.report.version??null, rulesVersion:candidate?RULES_VERSION:repeat?REPEAT_RULES_VERSION:'1.7', modelStatus, rules:candidate?CANDIDATE_RULES:repeat?REPEAT_RULES:RULES, testMath: TEST_MATH, assumptions: WORKING_ASSUMPTIONS, scenarios:candidate?CANDIDATE_SCENARIOS:scenarios, allowedBets, initialBoard: quietBoard(), art });
      }
      if (request.method === 'GET' && url.pathname === '/api/session') {
        const session = sessions.get(url.searchParams.get('id'));
        return session ? reply(response, 200, info(session)) : reply(response, 404, { error: 'Sandbox session expired. Start a new session.' });
      }
      if (request.method !== 'POST' || !url.pathname.startsWith('/api/')) return reply(response, 404, { error: 'Not found.' });
      const origin = request.headers.origin;
      if (origin && origin !== `http://${request.headers.host}`) return reply(response, 403, { error: 'Local origin required.' });
      const payload = await body(request);
      if (url.pathname === '/api/session') {
        if (sessions.size > 100) sessions.delete(sessions.keys().next().value);
        const session = { id: randomUUID(), balance: START_BALANCE, lastRound: null, requests: new Map() };
        sessions.set(session.id, session);
        return reply(response, 200, info(session));
      }
      const session = sessions.get(payload.sessionId);
      if (!session) return reply(response, 404, { error: 'Sandbox session expired. Start a new session.' });
      if (url.pathname === '/api/scenario') {
        const round = payload.rulesVersion===RULES_VERSION ? candidateScenario(payload.scenario) : payload.rulesVersion===REPEAT_RULES_VERSION&&payload.scenario==='retrigger'
          ? {...generateRepeatRound({mode:'lesser',seed:'repeated-retrigger-demo',boardSource:({spin})=>[1,15,20].includes(spin)?withCells(quietBoard(),[0,5,12],'S'):quietBoard()}),demonstration:'retrigger',demonstrationName:'Repeated +5 free spins'}
          : generateScenario(payload.scenario);
        return reply(response, 200, { ...info(session), round: { ...round, id: randomUUID(), bet: 1, cost: 0, payout: round.totalHundredths / 100, noWalletChange: true } });
      }
      if (url.pathname !== '/api/play') return reply(response, 404, { error: 'Not found.' });
      if (typeof payload.requestId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(payload.requestId)) return reply(response, 400, { error: 'A valid request ID is required.' });
      if(payload.rulesVersion!==undefined&&![REPEAT_RULES_VERSION,RULES_VERSION].includes(payload.rulesVersion))return reply(response,400,{error:'Unknown rules version.'});
      const candidate=payload.rulesVersion===RULES_VERSION;
      const repeat=payload.rulesVersion===REPEAT_RULES_VERSION;
      const signature = JSON.stringify([payload.mode, payload.bet,payload.rulesVersion??'1.7',...(candidate?[payload.unitCost,payload.price]:[])]);
      if (session.requests.has(payload.requestId)) {
        const prior = session.requests.get(payload.requestId);
        if (prior.signature !== signature) return reply(response, 409, { error: 'Request ID already used for another wager.' });
        return reply(response, 200, prior.result);
      }
      const mode = (candidate?CANDIDATE_MODES:modes)[payload.mode];
      if (!mode || mode.disabled || !allowedBets.includes(payload.bet)) return reply(response, 400, { error: mode?.reason ?? 'Invalid mode or base bet.' });
      if(candidate&&(payload.unitCost!==mode.cost||!Number.isFinite(payload.price)||Math.round(payload.price*UNIT)!==Math.round(payload.bet*mode.cost*UNIT)))return reply(response,400,{error:'Purchase terms changed. Review the current price before confirming.'});
      const cost = Math.round(payload.bet * mode.cost * UNIT);
      if (session.balance < cost) return reply(response, 400, { error: 'Insufficient play credits. Start a new sandbox session.' });
      const round = candidate ? candidateCatalog?candidateCatalog.sample(payload.mode):generateCandidateRound({mode:payload.mode,seed:randomBytes(16).toString('hex')}) : repeat ? generateRepeatRound({mode:payload.mode,seed:randomBytes(16).toString('hex')}) : catalog ? catalog.sample(payload.mode) : generateRound({ mode: payload.mode, seed: randomBytes(16).toString('hex') });
      const payout = Math.round(round.totalHundredths * payload.bet * UNIT / 100);
      if (!Number.isSafeInteger(session.balance - cost + payout)) throw new Error('Sandbox balance limit exceeded; no change committed.');
      const book = { ...round, ...((candidate?candidateCatalog:!repeat&&catalog)?{catalogEventId:round.id}:{}), ...(candidate?{rulesVersion:RULES_VERSION,unitCost:mode.cost}:{}), id: randomUUID(), bet: payload.bet, cost: cost / UNIT, payout: payout / UNIT };
      session.balance = session.balance - cost + payout;
      session.lastRound = book;
      const result = { ...info(session), round: book };
      session.requests.set(payload.requestId, { signature, result });
      if (session.requests.size > 300) session.requests.delete(session.requests.keys().next().value);
      reply(response, 200, result);
    } catch (error) {
      reply(response, 400, { error: error.message || 'Prototype request failed.' });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`))) {
  const port = Number(process.env.NINTH_RITE_PORT || 3014);
  const useGenerator = process.env.NINTH_USE_GENERATOR === '1';
  const catalog = useGenerator ? null : await loadCatalog(process.env.NINTH_MATH_DIR || fileURLToPath(new URL('../work/ninth-math/', import.meta.url)));
  const candidateCatalog = useGenerator ? null : await loadCandidateCatalog(
    process.env.NINTH_CANDIDATE_DIR || fileURLToPath(new URL('../work/ninth-math-v19.1/', import.meta.url))
  );
  if (!useGenerator && !candidateCatalog) {
    throw Error('The v1.9 catalog or its verification is missing or stale. Use NINTH_USE_GENERATOR=1 only for an explicitly uncalibrated play-credit preview.');
  }
  const preview = candidateCatalog
    ? `fixed catalog ${candidateCatalog.report.version}, ${(100 * candidateCatalog.report.targetRtp).toFixed(2)}% RTP`
    : 'unvalidated generator';
  makeServer({catalog,candidateCatalog}).listen(port, '127.0.0.1', () => {
    process.stdout.write(`THE NINTH RITE prototype: http://127.0.0.1:${port}\nLocal play credits only. v1.9: ${preview}.\n`);
  });
}
