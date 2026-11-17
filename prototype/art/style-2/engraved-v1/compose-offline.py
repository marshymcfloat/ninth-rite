"""Offline layout proofs assembled from approved files, never browser screenshots."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
FONT_ROOT=ROOT.parents[2]/'public'/'fonts'
FONT_ROOT=Path('C:/Programming/marshy-slots/prototype/public/fonts')
W,H=1920,1080
IVORY='#e8e1d2';MUTED='#a7a69a';INK='#121619';CRIMSON='#72243a'
manifest=json.loads((ROOT/'asset-manifest.json').read_text())
assets={x['id']:x for x in manifest['assets'] if x['status']=='review-candidate'}

def font(size,serif=False):return ImageFont.truetype(str(FONT_ROOT/('LibreBaskerville.ttf' if serif else 'Inter.ttf')),round(size))
def text(im,xy,value,size=20,color=IVORY,serif=False,anchor='mm'):
    ImageDraw.Draw(im).text(xy,value,font=font(size,serif),fill=color,anchor=anchor,stroke_width=0)
def art(identity):return Image.open(ROOT/assets[identity]['export']['path']).convert('RGBA')
def place(im,identity,box,contain=True):
    pic=art(identity);x,y,w,h=box
    if identity.startswith('symbol-'):
        left,top,right,bottom=assets[identity]['export']['alpha']['visibleBoundsAlpha16']
        scale=min(w/(right-left),h/(bottom-top));size=(round(pic.width*scale),round(pic.height*scale))
        pic=pic.resize(size,Image.Resampling.LANCZOS)
        x+=w/2-(left+right)/2*scale;y+=h/2-(top+bottom)/2*scale
    elif contain:
        scale=min(w/pic.width,h/pic.height);size=(round(pic.width*scale),round(pic.height*scale));pic=pic.resize(size,Image.Resampling.LANCZOS);x+=(w-size[0])/2;y+=(h-size[1])/2
    else:pic=pic.resize((round(w),round(h)),Image.Resampling.LANCZOS)
    im.alpha_composite(pic,(round(x),round(y)))
def background(identity='environment-base'):
    im=art(identity).resize((W,H),Image.Resampling.LANCZOS)
    im.alpha_composite(Image.new('RGBA',(W,H),(2,4,7,55)))
    text(im,(25,24),'OFFLINE COMPOSITION · FIRST 8 ASSETS',14,MUTED,anchor='lm')
    text(im,(1895,1055),'STATIC ART REVIEW · ILLUSTRATIVE VALUES',12,MUTED,anchor='rm')
    return im
def button(im,box,label):
    x,y,w,h=box;d=ImageDraw.Draw(im);d.rectangle((x,y,x+w,y+h),fill=CRIMSON,outline='#9b8b78',width=1);text(im,(x+w/2,y+h/2),label,21)
def save(im,name):im.convert('RGB').save(ROOT/'review'/name)

im=background();d=ImageDraw.Draw(im)
gx,gy,gw,gh=403,259,1018,600
d.rectangle((gx,gy,gx+gw,gy+gh),fill=INK)
symbols=['symbol-j','symbol-chalice','symbol-j','symbol-scatter','symbol-j','symbol-chalice',
         'symbol-chalice','symbol-j','symbol-chalice','symbol-j','symbol-chalice','symbol-j',
         'symbol-j','symbol-chalice','symbol-j','symbol-chalice','symbol-j','symbol-scatter',
         'symbol-chalice','symbol-j','symbol-chalice','symbol-j','symbol-chalice','symbol-j',
         'symbol-j','symbol-chalice','symbol-j','symbol-chalice','symbol-j','symbol-chalice']
for i,identity in enumerate(symbols):
    row,col=divmod(i,6);x,y=gx+col*gw/6,gy+row*gh/5
    d.rectangle((x,y,x+gw/6,y+gh/5),outline='#2c3133',width=1)
    scale=.94 if identity=='symbol-scatter' else .86
    cw,ch=gw/6,gh/5;place(im,identity,(x+cw*(1-scale)/2,y+ch*(1-scale)/2,cw*scale,ch*scale))
frame=art('frame');ap=assets['frame']['exportAperture'];k=min(gw/ap['width'],gh/ap['height'])
frame=frame.resize((round(frame.width*k),round(frame.height*k)),Image.Resampling.LANCZOS)
im.alpha_composite(frame,(round(gx-ap['x']*k),round(gy-ap['y']*k)))
text(im,(900,62),'THE ALTAR',15,MUTED)
text(im,(900,119),'×1',63,serif=True)
text(im,(900,177),'0 / 5  BLOOD',15,MUTED)
text(im,(172,285),'THE',19)
text(im,(172,355),'NINTH',65,serif=True)
text(im,(172,432),'RITE',85,serif=True)
text(im,(172,500),'A pact with the unseen',17,MUTED,True)
button(im,(68,620,220,62),'CHOOSE YOUR RITE')
text(im,(1680,219),'THE HOLLOW HALO',23,IVORY,True)
priest=art('priest-neutral');reg=assets['priest-neutral']['registration'];k=595/(reg['footY']-reg['headY'])
priest=priest.resize((round(priest.width*k),round(priest.height*k)),Image.Resampling.LANCZOS)
im.alpha_composite(priest,(round(1680-reg['footX']*k),round(270-reg['headY']*k)))
im.alpha_composite(Image.new('RGBA',(250,50),(7,10,13,185)),(1555,885))
text(im,(1680,911),'OFFERINGS   0 / 3',17,MUTED)
text(im,(912,916),'STANDARD',17,MUTED)
d=ImageDraw.Draw(im);d.rectangle((345,958,1580,1040),fill='#161a1ddd',outline='#75776f',width=1)
for x,label,value in [(500,'PLAY BALANCE','10,000.00'),(1020,'ROUND WIN','0.00'),(1230,'BASE BET','1.00')]:text(im,(x,979),label,12,MUTED);text(im,(x,1013),value,27)
for dy in [-10,0,10]:d.line((370,1000+dy,397,1000+dy),fill=IVORY,width=3)
for x,label in [(1146,'−'),(1320,'+')]:d.ellipse((x-23,977,x+23,1023),fill='#242a2c',outline='#aaac9f',width=2);text(im,(x,1000),label,26)
d.ellipse((1410,935,1535,1060),fill='#3a2630',outline='#ddd5c3',width=4);text(im,(1472,990),'↻',72);text(im,(1472,1030),'SPIN',11)
save(im,'main-1920-offline.png');im.resize((1280,720),Image.Resampling.LANCZOS).convert('RGB').save(ROOT/'review/main-1280-offline.png')

im=background();im.alpha_composite(Image.new('RGBA',(W,H),(3,5,9,110)))
text(im,(960,128),'THE NINTH RITE',17,MUTED)
text(im,(960,214),'Greater Rite',70,serif=True)
place(im,'rite-greater',(215,295,920,580))
text(im,(1390,410),'AWARDED',17,MUTED)
text(im,(1390,530),'12',155,serif=True)
text(im,(1390,653),'FREE SPINS',30)
text(im,(1390,729),'STARTING ALTAR  ×64',22,MUTED)
text(im,(960,905),'Three Offerings invoke a pending multiplier.',20,MUTED)
button(im,(760,950,400,66),'ENTER THE RITE')
save(im,'greater-entry-offline.png')

im=background('feature-result')
text(im,(960,235),'RITUAL COMPLETE',19,MUTED)
text(im,(960,330),'The rite is complete',62,serif=True)
text(im,(960,478),'1,250.00',131,serif=True)
text(im,(960,585),'TOTAL RETURN · PLAY CREDITS',21,MUTED)
text(im,(960,675),'Greater Rite',25,IVORY,True)
button(im,(760,745,400,67),'CONTINUE')
save(im,'feature-result-offline.png')
print('Created four offline compositions; not browser screenshots.')
