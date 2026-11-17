import {writeFile} from 'node:fs/promises';
import {cell,generateRound} from '../engine.mjs';
import {oneCluster,quietBoard} from '../scenarios.mjs';
for(const confirms of [false,true]){
  const book=generateRound({mode:'blood',seed:'both-meters-one-away',initialState:{tier:16,blood:4,offerings:2},
    boardSource:({spin})=>spin===1?oneCluster([18]):quietBoard(),
    refillSource:({cascade,row,col})=>confirms&&cascade===1?cell('P4'):quietBoard()[row][col],selectPromotion:()=>120});
  const first=book.events.find(e=>e.type==='cascade');
  if(first.bloodCollected!==1||first.offeringsCollected!==1||first.after.tier!==32||first.promotedTier!==120)throw Error('Incorrect threshold fixture');
  const settlement=book.events.find(e=>e.type==='interventionConfirmed'||e.type==='interventionExpired');
  if(settlement.type!==(confirms?'interventionConfirmed':'interventionExpired'))throw Error('Incorrect next board');
  await writeFile(`test/fixtures/offering-${confirms?'confirmed':'expired'}.json`,JSON.stringify({round:{...book,id:'threshold-regression',bet:1,cost:200,payout:book.totalHundredths/100,noWalletChange:true,demonstration:'thresholds',demonstrationName:'Both meters one away'}}));
}
