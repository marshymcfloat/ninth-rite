// Both presentations share one wallet, request identity and cross-tab play lock.
export function createLocalSession({storage=globalThis.localStorage,fetcher=globalThis.fetch,uuid=()=>crypto.randomUUID(),locks=globalThis.navigator?.locks,rulesVersion}={}) {
  const read=key=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{throw Error('Saved round data is unreadable. Do not place another wager until it is recovered.');}};
  async function api(path,payload) {
    const response=await fetcher(path,payload===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json();
    if(!response.ok)throw Object.assign(Error(data.error||'Request failed'),{status:response.status});
    return data;
  }
  async function init() {
    const id=storage.getItem('ninth-session');
    if(id){
      try{return await api(`/api/session?id=${encodeURIComponent(id)}`);}
      catch(error){if(error.status!==404)throw error;storage.removeItem('ninth-pending');}
    }
    const session=await api('/api/session',{});
    storage.setItem('ninth-session',session.sessionId);
    return session;
  }
  async function play({mode,bet,unitCost,price}) {
    const session=await init();
    const request=read('ninth-pending')||{sessionId:session.sessionId,mode,bet,requestId:uuid(),...(rulesVersion?{rulesVersion}:{}),...(rulesVersion==='rite-v1.9'?{unitCost,price}:{})};
    if(request.sessionId!==session.sessionId)throw Error('An unresolved round belongs to another session. Reload to recover it.');
    storage.setItem('ninth-pending',JSON.stringify(request));
    try{
      const result=await api('/api/play',request);
      storage.removeItem('ninth-pending');
      return result;
    }catch(error){
      if(error.status>=400&&error.status<500&&error.status!==409)storage.removeItem('ninth-pending');
      throw error;
    }
  }
  async function reset(){
    if(read('ninth-pending'))throw Error('Recover the unresolved round before starting a new session.');
    const session=await api('/api/session',{});storage.setItem('ninth-session',session.sessionId);return session;
  }
  async function run(task) {
    if(!locks)throw Error('This browser cannot protect play across tabs. Open the game in a browser supporting Web Locks.');
    return locks.request('ninth-local-play',{ifAvailable:true},lock=>{
      if(!lock)throw Error('Another game tab is resolving a round. Wait for it to finish.');
      return task();
    });
  }
  return {api,init,play,run,reset,pending:()=>read('ninth-pending')};
}
