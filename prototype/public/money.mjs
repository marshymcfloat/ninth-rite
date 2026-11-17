let displayCurrency=null;
export function setDisplayCurrency(currency){displayCurrency=currency;}
export function formatMoney(value,currency=displayCurrency){
  const amount=Number(value),options={minimumFractionDigits:2,maximumFractionDigits:6};
  if(['SC','GC','XSC','XGC','XEC'].includes(currency))return `${amount.toLocaleString('en-US',options)} ${currency==='XEC'?'SC':currency.replace(/^X/,'')}`;
  if(currency){try{const minimumFractionDigits=new Intl.NumberFormat('en-US',{style:'currency',currency}).resolvedOptions().minimumFractionDigits;return amount.toLocaleString('en-US',{...options,minimumFractionDigits,style:'currency',currency});}catch{return `${amount.toLocaleString('en-US',options)} ${currency}`;}}
  return amount.toLocaleString('en-US',options);
}
