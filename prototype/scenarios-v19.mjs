import {generateRound} from './engine-v19.mjs';
import {quietBoard,oneCluster,withCells} from './scenarios.mjs';
export const CANDIDATE_SCENARIOS={
  deferred_confirm:{name:'Second-chance confirmation',description:'A pending offer survives a losing tumble and confirms on the following free spin.'},
  deferred_expire:{name:'Second-chance expiry',description:'The next spin loses while awarding a retrigger; the offer still expires.'},
  final_expire:{name:'Final-spin expiry',description:'An offer on the final spin expires without granting another spin.'},
  retrigger:{name:'Repeated retriggers',description:'Three separate +5 awards, including awarded spins.'}
};
export function candidateScenario(name){
  if(!CANDIDATE_SCENARIOS[name])throw Error('Unknown candidate demonstration');
  const common={mode:'lesser',seed:`v19-demo:${name}`,initialState:{tier:16,blood:0,offerings:5},selectPromotion:()=>64,refillSource:({row,col})=>quietBoard()[row][col]};
  const boardSource=({spin})=>name==='deferred_confirm'?(spin<=2?oneCluster():quietBoard()):name==='deferred_expire'?(spin===1?oneCluster():spin===2?withCells(quietBoard(),[0,5,12],'S'):quietBoard()):name==='final_expire'?(spin===10?oneCluster():quietBoard()):[1,15,20].includes(spin)?withCells(quietBoard(),[0,5,12],'S'):quietBoard();
  return {...generateRound({...common,boardSource}),demonstration:name,demonstrationName:CANDIDATE_SCENARIOS[name].name};
}
