const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art/style-2/engraved-rig-v1/sources'),output=path.join(root,'public/style-2/media/engraved-rig-v1');
const url='/style-2/media/engraved-rig-v1/';
const assets={};
async function pixels(id){const {data,info}=await sharp(path.join(source,id+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,info};}
function bounds(data,{width,height}){let box=[width,height,-1,-1];for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>16){box=[Math.min(box[0],x),Math.min(box[1],y),Math.max(box[2],x),Math.max(box[3],y)];}return box;}
function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
async function emit(id,raw,sourceId,maxSize=700,mask){
  const {info}=raw,data=Buffer.from(raw.data),{width,height}=info;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=(y*width+x)*4,a=data[p+3];
    let keep=true;
    if(mask){keep=false;for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1&&!keep;dx++)keep=mask(x+dx,y+dy);}
    if(!keep||a<3)data.fill(0,p,p+4);else if(a>=245)data[p+3]=255;
  }
  const file=path.join(output,id+'.webp');
  await sharp(data,{raw:{width,height,channels:4}}).resize({width:maxSize,height:maxSize,fit:'inside',withoutEnlargement:true}).webp({quality:94,alphaQuality:100,effort:6}).toFile(file);
  const m=await sharp(file).metadata(),stat=await fs.stat(file);
  assets[id]={url:url+id+'.webp',source:sourceId+'.png',native:[width,height],runtime:[m.width,m.height],alpha:true,bounds:bounds(data,info),bytes:stat.size};
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const body=await pixels('body');
  const stole=[[435,126],[586,78],[609,147],[553,307],[522,1268],[475,1303],[348,1274],[382,439]];
  function bodyPart(x,y){if(y>=1430)return 'feet';if(y<157&&x>400&&x<600)return 'neck';if(inside(x,y,stole))return 'stole';if(y>=640)return 'robe';if(x<390||x>565)return 'cape';return 'torso';}
  for(const id of ['feet','robe','torso','cape','stole','neck'])await emit(id,body,'body',1280,(x,y)=>bodyPart(x,y)===id);
  for(const side of ['free','holding']){
    const id=side+'-sleeve',raw=await pixels(id);
    const split=side==='free'?((x,y)=>y>800||x<540):((x,y)=>y>740);
    await emit(side+'-upperarm',raw,id,600,(x,y)=>!split(x,y));
    await emit(side+'-forearm',raw,id,600,split);
  }
  for(const [id,size] of [['head',650],['head-blink',650],['head-attentive',650],['free-hand',360],['free-hand-between',360],['free-hand-open',360],['holding-hand-final',400],['vessel',300],['ruby',140]])await emit(id,await pixels(id),id,size);
  const manifest={version:'engraved-rig.1',referenceCanvas:[1000,1600],registration:{footX:500,footY:1520,headY:80,uniformScaleOnly:true},
    sources:'prototype/art/style-2/engraved-rig-v1/sources',assets,
    body:{scale:.87,x:100,y:180,hinge:[540,800],fixedBelow:1430},
    head:{scale:.21,x:365,y:74,pivot:[870,1020],facePatches:{rect:[310,465,410,235]}},
    free:{scale:.24,shoulder:[930,240],elbow:[660,980],wrist:[160,750],at:[475,465],baseElbow:45},
    holding:{scale:.27,shoulder:[900,190],elbow:[920,930],wrist:[330,970],at:[665,380]},
    freeHand:{scale:.075,pivot:[360,1040],rotation:-75,cropBottom:1050},holdingHand:{scale:.145,pivot:[1320,585]},
    vessel:{scale:.095,pivot:[640,1150],fromWrist:[-93,20]},ruby:{scale:.045,pivot:[615,630],fromVessel:[0,-115]},
    motionLimits:{torso:[-4,4],head:[-14,14],freeShoulder:[-12,38],freeElbow:[-20,32],holdingShoulder:[-7,8],holdingElbow:[-12,12],wrist:[-24,24]},
    drawOrder:["feet","robe","free-upperarm","free-forearm","torso","cape","stole","neck","holding-upperarm","holding-forearm","head","head-attentive","head-blink","holding-hand-final","vessel","@chain","@ruby-glow","ruby","free-hand","free-hand-between","free-hand-open"],
    totalBytes:Object.values(assets).reduce((n,a)=>n+a.bytes,0)};
  await fs.writeFile(path.join(output,'rig.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(root,'art/style-2/engraved-rig-v1/asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(root,'public/style-2/motion-assets.mjs'),'export const MOTION_ASSETS = '+JSON.stringify(Object.values(assets).map(a=>a.url),null,2)+';\n');
  console.log(JSON.stringify({parts:Object.keys(assets).length,bytes:manifest.totalBytes}));
})().catch(error=>{console.error(error);process.exitCode=1;});
