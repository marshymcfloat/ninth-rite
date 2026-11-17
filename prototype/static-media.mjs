import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';

export async function serveVideo(request,response,path,mime){
  let size;
  try{({size}=await stat(path));}
  catch(error){if(error.code!=='ENOENT')throw error;response.writeHead(404);response.end();return;}
  const headers={'Content-Type':mime,'Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  let start=0,end=size-1,status=200;
  if(request.headers.range&&request.method!=='HEAD'){
    const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if(match&&(match[1]||match[2])){
      if(!match[1])start=Math.max(0,size-Number(match[2]));
      else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    }
    if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){
      response.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});response.end();return;
    }
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);
  response.writeHead(status,headers);
  if(request.method==='HEAD'||!size){response.end();return;}
  const stream=createReadStream(path,{start,end});
  response.on('close',()=>stream.destroy());
  stream.on('error',error=>response.destroy(error));
  stream.pipe(response);
}
