// Local, non-paying review: hold recorded lifecycle boundaries for inspection.
export function reviewPresentation(view,document){
  let resume,canceled=false;
  const next=document.createElement('button');next.textContent='Continue review';next.hidden=true;
  next.style.cssText='position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:100;padding:10px 20px;border:1px solid #d2be92;background:#172026;color:#fff;font:14px sans-serif';
  next.addEventListener('click',()=>resume?.());document.body.append(next);
  const cancel=()=>{canceled=true;resume?.();};document.getElementById('skipPlayback').addEventListener('click',cancel);
  const visibility=()=>{if(document.hidden)cancel();};document.addEventListener('visibilitychange',visibility);
  return {...view,async event(event,model,book,context){
    await view.event(event,model,book,context);
    const boundary=['interventionPending','interventionDeferred','interventionConfirmed','interventionExpired'].includes(event.type)||(event.type==='spinStart'&&model.pending);
    if(boundary&&!canceled&&!document.hidden){next.hidden=false;await new Promise(resolve=>{resume=resolve;});resume=null;next.hidden=true;}
  },async end(book,model){cancel();next.remove();document.getElementById('skipPlayback').removeEventListener('click',cancel);document.removeEventListener('visibilitychange',visibility);await view.end(book,model);}};
}
