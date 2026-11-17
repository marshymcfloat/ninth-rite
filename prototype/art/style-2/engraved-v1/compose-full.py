"""Offline static layout/scale proofs, assembled from generated files and live-type equivalents."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
FONTS=Path('C:/Programming/marshy-slots/prototype/public/fonts')
M=json.loads((ROOT/'asset-manifest.json').read_text())
A={a['id']:a for a in M['assets'] if a['status']=='review-candidate'}
W,H=1920,1080
IVORY='#e8e1d2';MUTED='#aaa99d';INK='#111619';CRIMSON='#70273a'
TIERS=[1,2,4,8,16,32,64,120,250,500,1000,2500]

def font(n,serif=False):return ImageFont.truetype(str(FONTS/('LibreBaskerville.ttf' if serif else 'Inter.ttf')),round(n))
def text(im,xy,s,n=20,c=IVORY,serif=False,anchor='mm'):
    ImageDraw.Draw(im).text(xy,s,font=font(n,serif),fill=c,anchor=anchor)
def art(id):return Image.open(ROOT/A[id]['export']['path']).convert('RGBA')
def place(im,id,box,opacity=1,optical=True):
    pic=art(id);x,y,w,h=box
    if optical and A[id]['alpha']:
        l,t,r,b=A[id]['export']['alpha']['visibleBoundsAlpha16']
    else:l,t,r,b=0,0,pic.width,pic.height
    k=min(w/(r-l),h/(b-t));pic=pic.resize((round(pic.width*k),round(pic.height*k)),Image.Resampling.LANCZOS)
    if opacity!=1:pic.putalpha(pic.getchannel('A').point(lambda v:round(v*opacity)))
    x+=w/2-(l+r)/2*k;y+=h/2-(t+b)/2*k
    im.alpha_composite(pic,(round(x),round(y)))
    return x,y,k
def background(id='environment-base',dim=35):
    im=art(id).resize((W,H),Image.Resampling.LANCZOS)
    im.alpha_composite(Image.new('RGBA',(W,H),(2,4,7,dim)))
    text(im,(24,20),'OFFLINE COMPOSITION · ENGRAVED STILL CANDIDATE',13,MUTED,anchor='lm')
    text(im,(1894,1058),'STATIC REVIEW · ILLUSTRATIVE VALUES · NOT A BROWSER SCREENSHOT',12,MUTED,anchor='rm')
    return im
def button(im,b,label,n=20):
    x,y,w,h=b;ImageDraw.Draw(im).rectangle((x,y,x+w,y+h),fill=CRIMSON,outline='#9d8e78',width=1)
    text(im,(x+w/2,y+h/2),label,n)
def save(im,name):im.convert('RGB').save(ROOT/'review'/name)
def pose(im,id,foot_x=1680,head_y=295,foot_y=875):
    pic=art(id);r=A[id]['registration'];k=(foot_y-head_y)/(r['footY']-r['headY'])
    pic=pic.resize((round(pic.width*k),round(pic.height*k)),Image.Resampling.LANCZOS)
    im.alpha_composite(pic,(round(foot_x-r['footX']*k),round(head_y-r['headY']*k)))

def main(pending=None):
    im=background('environment-bonus' if pending else 'environment-base');d=ImageDraw.Draw(im)
    gx,gy,gw,gh=403,259,1018,600
    d.rectangle((gx,gy,gx+gw,gy+gh),fill=INK)
    symbols=['symbol-j','symbol-chalice','symbol-q','symbol-scatter','symbol-a','symbol-crown',
      'symbol-eye','symbol-k','symbol-reliquary','symbol-a','symbol-chalice','symbol-j',
      'symbol-q','symbol-chalice','symbol-j','symbol-crown','symbol-k','symbol-scatter',
      'symbol-reliquary','symbol-k','symbol-eye','symbol-j','symbol-chalice','symbol-a',
      'symbol-j','symbol-crown','symbol-q','symbol-chalice','symbol-a','symbol-eye']
    for i,id in enumerate(symbols):
        row,col=divmod(i,6);x,y=gx+col*gw/6,gy+row*gh/5;cw,ch=gw/6,gh/5
        d.rectangle((x,y,x+cw,y+ch),outline='#292e31',width=1)
        s=.91 if id=='symbol-scatter' else .83
        place(im,id,(x+cw*(1-s)/2,y+ch*(1-s)/2,cw*s,ch*s))
        if id=='symbol-scatter':text(im,(x+cw/2,y+ch-7),'SCATTER',10)
        if pending and i in [7,19]:place(im,'offering-mark',(x+cw-34,y+7,27,27))
    frame=art('frame');ap=A['frame']['exportAperture'];k=min(gw/ap['width'],gh/ap['height'])
    frame=frame.resize((round(frame.width*k),round(frame.height*k)),Image.Resampling.LANCZOS)
    im.alpha_composite(frame,(round(gx-ap['x']*k),round(gy-ap['y']*k)))
    current=64 if pending else 1
    text(im,(729,43),'THE ALTAR',15,MUTED)
    text(im,(858,43),'×'+str(current),35,serif=True)
    for i in range(5):place(im,'blood-filled' if i<2 else 'blood-empty',(931+i*29,26,22,28))
    text(im,(1137,43),'2 / 5 BLOOD',14,MUTED)
    place(im,'altar-surround',(403,62,1018,168))
    d.line((635,169,1190,169),fill='#363a38',width=3)
    d.line((635,169,654+TIERS.index(current)*47,169),fill='#8b3548',width=3)
    for i,tier in enumerate(TIERS):
        x=654+i*47
        if tier==current:d.ellipse((x-21,123,x+21,165),fill='#5d2634',outline='#bca887',width=1)
        text(im,(x,145),'×'+str(tier),15,IVORY if tier<=current else '#8f948f',tier==current)
    place(im,'logo-ornament',(40,235,260,100))
    text(im,(170,353),'THE',14);text(im,(170,395),'NINTH',40,serif=True);text(im,(170,443),'RITE',46,serif=True)
    text(im,(170,505),'A pact with the unseen',16,MUTED,True)
    button(im,(60,570,220,58),'CHOOSE YOUR RITE',16)
    text(im,(1680,270),'THE HOLLOW HALO',21,IVORY,True)
    if pending:
        place(im,'ray-texture',(1503,264,355,600),.18)
        place(im,'rose-halo',(1530,58,300,165),.65)
        d.ellipse((1613,101,1747,190),fill='#111619d9')
        text(im,(1680,44),'PENDING',15,MUTED)
        text(im,(1680,146),'×250',44,serif=True)
        text(im,(1680,238),'Win the next tumble' if pending=='first' else 'Last chance · Win on the next spin',15)
    pose(im,'priest-invocation' if pending else 'priest-neutral')
    im.alpha_composite(Image.new('RGBA',(275,144),(7,10,13,175)),(1542,863))
    for i in range(3):place(im,'offering-empty',(1577+i*68,881,62,93))
    text(im,(1680,988),'OFFERINGS  '+('0 / 3' if pending else 'BONUS ONLY'),12,MUTED)
    text(im,(912,919),'BLOOD RITE' if pending else 'STANDARD',17,MUTED)
    if pending:
        d.rectangle((1348,54,1458,153),fill='#111619df',outline='#756f64')
        text(im,(1403,75),'FREE SPINS',12,MUTED)
        text(im,(1403,119),'11',44,serif=True)
    d=ImageDraw.Draw(im);d.rectangle((345,958,1518,1040),fill='#161a1ddd',outline='#75776f',width=1)
    for x,label,value in [(500,'PLAY BALANCE','10,000.00'),(1000,'ROUND WIN','0.00'),(1200,'BASE BET','1.00')]:text(im,(x,979),label,12,MUTED);text(im,(x,1013),value,27)
    for dy in [-10,0,10]:d.line((370,1000+dy,397,1000+dy),fill=IVORY,width=3)
    for x,label in [(1110,'−'),(1292,'+')]:d.ellipse((x-22,978,x+22,1022),fill='#242a2c',outline='#aaac9f',width=2);text(im,(x,1000),label,26)
    d.ellipse((1364,935,1489,1060),fill='#3a2630',outline='#ddd5c3',width=4);text(im,(1426,988),'↻',72);text(im,(1426,1030),'SPIN',11)
    return im

def selector():
    im=background(dim=178);text(im,(960,79),'Choose your rite',54,serif=True)
    for i,(id,title,spins,mult,cost) in enumerate([('lesser','Lesser Rite','10 FREE SPINS','START AT ×16','100.00'),('blood','Blood Rite','12 FREE SPINS','START AT ×32','200.00'),('greater','Greater Rite','12 FREE SPINS','START AT ×64','500.00'),('god','God Mode','1 RITUAL SPIN','GUARANTEED INTERVENTION','1,000.00')]):
        x=315+i*330
        ImageDraw.Draw(im).rounded_rectangle((x,170,x+300,610),14,fill='#181b20',outline='#756f64',width=1)
        place(im,'rite-'+id,(x+8,175,284,211))
        ImageDraw.Draw(im).rounded_rectangle((x,375,x+300,610),14,fill='#e8e1d1')
        text(im,(x+150,406),spins,13,CRIMSON);text(im,(x+150,447),title,27,'#1c2224',True)
        text(im,(x+150,484),mult,12,'#675e54');text(im,(x+150,526),cost,35,'#1c2224',True)
        button(im,(x+15,558,270,39),'BUY',16)
    text(im,(960,650),'BASE & CHANCE',13,MUTED)
    for i,(title,cost,ids) in enumerate([('Standard','1.00',['symbol-j','symbol-chalice','symbol-q']),('Enhanced Chance','1.50',['symbol-eye','symbol-scatter','symbol-chalice']),('Maximum Chance','3.00',['symbol-crown','symbol-reliquary','symbol-scatter'])]):
        x=480+i*330;ImageDraw.Draw(im).rounded_rectangle((x,678,x+300,920),14,fill='#e8e1d1')
        for j,id in enumerate(ids):place(im,id,(x+25+j*85,687,80,77))
        text(im,(x+150,792),title,25,'#1c2224',True);text(im,(x+150,833),cost,27,'#1c2224')
        button(im,(x+15,869,270,37),'ACTIVE' if i==0 else 'ACTIVATE',15)
    text(im,(960,977),'PLAY BALANCE  10,000.00     BASE BET  1.00',20)
    text(im,(960,1021),'Purchases require confirmation. Live controls and prices are separate from illustration.',13,MUTED)
    return im

def entry(id,title,spins,mult):
    im=background('environment-god' if id=='god' else 'environment-bonus',135)
    text(im,(960,90),'THE NINTH RITE',16,MUTED);text(im,(960,175),title,64,serif=True)
    place(im,'rite-'+id,(180,265,1000,600))
    text(im,(1420,385),'AWARDED',16,MUTED);text(im,(1420,500),str(spins),145,serif=True)
    text(im,(1420,630),'RITUAL SPIN' if id=='god' else 'FREE SPINS',29)
    text(im,(1420,705),'GUARANTEED INTERVENTION' if id=='god' else 'STARTING ALTAR  ×'+str(mult),19,MUTED)
    text(im,(960,906),'The guaranteed intervention applies before the ritual spin. No retriggers.' if id=='god' else 'Three Offerings invoke a pending multiplier. The earned altar stays separate.',20,MUTED)
    button(im,(760,955,400,61),'ENTER THE RITE');return im

def result(amount):
    im=background('feature-result',20);text(im,(960,235),'RITUAL COMPLETE',19,MUTED)
    text(im,(960,330),'The rite is complete',62,serif=True);text(im,(960,478),amount,110,serif=True)
    text(im,(960,585),'TOTAL RETURN · PLAY CREDITS',21,MUTED);text(im,(960,675),'Greater Rite',25,IVORY,True)
    button(im,(760,745,400,67),'CONTINUE');return im

def celebration(id,title,amount):
    im=background('environment-bonus',150);text(im,(960,110),title,74,serif=True)
    px,py,k=place(im,id,(345,180,1230,660))
    if id!='win-cap' and 'amountSafeRectExportXYWH' in A[id]:
        x,y,w,h=A[id]['amountSafeRectExportXYWH'];size=min(105,round(h*k*.72))
        while font(size,True).getlength(amount)>w*k*.92 and size>12:size-=1
        text(im,(px+(x+w/2)*k,py+(y+h/2)*k),amount,size,serif=True)
    else:text(im,(960,895),amount,105,serif=True)
    text(im,(960,987),'PLAY CREDITS',16,MUTED);return im

required=set(['environment-base','environment-bonus','environment-god','frame','logo-ornament','altar-surround','blood-empty','blood-filled','offering-empty','offering-filled','offering-mark','rose-halo','ray-texture','feature-result','priest-neutral','priest-invocation'])|{'symbol-'+x for x in ['j','q','k','a','chalice','crown','eye','reliquary','scatter']}|{'rite-'+x for x in ['lesser','blood','greater','god']}|{'win-'+x for x in ['big','mega','epic','divine','cap']}
missing=required-A.keys()
if missing:raise SystemExit('Waiting for required generated exports: '+', '.join(sorted(missing)))
im=main();save(im,'main-full-1920-offline.png');save(im.resize((1280,720),Image.Resampling.LANCZOS),'main-full-1280-offline.png')
save(main('first'),'pending-next-tumble-full-offline.png');save(main('second'),'pending-next-spin-full-offline.png')
save(selector(),'selector-full-offline.png')
for args in [('lesser','Lesser Rite',10,16),('blood','Blood Rite',12,32),('greater','Greater Rite',12,64),('god','God Mode',1,None)]:save(entry(*args),args[0]+'-entry-full-offline.png')
save(result('1,250.00'),'feature-result-full-offline.png');save(result('50,000,000.00'),'feature-result-long-amount-offline.png');save(result('0.00'),'feature-result-zero-offline.png')
im=background('environment-bonus',160);text(im,(960,140),'The rite continues',68,serif=True)
for x in [570,850,1130]:place(im,'symbol-scatter',(x,280,230,280))
text(im,(960,700),'+5',144,serif=True);text(im,(960,835),'FREE SPINS',28);button(im,(760,925,400,64),'CONTINUE THE RITE');save(im,'retrigger-full-offline.png')
for id,title,amount in [('win-big','BIG WIN','25.00'),('win-mega','MEGA WIN','100.00'),('win-epic','EPIC WIN','500.00'),('win-divine','DIVINE WIN','2,500.00'),('win-cap','THE ALTAR IS SEALED','50,000.00')]:save(celebration(id,title,amount),id+'-full-offline.png')
print('Created full-family static offline compositions. No browser or runtime verification claimed.')
