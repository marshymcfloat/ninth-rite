"""Technical export/registration/QA only. Generated PNG masters are never changed."""
from __future__ import annotations
import argparse, hashlib, json, math
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
CATALOG = {
    'Environments': ['environment-base','environment-bonus','environment-god'],
    'Architecture': ['frame','logo-ornament'],
    'Symbols': ['symbol-j','symbol-q','symbol-k','symbol-a','symbol-chalice','symbol-crown','symbol-eye','symbol-reliquary','symbol-scatter'],
    'Mechanics': ['altar-surround','offering-mark','blood-empty','blood-filled','offering-empty','offering-filled','rose-halo','ray-texture'],
    'Rites': ['rite-lesser','rite-blood','rite-greater','rite-god'],
    'Introduction': ['intro-blood','intro-offerings','intro-scatters'],
    'Results': ['feature-result','win-big','win-mega','win-epic','win-divine','win-cap'],
    'Priest': ['priest-neutral','priest-invocation','priest-bonus','priest-benediction','priest-expiry'],
}
OPAQUE = {'environment-base','environment-bonus','environment-god','feature-result','intro-blood','intro-offerings','intro-scatters'}
ALTAR_TIERS = [1,2,4,8,16,32,64,120,250,500,1000,2500]
SCREEN_ROLES = {
    'environment-base':['base gameplay'], 'environment-bonus':['Lesser/Blood/Greater gameplay'], 'environment-god':['God Mode gameplay'],
    'frame':['all gameplay'], 'logo-ornament':['branding','launch','gameplay'],
    'altar-surround':['earned altar progress'], 'offering-mark':['marked symbols'],
    'blood-empty':['Blood unfilled segment'],'blood-filled':['Blood earned segment'],
    'offering-empty':['empty Offering vessel'],'offering-filled':['filled Offering vessel'],
    'rose-halo':['pending intervention','confirmed intervention'],'ray-texture':['intervention light layer'],
    'feature-result':['feature completion, including zero return'],
    'win-cap':['maximum return ending'],
}
FIRST_EIGHT = {'environment-base','frame','priest-neutral','symbol-j','symbol-chalice','symbol-scatter','rite-greater','feature-result'}
RESAMPLE = Image.Resampling.LANCZOS
EXISTING = {
    'environment-base':['cathedral.webp'], 'frame':['frame.webp'],
    'symbol-j':['jack.webp'],'symbol-q':['queen.webp'],'symbol-k':['king.webp'],'symbol-a':['ace.webp'],
    'symbol-chalice':['chalice.webp'],'symbol-crown':['crown.webp'],'symbol-eye':['eye.webp'],
    'symbol-reliquary':['reliquary.webp'],'symbol-scatter':['scatter.webp'],
    'altar-surround':['altar-frame-v2.webp'],'offering-mark':['offering-seal-v2.webp'],
    'blood-empty':['offering-seal-v2.webp'],'blood-filled':['offering-seal-v2.webp'],
    'offering-empty':['offering-vessel-v2.webp'],'offering-filled':['offering-vessel-v2.webp'],
    'rose-halo':['rose-window.webp'],'ray-texture':['stained-rays.webp'],
    'rite-lesser':['rite-lesser.webp'],'rite-blood':['rite-blood.webp'],'rite-greater':['rite-greater.webp'],'rite-god':['rite-god.webp'],
    'priest-neutral':['priest.webp','priest-poster.webp'],'priest-invocation':['priest-invocation-pose.webp'],
    'priest-bonus':['priest-bonus-pose.webp'],'priest-benediction':['priest-benediction-pose.webp'],'priest-expiry':['priest-expiry-pose.webp'],
}


