import {artUrl,getArt} from './art.mjs';

// Corners and center ornaments retain one scale. Rail strips repeat without stretching.
export function frameSvg(width,height,_scale,source=artUrl('frame')){
  if(width<=0||height<=0)return '';
  const asset=getArt('frame'),ap=asset.aperture,k=Math.min(width/ap.width,height/ap.height);
  const right=ap.x+ap.width,bottom=ap.y+ap.height;
  const crop=(x,y,w,h,dx,dy)=>`<svg x="${dx}" y="${dy}" width="${w*k}" height="${h*k}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><image href="${source}" width="${asset.width}" height="${asset.height}"/></svg>`;
  const leftEnd=(350-ap.x)*k,rightStart=width+(1250-right)*k;
  const topEnd=(420-ap.y)*k,bottomStart=height+(850-bottom)*k;
  const topY=-ap.y*k,bottomY=height+(920-bottom)*k,leftX=-ap.x*k,rightX=width+(1365-right)*k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="visible" aria-hidden="true">
    <defs>
      <pattern id="engraved-frame-top" width="${160*k}" height="${265*k}" patternUnits="userSpaceOnUse" x="${leftEnd}" y="${topY}">${crop(400,0,160,265,0,0)}</pattern>
      <pattern id="engraved-frame-bottom" width="${160*k}" height="${206*k}" patternUnits="userSpaceOnUse" x="${leftEnd}" y="${bottomY}">${crop(400,920,160,206,0,0)}</pattern>
      <pattern id="engraved-frame-left" width="${235*k}" height="${100*k}" patternUnits="userSpaceOnUse" x="${leftX}" y="${topEnd}">${crop(0,480,235,100,0,0)}</pattern>
      <pattern id="engraved-frame-right" width="${235*k}" height="${100*k}" patternUnits="userSpaceOnUse" x="${rightX}" y="${topEnd}">${crop(1365,480,235,100,0,0)}</pattern>
    </defs>
    <rect x="${leftEnd}" y="${topY}" width="${Math.max(0,rightStart-leftEnd)}" height="${265*k}" fill="url(#engraved-frame-top)"/>
    <rect x="${leftEnd}" y="${bottomY}" width="${Math.max(0,rightStart-leftEnd)}" height="${206*k}" fill="url(#engraved-frame-bottom)"/>
    <rect x="${leftX}" y="${topEnd}" width="${235*k}" height="${Math.max(0,bottomStart-topEnd)}" fill="url(#engraved-frame-left)"/>
    <rect x="${rightX}" y="${topEnd}" width="${235*k}" height="${Math.max(0,bottomStart-topEnd)}" fill="url(#engraved-frame-right)"/>
    ${crop(0,0,350,420,leftX,topY)}
    ${crop(1250,0,350,420,rightStart,topY)}
    ${crop(0,850,350,276,leftX,bottomStart)}
    ${crop(1250,850,350,276,rightStart,bottomStart)}
    ${crop(700,0,200,300,(width-200*k)/2,topY)}
    ${crop(700,920,200,206,(width-200*k)/2,bottomY)}
  </svg>`;
}
