"""Technical composite sheets at intended asset sizes. No new artwork or matte edits."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent
M=json.loads((ROOT/'asset-manifest.json').read_text())
A={a['id']:a for a in M['assets'] if a['status']=='review-candidate'}
FONT='C:/Windows/Fonts/arial.ttf'
def label(im,xy,s,n=15,c='#dedad0'):
    ImageDraw.Draw(im).text(xy,s,font=ImageFont.truetype(FONT,n),fill=c)
def pic(id):return Image.open(ROOT/A[id]['export']['path']).convert('RGBA')
def opt(im,id,box):
    p=pic(id);l,t,r,b=A[id]['export']['alpha']['visibleBoundsAlpha16'];x,y,w,h=box;k=min(w/(r-l),h/(b-t))
    p=p.resize((round(p.width*k),round(p.height*k)),Image.Resampling.LANCZOS)
    im.alpha_composite(p,(round(x+w/2-(l+r)*k/2),round(y+h/2-(t+b)*k/2)))
symbols=['symbol-'+x for x in ['j','q','k','a','chalice','crown','eye','reliquary','scatter']]
if all(x in A for x in symbols):
    out=Image.new('RGBA',(1440,650),'#0b0d0f')
    label(out,(20,15),'SYMBOL FAMILY · visible art height 80 px / 100 px · native raster exports',20)
    for row,bg in enumerate(['#111619','#808080']):
        y=55+row*295;ImageDraw.Draw(out).rectangle((0,y,1440,y+295),fill=bg)
        for i,id in enumerate(symbols):
            x=i*160;label(out,(x+10,y+10),id.replace('symbol-','').upper(),14)
            opt(out,id,(x+25,y+40,110,80));opt(out,id,(x+20,y+145,120,100))
    out.convert('RGB').save(ROOT/'qa/symbol-comparison.png')
priests=['priest-'+x for x in ['neutral','invocation','bonus','benediction','expiry']]
if all(x in A for x in priests):
    out=Image.new('RGBA',(1500,800),'#202427');d=ImageDraw.Draw(out)
    d.line((0,55,1500,55),fill='#74675f');d.line((0,725,1500,725),fill='#74675f')
    for i,id in enumerate(priests):
        p=pic(id);r=A[id]['registration'];k=670/(r['footY']-r['headY']);p=p.resize((round(p.width*k),round(p.height*k)),Image.Resampling.LANCZOS)
        x=i*300+150;out.alpha_composite(p,(round(x-r['footX']*k),round(55-r['headY']*k)))
        d.line((x,720,x,735),fill='#c79e79',width=1);label(out,(i*300+12,752),id,17)
    label(out,(14,12),'REGISTERED STILL POSES · common hair-top, lowest sole and standing-footprint midpoint',17)
    out.convert('RGB').save(ROOT/'qa/priest-comparison.png')
states=['blood-empty','blood-filled','offering-empty','offering-filled','offering-mark']
if all(x in A for x in states):
    out=Image.new('RGBA',(1200,600),'#111619')
    label(out,(20,15),'MECHANIC STATES · same display size and registered base',20)
    for row,bg in enumerate(['#111619','#808080']):
        y=60+row*260;ImageDraw.Draw(out).rectangle((0,y,1200,y+260),fill=bg)
        for i,id in enumerate(states):
            x=i*240;label(out,(x+15,y+12),id,16)
            if id.startswith('blood-'):
                opt(out,id,(x+35,y+65,30,42));opt(out,id,(x+110,y+65,22,28))
                label(out,(x+20,y+160),'42 px / 28 px',14)
            elif id=='offering-mark':
                opt(out,id,(x+35,y+65,44,44));opt(out,id,(x+120,y+65,27,27))
                label(out,(x+20,y+160),'44 px / 27 px',14)
            else:
                opt(out,id,(x+40,y+50,70,115));opt(out,id,(x+132,y+65,55,95))
                label(out,(x+20,y+190),'115 px / 95 px',14)
    out.convert('RGB').save(ROOT/'qa/mechanics-comparison.png')
print('Comparison sheets updated from present exports.')