def hash_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_info(im):
    a = im.convert('RGBA').getchannel('A')
    h = a.histogram()
    n = im.width * im.height
    return {'extrema': list(a.getextrema()), 'nonzeroBounds': list(a.getbbox() or (0,0,0,0)),
            'visibleBoundsAlpha16': list(a.point(lambda v: 255 if v >= 16 else 0).getbbox() or (0,0,0,0)),
            'transparentFraction': round(h[0] / n,6), 'partialFraction': round(sum(h[1:255]) / n,6),
            'dominantValues': [{'alpha': v, 'pixels': c} for v,c in sorted(enumerate(h),key=lambda x:x[1],reverse=True)[:5]]}


def fit(im, size):
    scale = min(size[0]/im.width, size[1]/im.height, 1)
    return im.resize((round(im.width*scale),round(im.height*scale)), RESAMPLE)


def padded(im, size, padding=.10):
    out = Image.new('RGBA', size)
    box = (round(size[0]*(1-2*padding)),round(size[1]*(1-2*padding)))
    resized = fit(im, box)
    x,y = (size[0]-resized.width)//2,(size[1]-resized.height)//2
    out.paste(resized,(x,y))
    return out, {'paddingFractionMinimum':padding,'sourceToExport':{'scale':resized.width/im.width,'x':x,'y':y}}


def priest_export(im, identity, overrides):
    a = im.getchannel('A')
    bounds = a.point(lambda v:255 if v>=16 else 0).getbbox()
    source = overrides.get(identity)
    if source is None:
        left,top,right,bottom = bounds
        band_top = int(bottom - (bottom-top)*.055)
        points = [(x,y) for y in range(band_top,bottom) for x in range(left,right) if a.getpixel((x,y))>=128]
        foot_x = sum(p[0] for p in points)/len(points) if points else (left+right)/2
        source = {'headY':top,'footY':bottom-1,'footX':round(foot_x,3)}
    scale = 1440/(source['footY']-source['headY'])
    resized = im.resize((round(im.width*scale),round(im.height*scale)),RESAMPLE)
    x,y = round(500-source['footX']*scale),round(80-source['headY']*scale)
    out = Image.new('RGBA',(1000,1600)); out.paste(resized,(x,y))
    return out, {'registration':{'canvas':[1000,1600],'footX':500,'footY':1520,'headY':80},
                 'sourceAnchors':source,'sourceToExport':{'scale':scale,'x':x,'y':y},
                 'registrationMethod':'visually checked hair-top, lowest sole and midpoint of both shoes' if identity in overrides else 'provisional silhouette; manual head check required',
                 'uniformScaleOnly':True}


def offering_export(im):
    left,top,right,bottom=im.getchannel('A').point(lambda v:255 if v>=16 else 0).getbbox()
    scale=1024/(bottom-top)
    resized=im.resize((round(im.width*scale),round(im.height*scale)),RESAMPLE)
    x,y=round(384-(left+right)/2*scale),round(128-top*scale)
    out=Image.new('RGBA',(768,1280));out.paste(resized,(x,y))
    return out,{'stateRegistration':{'canvas':[768,1280],'centerX':384,'topY':128,'baseY':1152},
                'sourceToExport':{'scale':scale,'x':x,'y':y},'uniformScaleOnly':True,
                'registrationMethod':'matched outer top/base and midpoint; separately generated trim is not pixel-identical'}


