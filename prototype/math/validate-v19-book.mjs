import {MODES,RULES,RULES_VERSION} from '../rules-v19.mjs';
import {findClusters,countScatters,resolveCascade,validateBoard,snapshot as basicSnapshot,highestBonus,naturalTier} from '../engine.mjs';
import {planTumble} from '../public/view-math.mjs';
const same=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`Book validation: ${label}`);};
const check=(value,label)=>{if(!value)throw Error(`Book validation: ${label}`);};
export function validateBook(book){
  check(book.version===4&&book.gdd==='1.9'&&book.mathId===RULES_VERSION,'version');
  same(book.rules,RULES,'rules');
  check(MODES[book.mode]&&book.events?.length>=5,'mode and events');
  let state,board,previous,clear,feature=false,mode=book.mode,remaining=MODES[mode].spins,spin=0,cascade=-1,total=0,retriggers=0,invoked=0,confirmed=0,expired=0,capped=false,awarded=false,lastType,highest=null;
  for(const [index,e] of book.events.entries()){
    check(e.index===index,'index');if(capped)check(['spinEnd','roundEnd'].includes(e.type),'after cap');
    switch(e.type){
      case 'roundStart':
        check(index===0&&e.mode===book.mode&&e.seed===book.seed,'round start');state=e.state;same(e.rules,RULES,'event rules');
        check(state.tier===MODES[mode].tier&&!state.pendingTier,'starting tier');break;
      case 'godIntervention':check(mode==='god'&&lastType==='roundStart'&&[250,500,1000,2500].includes(e.tier),'God');same(e.state,basicSnapshot({tier:e.tier,blood:0,offerings:0}),'God state');state=e.state;invoked++;confirmed++;break;
      case 'naturalBonus':check(!feature&&lastType==='spinEnd'&&highest===e.mode,'natural entry');mode=e.mode;same(e.state,basicSnapshot({tier:MODES[mode].tier,blood:0,offerings:0}),'natural reset');state=e.state;break;
      case 'featureStart':
        check(!feature&&MODES[e.mode]?.feature&&e.mode===mode&&['roundStart','godIntervention','naturalBonus'].includes(lastType),'feature order');
        check(e.natural===(lastType==='naturalBonus'),'feature origin');feature=true;remaining=MODES[mode].spins;check(e.spins===remaining,'initial spins');same(e.state,state,'feature state');if(mode!=='god')check(state.tier===MODES[mode].tier,'starting tier');break;
      case 'spinStart':
        check(['roundStart','featureStart','spinEnd'].includes(lastType)&&remaining>0&&e.spin===spin+1,'spin accounting');spin++;remaining--;cascade=-1;board=null;previous=null;clear=null;awarded=false;
        check(e.remaining===remaining&&e.feature===feature&&e.mode===mode,'spin start');same(e.state,state,'spin state');break;
      case 'board':
        validateBoard(e.board);check(['spinStart','cascade','interventionPending'].includes(lastType)&&e.spin===spin&&e.cascade===cascade+1&&e.initial===(cascade===-1),'board order');cascade++;
        if(previous&&clear)planTumble(previous,e.board,clear);
        board=e.board;check(e.scatterCount===countScatters(board),'scatter count');if(!feature){check(board.flat().every(c=>!c.marked),'base marks');highest=highestBonus(highest,naturalTier(countScatters(board)));}break;
      case 'retrigger':
        check(feature&&mode!=='god'&&cascade===0&&!awarded&&lastType==='board'&&countScatters(board)>=3,'retrigger eligibility');
        awarded=true;remaining+=5;retriggers++;check(e.added===5&&e.remaining===remaining&&e.retriggerCount===retriggers,'retrigger amount');same(e.state,state,'retrigger state');break;
      case 'interventionDeferred':
        check(state.pendingStage==='nextTumble'&&!findClusters(board).length&&remaining>0,'deferral eligibility');
        same(e.before,state,'deferral before');check(e.tier===state.pendingTier&&state.pendingExpirySpin===spin+1,'deferral deadline');state={...state,pendingStage:'nextSpin'};same(e.state,state,'deferral state');break;
      case 'interventionConfirmed':{
        check(state.pendingTier&&findClusters(board).length>0,'confirmation eligibility');
        check(e.tier===state.pendingTier&&e.spin===spin&&e.cascade===cascade&&spin===(state.pendingExpirySpin-(state.pendingStage==='nextSpin'?0:1)),'confirmation deadline');
        check(e.chance===(state.pendingStage==='nextSpin'?2:1),'confirmation chance');same(e.before,state,'confirmation before');
        const tier=state.pendingTier;state=basicSnapshot({tier,blood:tier===2500?0:state.blood,offerings:tier===2500?0:state.offerings});same(e.state,state,'confirmed state');confirmed++;break;
      }
      case 'interventionExpired':
        check(state.pendingTier&&!findClusters(board).length,'expiry eligibility');same(e.before,state,'expiry before');
        check((state.pendingStage==='nextSpin'&&spin===state.pendingExpirySpin)||(state.pendingStage==='nextTumble'&&remaining===0),'expiry deadline');
        check(e.tier===state.pendingTier&&e.reason===(state.pendingStage==='nextSpin'?'second-chance-lost':'no-next-spin'),'expired tier');state=basicSnapshot({tier:state.tier,blood:state.blood,offerings:state.offerings});same(e.state,state,'expired state');expired++;break;
      case 'cascade':{
        check(!state.pendingTier,'unsettled offer');
        const expected=resolveCascade(board,state,{feature,selectPromotion:()=>e.promotedTier,remainingPayoutHundredths:RULES.maxWin*100-total});check(expected,'paying cascade');
        if(expected.promotedTier)expected.after={...expected.after,pendingStage:'nextTumble',pendingExpirySpin:spin+1};
        for(const key of Object.keys(expected))same(e[key],expected[key],`cascade ${key}`);
        state=expected.after;total+=expected.payoutHundredths;check(e.totalHundredths===total,'running payout');previous=board;clear=e.clearPositions;break;
      }
      case 'interventionPending':check(lastType==='cascade'&&e.tier===state.pendingTier,'pending event');same(e.state,state,'pending state');invoked++;break;
      case 'winCap':check(total===RULES.maxWin*100&&!state.pendingTier,'cap');capped=true;remaining=0;break;
      case 'spinEnd':
        if(!capped){check(!findClusters(board).length,'unfinished cascade');if(feature&&mode!=='god'&&cascade===0&&countScatters(board)>=3)check(awarded,'missing retrigger');}
        check(!state.pendingTier||(state.pendingStage==='nextSpin'&&state.pendingExpirySpin===spin+1&&remaining>0),'unresolved opportunity');
        check(e.remaining===remaining&&e.totalHundredths===total,'spin end totals');same(e.state,state,'spin end state');break;
      case 'roundEnd':check(index===book.events.length-1&&lastType==='spinEnd'&&remaining===0&&!state.pendingTier&&(feature||!highest||capped),'round finished');same(e.state,state,'round final state');check(e.totalHundredths===total&&e.spins===spin&&e.retriggerCount===retriggers&&e.interventionCount===invoked&&e.interventionConfirmedCount===confirmed&&e.interventionExpiredCount===expired,'round total');break;
      default:throw Error(`Unknown event ${e.type}`);
    }
    lastType=e.type;
  }
  check(lastType==='roundEnd'&&book.totalHundredths===total&&book.spins===spin,'book totals');same(book.finalState,state,'book final');
  check(book.retriggerCount===retriggers&&book.retriggerUsed===(retriggers>0),'retrigger count');
  check(book.interventionCount===invoked&&book.interventionConfirmedCount===confirmed&&book.interventionExpiredCount===expired&&invoked===confirmed+expired,'offer totals');
  check(book.capReached===capped&&book.aborted===false,'termination');return true;
}
