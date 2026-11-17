const replacements=[['be awarded to player’s accounts','appear in player’s accounts'],['at the cost of','for'],['place your bets','come and play'],['bonus buy','feature'],['buy bonus','get bonus'],['total bet','total play'],['play credits','play balance'],['cost of','can be played for'],['win feature','play feature'],['paid out','win'],['pays out','won'],['pay out','won'],['paytable','award table'],['wagers','plays'],['wager','play'],['payouts','awards'],['payout','award'],['purchased','instantly triggered'],['purchase','play'],['bought','instantly triggered'],['betting','playing'],['bets','plays'],['bet','play'],['buy','play'],['credits','balance'],['credit','balance'],['currency','token'],['cash','coins'],['money','coins'],['paid','won'],['payer','winner'],['pays','wins'],['pay','win'],['stake','play amount'],['deposits','coins'],['deposit','get coins'],['funds','balance'],['fund','balance'],['gamble','play'],['rebet','respin'],['withdraw','redeem']].sort((a,b)=>b[0].length-a[0].length);
export function socialText(value){
  let text=value;
  for(const [from,to] of replacements)text=text.replace(new RegExp(`\\b${from}\\b`,'gi'),match=>match===match.toUpperCase()?to.toUpperCase():match[0]===match[0].toUpperCase()?to[0].toUpperCase()+to.slice(1):to);
  return text;
}
export function installSocialText(root=document.body){
  const update=node=>{
    if(node.nodeType===3){if(!['SCRIPT','STYLE'].includes(node.parentElement?.tagName)){const text=socialText(node.nodeValue);if(text!==node.nodeValue)node.nodeValue=text;}return;}
    if(node.nodeType!==1)return;
    if(['SCRIPT','STYLE'].includes(node.tagName))return;
    for(const attr of ['aria-label','title','placeholder'])if(node.hasAttribute(attr)){const old=node.getAttribute(attr),text=socialText(old);if(old!==text)node.setAttribute(attr,text);}
    for(const child of node.childNodes)update(child);
  };
  update(root);
  const observer=new MutationObserver(records=>{observer.disconnect();for(const r of records){if(r.type==='childList')for(const n of r.addedNodes)update(n);else update(r.target);}observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});});
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});return ()=>observer.disconnect();
}