def compose_frame(im):
    # All ornament pieces share this uniform scale. Only rail repeat counts vary.
    s = .60
    aperture = {'x':69,'y':148,'width':1380,'height':814}
    size = (1518,1068)
    out = Image.new('RGBA',size)
    rects = {
        'topLeft':[0,0,320,370], 'topRight':[1290,0,1610,370],
        'bottomLeft':[0,700,320,977], 'bottomRight':[1290,700,1610,977],
        'topRail':[320,0,450,260], 'bottomRail':[320,780,450,977],
        'leftRail':[0,450,180,530], 'rightRail':[1430,450,1610,530],
        'topConnector':[700,0,910,246], 'bottomJewel':[700,780,910,977],
    }
    def piece(name):
        a=im.crop(tuple(rects[name])); return a.resize((round(a.width*s),round(a.height*s)),RESAMPLE)
    def repeat(name, box, axis):
        p=piece(name); x,y,w,h=box
        if axis=='x':
            for dx in range(0,w,p.width): out.alpha_composite(p.crop((0,0,min(p.width,w-dx),min(p.height,h))),(x+dx,y))
        else:
            for dy in range(0,h,p.height): out.alpha_composite(p.crop((0,0,min(p.width,w),min(p.height,h-dy))),(x,y+dy))
    corner_w,top_h,bottom_h=192,222,166
    repeat('topRail',(corner_w,0,size[0]-2*corner_w,156),'x')
    repeat('bottomRail',(corner_w,950,size[0]-2*corner_w,118),'x')
    repeat('leftRail',(0,top_h,108,size[1]-top_h-bottom_h),'y')
    repeat('rightRail',(size[0]-108,top_h,108,size[1]-top_h-bottom_h),'y')
    for name,xy in [('topLeft',(0,0)),('topRight',(size[0]-corner_w,0)),('bottomLeft',(0,size[1]-bottom_h)),('bottomRight',(size[0]-corner_w,size[1]-bottom_h))]: out.alpha_composite(piece(name),xy)
    out.alpha_composite(piece('topConnector'),((size[0]-126)//2,0))
    out.alpha_composite(piece('bottomJewel'),((size[0]-126)//2,950))
    # This padding is transparent; the aperture drives placement, not the full image bounds.
    px,py=152,107
    padded_frame=Image.new('RGBA',(size[0]+2*px,size[1]+2*py));padded_frame.paste(out,(px,py))
    result=fit(padded_frame,(1600,1600)); k=result.width/padded_frame.width
    export_aperture={key:round(value*k,5) for key,value in {'x':aperture['x']+px,'y':aperture['y']+py,'width':aperture['width'],'height':aperture['height']}.items()}
    return result,{'modular':True,'sourceSliceRectanglesXYXY':rects,'ornamentUniformScale':s,
                   'assembledCanvas':list(size),'assembledAperture':aperture,'exportAperture':export_aperture,
                   'assembly':'fixed uniformly scaled corners/connectors; cropped repeats of unchanged rail strips; no nonuniform ornament scaling',
                   'needsVisualJoinReview':True}


def contact_sheet(items, name='all-assets-contact.jpg'):
    tile_w,tile_h=400,310
    canvas=Image.new('RGB',(tile_w*4,tile_h*math.ceil(len(items)/4)), '#e3e0d7')
    draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
    small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
    for i,item in enumerate(items):
        x,y=(i%4)*tile_w,(i//4)*tile_h
        draw.text((x+12,y+10),item['id'],font=font,fill='#17191b')
        im=Image.open(ROOT/item['export']['path']).convert('RGBA')
        if item['alpha']:
            for j,bg in enumerate(['#080a0d','#7a7a7a']):
                panel=Image.new('RGBA',(184,240),bg); pic=fit(im,(176,230));panel.alpha_composite(pic,((184-pic.width)//2,(240-pic.height)//2))
                canvas.paste(panel.convert('RGB'),(x+10+j*196,y+38))
        else:
            pic=fit(im,(380,240));canvas.paste(pic.convert('RGB'),(x+(400-pic.width)//2,y+38+(240-pic.height)//2))
        draw.text((x+12,y+285),f"{item['native']['width']}×{item['native']['height']} native · {item['export']['bytes']//1024} KiB WebP",font=small,fill='#353535')
    canvas.save(ROOT/'qa'/name,quality=94)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--first-eight',action='store_true'); args=parser.parse_args()
    for name in ['assets','qa','review']: (ROOT/name).mkdir(exist_ok=True)
    anchor_path=ROOT/'registration-overrides.json'
    overrides=json.loads(anchor_path.read_text()) if anchor_path.exists() else {}
    celebration_path=ROOT/'generation-celebrations.json'
    celebration_records={r['id']:r for r in json.loads(celebration_path.read_text()).get('records',[])} if celebration_path.exists() else {}
    ready=[]; entries=[]; issues=[]; frame_layout=None
    for group,ids in CATALOG.items():
        for identity in ids:
            src=ROOT/'sources'/f'{identity}.png'
            item={'id':identity,'group':group,'status':'planned','alpha':identity not in OPAQUE}
            if not src.exists() or (args.first_eight and identity not in FIRST_EIGHT): entries.append(item);continue
            im=Image.open(src); info=alpha_info(im); expected_alpha=identity not in OPAQUE
            item.update({'status':'review-candidate','source':f'sources/{identity}.png','native':{'width':im.width,'height':im.height,'mode':im.mode,'bytes':src.stat().st_size,'sha256':hash_file(src),'alpha':info}})
            if expected_alpha and info['transparentFraction']==0: issues.append({'id':identity,'severity':'error','issue':'Expected transparent foreground is opaque.'})
            if expected_alpha:
                rgba=im.convert('RGBA')
                if identity=='frame': exported,extra=compose_frame(rgba)
                elif identity.startswith('priest-'): exported,extra=priest_export(rgba,identity,overrides)
                elif identity in {'offering-empty','offering-filled'}: exported,extra=offering_export(rgba)
                elif identity.startswith('symbol-'): exported,extra=padded(rgba,(512,512))
                else:
                    maximum=1600 if identity=='altar-surround' else 1200 if identity.startswith(('rite-','intro-','win-')) else 1000
                    h=round(maximum*im.height/im.width)
                    exported,extra=padded(rgba,(maximum,max(384,min(h,1500))))
            else: exported=fit(im.convert('RGB'),(2560,2560));extra={'upscaled':False}
            dest=ROOT/'assets'/f'{identity}.webp'
            exported.save(dest,'WEBP',quality=90,method=6,exact=True)
            decoded=Image.open(dest)
            item.update(extra)
            item['intendedScreens']=SCREEN_ROLES.get(identity,
                ['reel symbols','Base/Chance selector arrangements'] if identity.startswith('symbol-') else
                ['bonus selector','bonus entry'] if identity.startswith('rite-') else
                ['feature introduction','Help'] if identity.startswith('intro-') else
                ['win celebration: '+identity.replace('win-','')] if identity.startswith('win-') else
                ['priest static pose: '+identity.replace('priest-','')])
            item['cropPolicy']={'sourceArtBoundsXYXY':info['visibleBoundsAlpha16'],'default':'contain at uniform scale; retain padded export outside optical bounds','overwriteOriginal':False}
            if identity.startswith('rite-'):
                item['cropPolicy']['selector']={'sourceRectXYXY':[0,0,im.width,im.height],'fit':'contain','focusNormalized':[.5,.5],'preferredViewportAspect':1.5}
                item['cropPolicy']['entry']={'sourceRectXYXY':[0,0,im.width,im.height],'fit':'contain','focusNormalized':[.5,.5],'preferredViewportAspect':1.667}
            if identity.startswith('intro-'): item['liveCopySafeRectNormalized']=[.12,.76,.76,.19]
            if identity in celebration_records:
                item['amountSafeRectSourceXYWH']=celebration_records[identity]['amountSafeRect']
                tr=item['sourceToExport'];x,y,w,h=item['amountSafeRectSourceXYWH']
                item['amountSafeRectExportXYWH']=[tr['x']+x*tr['scale'],tr['y']+y*tr['scale'],w*tr['scale'],h*tr['scale']]
                item['amountPlacement']='outside artwork for a large readable value; inner rail reserved for short supporting copy' if identity=='win-cap' else 'center live amount in the documented transparent opening; reduce type size for long amounts'
            if identity=='altar-surround':
                item['role']='horizontal altar progression rail'
                item['tierLabels']=ALTAR_TIERS
                item['sourceLabelAreaXYWH']=[370,316,1430,94]
                item['bloodSegmentCount']=5
                item['freeSpinRewardIncluded']=False
            if identity=='ray-texture': item['compositionNote']='Dense light center is intentional. Place behind character at restrained opacity; do not cover symbols or counters.'
            item['export']={'path':f'assets/{identity}.webp','width':decoded.width,'height':decoded.height,'bytes':dest.stat().st_size,'sha256':hash_file(dest),'alpha':alpha_info(decoded)}
            if identity=='frame':
                ap=extra['exportAperture'];frame_layout={'aperture':{'x':ap['x']/decoded.width,'y':ap['y']/decoded.height,'width':ap['width']/decoded.width,'height':ap['height']/decoded.height},'sourceWidth':decoded.width,'sourceHeight':decoded.height}
            if identity in {'environment-base','environment-bonus','environment-god','feature-result'} and im.width<1920: issues.append({'id':identity,'severity':'limitation','issue':f'Native width {im.width}px; desktop review at 1920 will enlarge it. No artificial source upscaling applied.'})
            entries.append(item);ready.append(item)
    essential_ids={'environment-base','frame','logo-ornament','priest-neutral','altar-surround','offering-mark','blood-empty','blood-filled','offering-empty','offering-filled'}|set(CATALOG['Symbols'])
    essential_bytes=sum(x['export']['bytes'] for x in ready if x['id'] in essential_ids)
    manifest={'version':'engraved-v1.review-2','status':'first-eight-review-candidate' if args.first_eight else 'complete-static-review-candidate' if len(ready)==40 else 'work-in-progress-review-candidate','generatedAt':datetime.now(timezone.utc).isoformat(),'generationTool':'built-in imagegen','plannedCoreAssets':40,'generatedAndPackaged':len(ready),'integratedIntoGame':False,'animationCreated':False,'sourcePolicy':'Original generated PNGs preserved unmodified. Derived exports use only resize, padding, registration and documented frame slicing. No recoloring, alpha keying or fringe removal.','assets':entries,'layout':{'frame':frame_layout,'altar':{'tiers':ALTAR_TIERS,'bloodSegments':5,'proposedSpinReward':False}},'totalExportBytes':sum(x['export']['bytes'] for x in ready),'essentialPlan':{'assetIds':sorted(essential_ids),'bytes':essential_bytes,'budgetBytes':10*1024*1024,'withinBudget':essential_bytes<10*1024*1024,'secondaryScreens':'lazy load mode environments, entry/results, celebration, introduction and reaction poses'},'limitations':issues}
    (ROOT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    role_map={'version':'engraved-v1','integrationStatus':'contract only; no runtime changes',
        'environmentByMode':{'standard':'environment-base','enhancedChance':'environment-base','maximumChance':'environment-base','lesser':'environment-bonus','blood':'environment-bonus','greater':'environment-bonus','god':'environment-god'},
        'illustrationByScreen':{'selector':['rite-lesser','rite-blood','rite-greater','rite-god'],'entryByMode':{'lesser':'rite-lesser','blood':'rite-blood','greater':'rite-greater','god':'rite-god'},'featureResult':'feature-result','retrigger':['symbol-scatter','logo-ornament'],'introduction':['intro-blood','intro-offerings','intro-scatters']},
        'celebrationByExistingTier':{'big':'win-big','mega':'win-mega','epic':'win-epic','divine':'win-divine','maximumReturn':'win-cap'},
        'mechanicsByState':{'earnedAltar':'altar-surround','marked':'offering-mark','blood':['blood-empty','blood-filled'],'offering':['offering-empty','offering-filled'],'intervention':['rose-halo','ray-texture']},
        'priestByReaction':{'idlePoster':'priest-neutral','invocation':'priest-invocation','bonusAwakening':'priest-bonus','benediction':'priest-benediction','expiry':'priest-expiry'},
        'unchanged':['rules','mode prices','recorded outcomes','win thresholds','audio','existing video assets'],
        'altar':{'tiers':ALTAR_TIERS,'bloodSegments':5,'extraSpinPerStep':'proposal only, not encoded or implemented'}}
    (ROOT/'screen-role-map.json').write_text(json.dumps(role_map,indent=2),encoding='utf-8')
    audit={'version':manifest['version'],'automatedChecks':['source hashes','native dimensions','alpha existence/range','export decode','recorded output sizes'],'notProvenByChecks':['perfect matte edges','priest identity matching','frame join invisibility','small-size readability','browser render quality'],'issues':issues,'totalExportBytes':manifest['totalExportBytes'],'essentialPlan':manifest['essentialPlan'],'firstEightOnly':args.first_eight,'browserVerified':False}
    (ROOT/'qa/asset-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
    review_assets=[]
    for item in ready:
        row={'id':item['id'],'src':'../'+item['export']['path'],'source':'../'+item['source'],'alpha':item['alpha'],'status':item['status'],'width':item['export']['width'],'height':item['export']['height'],'bytes':item['export']['bytes'],'opticalBounds':item['export']['alpha']['visibleBoundsAlpha16'],'notes':f"Native {item['native']['width']} × {item['native']['height']}; static review candidate."}
        if 'registration' in item:row['registration']=item['registration']
        if 'amountSafeRectExportXYWH' in item:row['amountSafeRect']=item['amountSafeRectExportXYWH']
        review_assets.append(row)
    altar=next((x for x in ready if x['id']=='altar-surround'),None)
    altar_layout={'tiers':ALTAR_TIERS,'bloodSegments':5,'proposedSpinReward':False}
    if altar:
        tr=altar['sourceToExport'];e=altar['export'];x,y,w,h=altar['sourceLabelAreaXYWH']
        altar_layout['labelArea']={'x':(tr['x']+x*tr['scale'])/e['width'],'y':(tr['y']+y*tr['scale'])/e['height'],'width':w*tr['scale']/e['width'],'height':h*tr['scale']/e['height']}
        l,t,r,b=e['alpha']['visibleBoundsAlpha16']
        altar_layout['visibleBounds']={'x':l/e['width'],'y':t/e['height'],'width':(r-l)/e['width'],'height':(b-t)/e['height']}
        altar_layout['units']='normalized'
    data={'assets':review_assets,'layout':{'frame':frame_layout,'altar':altar_layout}}
    (ROOT/'review/assets-data.js').write_text('window.ENGRAVED_REVIEW_OVERRIDES = '+json.dumps(data,indent=2)+';\n',encoding='utf-8')
    mapping={'integrationStatus':'not integrated; current game files remain unchanged','candidateVersion':manifest['version'],
      'assets':[{'id':item['id'],'productionStatus':item['status'],'futureAction':'replace presentation role' if item['id'] in EXISTING or item['id']=='logo-ornament' else 'add presentation role',
                 'existingMedia':['/style-2/media/'+name for name in EXISTING.get(item['id'],[])],
                 'note':'Replaces the CSS IX ornament; lettering stays live.' if item['id']=='logo-ornament' else 'Candidate asset only; no current file overwritten.'} for item in entries],
      'keep':[{'role':'existing animation','path':'/style-2/media/'+name,'action':'keep untouched; do not mix with engraved candidate until separately restyled'} for name in ['priest-motion.webm','priest-invocation.webm','priest-bonus.webm']],
      'keepBehavior':['gameplay rules and probabilities','prices and versioned mode configuration','recorded books and replay','settlement and recovery','existing win classification and thresholds','current live controls']}
    (ROOT/'keep-replace-add.json').write_text(json.dumps(mapping,indent=2),encoding='utf-8')
    if ready:contact_sheet(ready,'first-eight-contact.jpg' if args.first_eight else 'all-assets-contact.jpg')
    print(json.dumps({'packaged':len(ready),'planned':40,'exportMiB':round(manifest['totalExportBytes']/1024/1024,3),'issues':issues,'manifest':str(ROOT/'asset-manifest.json')}))

if __name__=='__main__': main()
