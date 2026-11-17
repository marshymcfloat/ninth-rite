import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { makeServer } from '../server.mjs';

test('HTTP session, play, idempotency, replay, validation and scripted demos', async t => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body) => {
    const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  const session = (await post('/api/session', {})).data;
  assert.equal(session.balance, 10000);
  const config = await (await fetch(base + '/api/config')).json();
  const homepage = await fetch(base + '/');
  assert.equal(homepage.status, 200);
  const html = await homepage.text();
  assert.match(html, /id="gameControls"/);
  assert.match(html, /src="\/style-2\/scene\.mjs"/);
  const previousPage = await fetch(base + '/style-2?review=deferred_confirm&motion=still', { redirect: 'manual' });
  assert.equal(previousPage.status, 302);
  assert.equal(previousPage.headers.get('location'), '/?review=deferred_confirm&motion=still');
  for(const path of ['/slot-controls.css','/slot-controls.mjs','/slot-audio.mjs','/style-2/playback.mjs','/style-2/game-view.mjs','/local-session.mjs'])assert.equal((await fetch(base+path)).status,200,path);
  assert.equal((await fetch(base+'/style-2/rite-selector.css')).status,200);
  for(const path of ['intervention.mjs','revelation.css','media/rose-window.webp','media/stained-rays.webp','media/priest-expiry-pose.webp'])assert.equal((await fetch(base+'/style-2/'+path)).status,200);
  for(const name of ['invocation','bonus']){
    const reaction=await fetch(base+`/style-2/media/priest-${name}.webm`,{headers:{Range:'bytes=0-63'}});
    assert.equal(reaction.status,206);assert.equal(reaction.headers.get('content-type'),'video/webm');assert.equal((await reaction.arrayBuffer()).byteLength,64);
  }
    assert.equal((await fetch(base+'/style-2/collection-fx.mjs')).status,200);
    for(const name of ['offering-seal-v2','offering-vessel-v2','altar-frame-v2'])assert.equal((await fetch(base+`/style-2/media/${name}.webp`)).status,200);
  for(const mode of ['lesser','blood','greater','god']){
    const response=await fetch(base+`/style-2/media/rite-${mode}.webp`);
    assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/webp/);
  }
  assert.equal(config.art.symbols.order.length, 9);
  const image = await fetch(base + config.art.symbols.src);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await image.arrayBuffer()).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal((await fetch(base + '/assets/missing.png')).status, 404);
  assert.equal((await fetch(base + '/assets/%2e%2e%2fconfig.mjs')).status, 404);
  const payload = { sessionId: session.sessionId, mode: 'god', bet: 0.5, requestId: randomUUID() };
  const played = await post('/api/play', payload);
  assert.equal(played.status, 200);
  assert.equal(played.data.round.cost, 750);
  assert.equal(played.data.balance, session.balance - 750 + played.data.round.payout);
  const retry = await post('/api/play', payload);
  assert.deepEqual(retry.data, played.data);
  const recovered = await (await fetch(`${base}/api/session?id=${session.sessionId}`)).json();
  assert.equal(recovered.balance, played.data.balance);
  assert.deepEqual(recovered.lastRound, played.data.round);
  const demo = await post('/api/scenario', { sessionId: session.sessionId, scenario: 'god_zero' });
  assert.equal(demo.data.balance, recovered.balance);
  assert.equal(demo.data.round.noWalletChange, true);
  assert.equal(demo.data.round.payout, 0);
  assert.equal((await post('/api/play', { ...payload, bet: 1 })).status, 409);
  assert.equal((await post('/api/play', { ...payload, requestId: randomUUID(), mode: 'mystery' })).status, 400);
  assert.equal((await post('/api/play', { ...payload, requestId: randomUUID(), bet: -1 })).status, 400);
  assert.equal((await post('/api/play', { ...payload, requestId: 'bad' })).status, 400);
  const unchanged = await (await fetch(`${base}/api/session?id=${session.sessionId}`)).json();
  assert.equal(unchanged.balance, recovered.balance);
  const foreign = await fetch(base + '/api/session', { method: 'POST', headers: { Origin: 'https://example.com' } });
  assert.equal(foreign.status, 403);
});
