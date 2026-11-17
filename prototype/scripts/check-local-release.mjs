import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadCatalog} from '../math/catalog.mjs';
import {loadCandidateCatalog} from '../math/catalog-v19.mjs';
import {RULES_VERSION} from '../rules-v19.mjs';
const candidate=process.argv.includes('--v19');
const base=`http://127.0.0.1:${process.env.NINTH_RITE_PORT|| (candidate?3016:3014)}`;
const directory=resolve(candidate?process.env.NINTH_CANDIDATE_DIR||'../work/ninth-math-v19.1':'../work/ninth-math');
const catalog=await (candidate?loadCandidateCatalog(directory):loadCatalog(directory));
assert.ok(catalog,'Verified catalog required');
const units=amount=>Math.round(amount*1e6);
async function call(path,body){
  const response=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
  assert.equal(response.status,200,`${path} returned ${response.status}`);
  return response.json();
}
const config=await call(candidate?`/api/config?rulesVersion=${RULES_VERSION}`:'/api/config');
assert.equal(config.catalogVersion,catalog.report.version);
const outcomes=[];
const sessions=new Map();
for(const bet of candidate?config.allowedBets:[.1])sessions.set(bet,await call('/api/session',{}));
for(const [mode,stats] of Object.entries(catalog.report.results)){
  const unitCost=config.modes[mode].cost;
  assert.equal(unitCost,stats.cost);
  const weights=await readFile(resolve(directory,`weights-${mode}.bin`));
  for(const [bet,session] of sessions){
    const price=units(bet*unitCost)/1e6;
    const payload={sessionId:session.sessionId,mode,bet,requestId:crypto.randomUUID(),
      ...(candidate?{rulesVersion:RULES_VERSION,unitCost,price}:{})};
    const first=await call('/api/play',payload),again=await call('/api/play',payload);
    assert.deepEqual(first,again);
    const id=first.round.catalogEventId,recorded=catalog.get(mode,id-1);
    assert.deepEqual(first.round.events,recorded.events);
    assert.equal(first.round.totalHundredths,recorded.totalHundredths);
    assert.ok(weights.readBigUInt64LE((id-1)*8)>0n);
    const payoutUnits=units(bet)*recorded.totalHundredths/100;
    assert.equal(units(first.round.payout),payoutUnits);
    assert.equal(first.round.cost,price);
    assert.equal(units(first.balance),units(session.balance)-units(price)+payoutUnits);
    const restored=await call('/api/session?id='+session.sessionId);
    assert.deepEqual(restored.lastRound,first.round);
    assert.equal(restored.balance,first.balance);
    outcomes.push({mode,bet,price,eventId:id,payout:first.round.payout,idempotent:true,eventsMatchCatalog:true,refreshRecovery:true});
    session.balance=first.balance;
  }
}
await writeFile(resolve(directory,'local-release-check.json'),JSON.stringify({passed:true,version:catalog.report.version,checkedAt:new Date().toISOString(),outcomes},null,2));
console.log(JSON.stringify({passed:true,modes:Object.keys(catalog.report.results).length,betLevels:sessions.size,rounds:outcomes.length}));
