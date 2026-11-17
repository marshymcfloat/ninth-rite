const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),pack=path.join(root,'art/style-2/engraved-rig-v2'),output=path.join(root,'public/style-2/media/engraved-rig-v2');
const source=path.join(root,'art/style-2/engraved-rig-v1/sources'),url='/style-2/media/engraved-rig-v2/';
function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
const grip=[[215,495],[335,490],[430,550],[535,605],[650,632],[790,630],[900,621],[1005,650],[1010,760],[855,820],[635,830],[430,790],[250,720],[210,635]];
const cuffEdge=y=>137+(y-730)*.086+70*Math.sqrt(Math.max(0,1-((y-730)/285)**2));
const front=(x,y)=>y>=440&&y<=1100&&x>=cuffEdge(y)&&x<=550;
const lining=(x,y)=>y>=435&&y<=1035&&x<cuffEdge(y);
const forearm=(x,y)=>y>800||x<540;
async function emit(manifest,id,sourceId,mask,{original=path.join(source,sourceId+'.png'),maxSize=sourceId==='free-sleeve'?600:400}={}){
  const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const bounds=[info.width,info.height,-1,-1];
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const p=(y*info.width+x)*4;let keep=false;
    for(let dy=-3;dy<=3&&!keep;dy++)for(let dx=-3;dx<=3&&!keep;dx++)keep=mask(x+dx,y+dy);
    if(!keep||data[p+3]<3)data.fill(0,p,p+4);else{if(data[p+3]>=245)data[p+3]=255;if(data[p+3]>16){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}}
  }
  const originalLayer=path.join(pack,'sources',id+'.png');
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(originalLayer);
  const runtime=path.join(output,id+'.webp');
  await sharp(originalLayer).resize({width:maxSize,height:maxSize,fit:'inside',withoutEnlargement:true}).webp({quality:94,alphaQuality:100,effort:6}).toFile(runtime);
  const meta=await sharp(runtime).metadata();
  manifest.assets[id]={url:url+id+'.webp',source:'engraved-rig-v2/sources/'+id+'.png',derivedFrom:path.relative(path.join(root,'art/style-2'),original).replaceAll('\\','/'),native:[info.width,info.height],runtime:[meta.width,meta.height],alpha:true,bounds,bytes:(await fs.stat(runtime)).size};
}
(async()=>{
  await fs.mkdir(path.join(pack,'sources'),{recursive:true});await fs.mkdir(output,{recursive:true});
  const manifest=JSON.parse(await fs.readFile(path.join(root,'public/style-2/media/engraved-rig-v1/rig.json'),'utf8'));
  manifest.version='engraved-rig.2';manifest.sources='prototype/art/style-2/engraved-rig-v2/sources';
  manifest.sourceRoot='prototype/art/style-2';
  for(const a of Object.values(manifest.assets))a.source='engraved-rig-v1/sources/'+a.source;
  await emit(manifest,'holding-hand-final','holding-hand-final',(x,y)=>!inside(x,y,grip));
  await emit(manifest,'holding-hand-front','holding-hand-final',(x,y)=>inside(x,y,grip));
  await emit(manifest,'free-forearm','free-sleeve',(x,y)=>forearm(x,y)&&!front(x,y)&&!lining(x,y));
  await emit(manifest,'free-cuff-back','free-sleeve',(x,y)=>forearm(x,y)&&lining(x,y));
  await emit(manifest,'free-cuff-front','free-sleeve',(x,y)=>forearm(x,y)&&front(x,y));
  await emit(manifest,'free-wrist-extension','free-wrist-original',(x,y)=>y>=410&&y<=660,{original:path.join(pack,'sources/free-wrist-original.png')});
  manifest.free={...manifest.free,wrist:[265,775],rigidCuff:{end:520,blendEnd:700,minY:350}};
  manifest.freeHand={...manifest.freeHand,scale:.09,cropBottom:null,concealedOverlap:[12,20]};
  manifest.freeWrist={scale:1.25,offset:[-700,470],space:'free-hand native coordinates',crop:[0,410,1216,250]};
  manifest.occlusion={supportingHand:{foregroundPolygon:grip,contact:'lower chalice base',rear:'holding-hand-final',front:'holding-hand-front'},freeCuff:{opening:[137,730,70,285],wristRoot:[265,775],front:'free-cuff-front',rear:'free-cuff-back',concealedRootDepth:14,cutEdge:[[100,1070],[170,1100],[240,1150],[320,1210],[420,1230]]}};
  manifest.drawOrder=['feet','robe','free-upperarm','torso','cape','stole','neck','free-forearm','free-cuff-back','free-wrist-extension','free-hand','free-hand-between','free-hand-open','free-cuff-front','holding-upperarm','holding-forearm','head','head-attentive','head-blink','holding-hand-final','vessel','holding-hand-front','@chain','@ruby-glow','ruby'];
  manifest.totalBytes=Object.values(manifest.assets).reduce((n,a)=>n+a.bytes,0);
  await fs.writeFile(path.join(output,'rig.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(pack,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(root,'public/style-2/motion-assets-v2.mjs'),'export const MOTION_ASSETS_V2 = '+JSON.stringify(Object.values(manifest.assets).filter(a=>a.url.startsWith(url)).map(a=>a.url),null,2)+';\n');
  console.log(JSON.stringify({parts:Object.keys(manifest.assets).length,bytes:manifest.totalBytes}));
})().catch(error=>{console.error(error);process.exitCode=1;});
