import {ART,ART_VERSION} from './art-data.mjs';
export {ART_VERSION};
export const ALTAR_TIERS=Object.freeze([1,2,4,8,16,32,64,120,250,500,1000,2500]);

const revealArt = {
  'bonus-entry-lesser': {url:'/assets/bonus-entry-lesser.webp', width:1120, height:831, bounds:[140,4,984,822]},
  'bonus-entry-blood': {url:'/assets/bonus-entry-blood.webp', width:1120, height:844, bounds:[106,2,1042,839]},
  'bonus-entry-greater': {url:'/assets/bonus-entry-greater.webp', width:1120, height:842, bounds:[11,3,1113,804]},
  'bonus-retrigger': {url:'/assets/bonus-retrigger.webp', width:1111, height:900, bounds:[100,2,974,876]},
  'result-ledger': {url:'/assets/result-ledger.webp', width:1000, height:742, bounds:[106,65,898,677]},
  'win-max': {url:'/assets/win-max.webp', width:1120, height:823, bounds:[7,2,1114,819]},
};

const symbols=Object.freeze({C1:'symbol-j',C2:'symbol-q',C3:'symbol-k',C4:'symbol-a',P1:'symbol-chalice',P2:'symbol-crown',P3:'symbol-eye',P4:'symbol-reliquary',S:'symbol-scatter'});
export const getArt=id=>ART[id]||revealArt[id]||null;
export const artUrl=id=>getArt(id)?.url||'';
export const symbolArtId=symbol=>symbols[symbol]||null;
export const symbolArtUrl=symbol=>artUrl(symbolArtId(symbol));

export function artBox(id,width,height,occupancy=1){
  const asset=getArt(id);if(!asset||width<=0||height<=0)return null;
  const [l,t,r,b]=asset.bounds,scale=Math.min(width/(r-l),height/(b-t))*occupancy;
  return {left:(width-(r-l)*scale)/2-l*scale,top:(height-(b-t)*scale)/2-t*scale,width:asset.width*scale,height:asset.height*scale,scale};
}

const documents=new WeakMap();
const artImageSelector='img[data-art]';
function registry(document){
  if(documents.has(document))return documents.get(document);
  const window=document.defaultView,images=new WeakMap();let scheduled=false;
  const refresh=()=>{
    scheduled=false;
    const dimensions=new Map(),updates=[];
    for(const image of document.querySelectorAll(artImageSelector)){
      const entry=images.get(image);if(!entry)continue;
      const container=entry.container;
      if(!dimensions.has(container))dimensions.set(container,{width:container.clientWidth,height:container.clientHeight});
      const {width,height}=dimensions.get(container);
      if(width===entry.width&&height===entry.height)continue;
      const box=artBox(entry.id,width,height,entry.occupancy);
      if(!box)continue;
      entry.width=width;entry.height=height;
      updates.push({image,box});
    }
    for(const {image,box} of updates){
      Object.assign(image.style,{position:'absolute',maxWidth:'none',maxHeight:'none',objectFit:'fill',inset:'auto',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
    }
  };
  const schedule=()=>{if(scheduled)return;scheduled=true;if(window.requestAnimationFrame)window.requestAnimationFrame(refresh);else window.setTimeout(refresh);};
  window.addEventListener('resize',schedule,{passive:true});
  const observer=window.ResizeObserver?new window.ResizeObserver(schedule):null;
  observer?.observe(document.documentElement);
  // Symbols can be prepared while the previous board is still exiting. A weak
  // registration survives that delay without retaining discarded board nodes.
  const mounts=window.MutationObserver?new window.MutationObserver(changes=>{
    if(changes.some(change=>[...change.addedNodes].some(node=>node.nodeType===1&&
      (node.matches(artImageSelector)||node.querySelector(artImageSelector)))))schedule();
  }):null;
  mounts?.observe(document.documentElement,{childList:true,subtree:true});
  document.fonts?.addEventListener('loadingdone',schedule);
  document.addEventListener('load',event=>{if(images.has(event.target))schedule();},true);
  const value={images,schedule};documents.set(document,value);return value;
}

export function applyArt(image,id,{occupancy=1,container=image?.parentElement}={}){
  const asset=getArt(id);if(!asset||!image)return ()=>{};
  image.src=asset.url;image.dataset.art=id;image.draggable=false;
  if(!container)return ()=>{};
  const record=registry(image.ownerDocument);record.images.set(image,{id,occupancy,container});record.schedule();
  return ()=>record.images.delete(image);
}
