import {generateRound} from '../engine-v19.mjs';
import {cell} from '../engine.mjs';
import {quietBoard,withCells} from '../scenarios.mjs';
export function catalogBook(mode,index){
  const options={mode,seed:`ninth-v1.9:${mode}:${index}`};
  if(index===0){
    options.boardSource=({feature})=>feature?Array.from({length:5},()=>Array.from({length:6},()=>cell('P4'))):withCells(quietBoard(),[1,10,25],'S');
    options.refillSource=()=>cell('P4');
  }
  return generateRound(options);
}
