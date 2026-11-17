import {bookRules,planTumble,purchaseEntryBoard} from '../view-math.mjs';
import {bonusCounterState} from '../bonus-counter.mjs';

export function initialPlayback(book,config) {
  return {rules:bookRules(book,config.rules),board:null,clear:[],moves:null,state:null,counter:null,
    totalHundredths:0,payout:0,feature:false,mode:book.mode,pending:null,complete:false,spin:0};
}
export function applyRecordedEvent(previous,event,book) {
  const next={...previous,counter:bonusCounterState(previous.counter,event),moves:null};
  if(event.state)next.state=event.state;
  if(event.type==='roundStart'){next.feature=false;next.pending=null;}
  if(event.type==='featureStart'){next.feature=true;next.mode=event.mode;}
  if(event.type==='spinStart'){next.feature=event.feature;next.spin=event.spin;next.clear=[];}
  if(event.type==='board'){
    if(!event.initial&&previous.board)next.moves=planTumble(previous.board,event.board,previous.clear);
    next.board=event.board;next.clear=[];
  }
  if(event.type==='cascade'){
    next.state=event.after;next.clear=event.clearPositions;next.totalHundredths=event.totalHundredths;
    next.payout=event.totalHundredths*book.bet/100;
  }
  if(['interventionPending','interventionDeferred'].includes(event.type))next.pending=event.tier;
  if(['interventionConfirmed','interventionExpired','roundEnd'].includes(event.type))next.pending=null;
  if(event.type==='roundEnd'){next.payout=book.payout;next.totalHundredths=event.totalHundredths;next.complete=true;}
  return next;
}
export async function playRecordedBook(book,config,presentation,{instant=false,replay=false}={}) {
  let state=initialPlayback(book,config);
  await presentation.begin?.(book,state,{instant,replay});
  try{
    if(!instant&&!book.demonstration){
      const entry=purchaseEntryBoard(book.mode,config.initialBoard);
      if(entry)await presentation.purchase?.(entry,book);
    }
    for(const [index,event] of book.events.entries()){
      state=applyRecordedEvent(state,event,book);
      await presentation.event(event,state,book,{index,previous:book.events[index-1],next:book.events[index+1]});
    }
    return state;
  }finally{await presentation.end?.(book,state);}
}
