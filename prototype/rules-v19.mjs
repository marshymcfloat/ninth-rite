import {MODES as ORIGINAL_MODES,RULES as ORIGINAL_RULES} from './config.mjs';
export const RULES_VERSION='rite-v1.9';
export const MODEL_STATUS='V1.9 RULES CANDIDATE - RTP UNVALIDATED';
export const MODES=Object.freeze({...ORIGINAL_MODES,
  lesser:{...ORIGINAL_MODES.lesser,tier:16},blood:{...ORIGINAL_MODES.blood,tier:32},
  greater:{...ORIGINAL_MODES.greater,tier:64},god:{...ORIGINAL_MODES.god,cost:1000},
});
export const RULES=Object.freeze({...ORIGINAL_RULES,interventionTiming:'next-tumble-or-next-spin',
  retriggerSpins:5,retriggerMinScatters:3,retriggerTiming:'initial-free-spin',repeatRetriggers:true});
