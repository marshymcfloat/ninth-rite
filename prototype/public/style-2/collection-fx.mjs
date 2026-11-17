const clamp=n=>Math.max(0,Math.min(1,n));
export const COLLECTION_FLIGHT_TIME = .68;
const collectionSpeed = 1.22;
export const COLLECTION_LANDING_TIME = COLLECTION_FLIGHT_TIME / collectionSpeed;
export const SYMBOL_POP_TIME = .17;
export const collectionHead = age => clamp(age / COLLECTION_LANDING_TIME);
export function streamPoint(from,to,t,bend=60,sway=0){
  const u=1-t,c1={x:from.x+(to.x-from.x)*.12+sway,y:from.y-bend},c2={x:to.x-(to.x-from.x)*.18-sway*.55,y:to.y+bend*.45};
  return {x:u*u*u*from.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*to.x,y:u*u*u*from.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*to.y};
}

export function createCollectionCanvas(document,layer){
  const canvas=document.createElement('canvas');canvas.className='bloodstream-canvas';canvas.setAttribute('aria-hidden','true');layer.prepend(canvas);
  // Unsupported canvas keeps the same sprite flights and authoritative meter updates.
  let ctx=null;
  try{if(document.defaultView?.CanvasRenderingContext2D)ctx=canvas.getContext('2d');}catch{}
  let width=0,height=0,scale=1;
  function resize(bounds){
    width=bounds.width;height=bounds.height;scale=Math.max(.65,Math.min(1.6,width/1400));
    if(!ctx)return;
    const ratio=Math.min(document.defaultView.devicePixelRatio||1,2);
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  function clear(){ctx?.clearRect(0,0,width,height);}
  function path(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));}
  function draw(flows,time){
    if(!ctx)return;clear();
    for(const [index,flow] of flows.entries()){
      const age=time-flow.delay,p=clamp(age/COLLECTION_FLIGHT_TIME),offering=flow.kind==='offerings';
      if(time<flow.delay)continue;
      const head=collectionHead(age),tail=clamp(head-.4),fade=1-clamp((p-.8)/.2);
      const points=Array.from({length:25},(_,i)=>streamPoint(flow.from,flow.to,tail+(head-tail)*i/24,flow.bend,flow.sway));
      if(p<1){
        ctx.globalAlpha=fade;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='source-over';
        path(points);ctx.strokeStyle=offering?'#a8874955':'#ab153855';ctx.lineWidth=(offering?13:18)*scale;ctx.shadowBlur=14*scale;ctx.shadowColor=offering?'#ffca7e':'#e32050';ctx.stroke();ctx.shadowBlur=0;
        // A tapered liquid ribbon with a moving specular spine.
        for(let i=1;i<points.length;i++){
          const n=i/(points.length-1),taper=Math.pow(Math.sin(n*Math.PI),.65),a=points[i-1],b=points[i];
          path([a,b]);ctx.strokeStyle=offering?'#9f613d':'#590d25';ctx.lineWidth=(2+8*taper)*scale;ctx.stroke();
          ctx.strokeStyle=offering?'#f4bc78':'#d42b50';ctx.lineWidth=(.5+4*taper)*scale;ctx.stroke();
          ctx.strokeStyle=offering?'#fff0c2':'#ffb5b0';ctx.lineWidth=(.3+1.1*taper)*scale;ctx.stroke();
        }
        ctx.globalCompositeOperation='lighter';
        for(let i=0;i<11;i++){
          const t=clamp(head-i*.024),point=streamPoint(flow.from,flow.to,t,flow.bend,flow.sway),angle=i*2.4+index+time*8;
          const radius=(1-i/12)*2.1*scale;ctx.globalAlpha=fade*(1-i/12)*.8;
          ctx.fillStyle=offering?'#ffe4a9':'#ff7187';ctx.beginPath();ctx.arc(point.x+Math.sin(angle)*7*scale,point.y+Math.cos(angle)*6*scale,radius,0,Math.PI*2);ctx.fill();
        }
      }
      // Arrival flash and two expanding rings remain attached to the actual vessel.
      const impact=clamp((p-.78)/.22);
      if(impact>0&&time<flow.delay+.82){
        const age=clamp((time-flow.delay-.53)/.29),r=(5+age*27)*scale;
        ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-age)*.8;
        const glow=ctx.createRadialGradient(flow.to.x,flow.to.y,0,flow.to.x,flow.to.y,r);
        glow.addColorStop(0,'#fff0d6');glow.addColorStop(.2,offering?'#e5a86a':'#ff5479');glow.addColorStop(1,'#810b3000');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(flow.to.x,flow.to.y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=offering?'#f9d6a0':'#ffa7ad';ctx.lineWidth=1.2*scale;
        ctx.beginPath();ctx.ellipse(flow.to.x,flow.to.y,r*.85,r*.45,0,0,Math.PI*2);ctx.stroke();
      }
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    }
  }
  return {resize,draw,clear,get available(){return !!ctx;}};
}

let pixiLibrary;
function loadScript(document, src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error('Optional PixiJS renderer unavailable'));
    };
    const timer = setTimeout(fail, 12000);
    script.src = src;
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = fail;
    document.head.append(script);
  });
}

export function loadPixi(document) {
  return pixiLibrary ??= (async () => {
    const win = document.defaultView;
    if (!win.PIXI) {
      await loadScript(document, '/vendor/pixi.min.js');
      await loadScript(document, '/vendor/pixi-csp.min.js');
    }
    return win.PIXI;
  })();
}

const celebrationStyles = {
  spin: {color:0xefb77a, halo:0xad4965, core:0xffe2a8, radius:31, sparks:8, rings:1, rays:3, duration:.54},
  win: {color:0xffcf79, halo:0xe77824, core:0xfff5ca, radius:112, sparks:28, rings:3, rays:8, duration:2.15},
  scatter: {color:0xcdb9ff, halo:0x743fba, core:0xf3eaff, radius:90, sparks:22, rings:2, rays:6, duration:1.98},
  offering: {color:0xffe7a4, halo:0xc88e31, core:0xfff8d5, radius:72, sparks:15, rings:2, rays:4, duration:1.95},
  blood: {color:0xff6270, halo:0xb31c38, core:0xffc5bb, radius:71, sparks:16, rings:2, rays:3, duration:1.62},
  'rite-lesser': {color:0xffc477, halo:0xc5702f, core:0xffecd1, radius:106, sparks:16, rings:2, rays:5, duration:1.75},
  'rite-blood': {color:0xff526e, halo:0xc82244, core:0xffd1bd, radius:115, sparks:21, rings:2, rays:6, duration:1.92},
  'rite-greater': {color:0xc596ff, halo:0x7a45d4, core:0xffedff, radius:126, sparks:26, rings:3, rays:8, duration:2.1},
  'win-big': {color:0xffc487, halo:0xa95d2f, core:0xffe8c1, radius:100, sparks:12, rings:1, rays:4, duration:1.48},
  'win-mega': {color:0xff5370, halo:0xc62243, core:0xffd4d4, radius:109, sparks:17, rings:2, rays:5, duration:1.8},
  'win-epic': {color:0xd0aaff, halo:0x834cc7, core:0xf4e6ff, radius:118, sparks:21, rings:2, rays:6, duration:2.04},
  'win-divine': {color:0xffd46c, halo:0xcd8a28, core:0xfff1c1, radius:126, sparks:25, rings:3, rays:7, duration:2.24},
  'win-cap': {color:0xffedd2, halo:0xb94758, core:0xfffaf0, radius:138, sparks:28, rings:4, rays:8, duration:2.64},
};

function drawSymbolHighlights(glow, ring, {symbols, clock, ritual}) {
  const progress = clamp(clock.time/(ritual ? .72 : .58));
  const fade = Math.sin(progress*Math.PI);
  const color = ritual ? 0xd4bbff : 0xf7ca8e;
  for (const {x,y,size} of symbols) {
    const radius = size*(.78+.28*progress);
    glow(x,y,radius*2.8,ritual ? 0x9673cf : 0xd74658,fade*.52,.88);
    glow(x,y,radius*1.9,color,fade*.54,.27,-.45);
    ring(x,y,radius*2,color,fade*.49,.87);
  }
}

function drawSymbolClears(glow, ring, shard, {symbols, clock}) {
  const dense = symbols.length > 13;
  for (const {x, y, size, delay, orphan, seed} of symbols) {
    const age = clock.time - delay - (orphan ? .085 : SYMBOL_POP_TIME);
    const life = orphan ? .33 : .40;
    if (age < 0 || age >= life) continue;
    const progress = age / life, fade = (1 - progress) ** 1.6;
    const spread = 1 - (1 - progress) ** 2.6;
    if (orphan) {
      glow(x, y - size*progress*.44, size*2.45, 0xa8b7c2, fade*.25, .9);
      for (let i=0; i<(dense?3:6); i++) {
        const drift = (i - 2.5) * size*.15;
        const lift = size * (progress * (.83 + (i%3)*.22) + .12);
        glow(x + drift + Math.sin(i+seed)*spread*size*.26,y-lift,size*(.14+i%3*.03),i%2?0xb0bec5:0x87939e,fade*.63);
      }
      continue;
    }
    const radius = size * (.56 + .96*spread);
    glow(x, y, radius*2.68, 0xdc3b55, fade*.68, .86);
    if (!dense) {
      glow(x, y, size*(1.3+spread*.5), 0xffcc8f, fade*.78, .52, -.2);
      ring(x,y,radius*2.08,0xda5b4e,fade*.21,.83);
    }
    ring(x,y,radius*2,0xffdfa6,fade*.76,.83);
    for (let i=0; i<(dense?4:8); i++) {
      const angle = seed*.63 + i*2.39996, cos = Math.cos(angle), sin = Math.sin(angle);
      const distance = size * (.25 + spread*(.98 + .13*(i%5)));
      const cx = x + cos*distance, cy = y + sin*distance*.87 + progress**2*size*.34;
      const sliver = size * (.10 + i%3*.042) * (1 - progress*.68);
      const twist = angle + progress * (i%2 ? 2.1 : -2.1);
      shard(cx,cy,sliver*1.64,[0xffe8b3,0xf39072,0xdd4359,0xe3dbca][i%4],fade*.89,.65,twist);
    }
  }
}

function strokePoints(ink, points, style) {
  ink.moveTo(points[0].x, points[0].y);
  for (const {x,y} of points.slice(1)) ink.lineTo(x,y);
  ink.stroke({...style, cap:'round', join:'round'});
}

function drawRelicFlights(ink, glow, {flows, clock}, scale) {
  const density = Math.max(.55, Math.min(1, (5 / flows.length)**.4));
  for (const [index, flow] of flows.entries()) {
    const age = clock.time - flow.delay;
    if (age <= 0) continue;
    const offering = flow.kind === 'offerings';
    const color = offering ? 0xf9aa56 : 0xc5203c, sheen = offering ? 0xffedb2 : 0xff8e8e;
    const head = collectionHead(age), arrival = clamp((age-COLLECTION_LANDING_TIME)/.26);
    const trail = 1 - clamp((age-COLLECTION_LANDING_TIME)/.16);
    const alpha = clamp(age/.075) * trail;
    if (alpha > 0) {
      const tail = clamp(head - trail * (offering ? .46 : .53));
      const points = Array.from({length:17},(_,i)=>streamPoint(flow.from,flow.to,tail + (head-tail)*i/16,flow.bend,flow.sway));
      const width = scale * density * (offering ? 4.6 : 14.5);
      const edges = points.map((point, i) => {
        const before = points[Math.max(0,i-1)], after = points[Math.min(16,i+1)];
        const dx = after.x - before.x, dy = after.y - before.y;
        const length = Math.hypot(dx,dy) || 1;
        const taper = Math.sin(i/16 * Math.PI)**.76;
        const wave = Math.sin(i*.96 - age*24);
        const half = width * taper * (.39 + .12*wave);
        return {x:-dy/length, y:dx/length, half, drift:offering ? 0 : half*wave*.38};
      });
      const rim = side => points.map((p,i)=>{
        const edge = edges[i], offset = edge.half*side + edge.drift;
        return [p.x + edge.x*offset, p.y + edge.y*offset];
      });
      const band = (thickness, tint, opacity) => ink.poly([...rim(thickness), ...rim(-thickness).reverse()].flat()).fill({color:tint, alpha:alpha*opacity});
      band(offering ? 2.4 : 1.85, color, offering ? .23 : .32);
      band(1, color, .88);
      const thread = points.map((p,i) => {
        const edge = edges[i];
        const offset = offering ? Math.sin(i*.62 - age*17)*edge.half*2.5 : edge.half*.42 + edge.drift;
        return {x:p.x+edge.x*offset, y:p.y+edge.y*offset};
      });
      if (offering) strokePoints(ink, thread, {width:scale*1.15, color:sheen, alpha:alpha*.90});
      else for (const start of [2,7,12]) {
        strokePoints(ink, thread.slice(start,start+4), {width:scale*1.5, color:sheen, alpha:alpha*.77});
      }
      const tip = points[16];
      glow(tip.x, tip.y, scale*(offering ? 46 : 39), color, alpha*.73);
      for (let i=0; i<5; i++) {
        const dot = points[15-i*3], turn = age*14 + i*2.16 + index;
        const drift = scale * (offering ? 5.4 : 6.1) * (1+i*.24);
        ink.circle(dot.x+Math.cos(turn)*drift, dot.y+Math.sin(turn)*drift, scale*(1.8-i*.17))
          .fill({color:i%2 ? color : sheen, alpha:alpha*(.74-i*.094)});
      }
    }
    if (age >= COLLECTION_LANDING_TIME && arrival < 1) {
      const {x,y} = flow.to, fade = (1 - arrival)**1.45;
      const radius = scale * (7 + 24 * (1 - (1 - arrival)**2));
      glow(x, y, radius*2.5, color, fade*.78);
      glow(x, y, radius*1.8, sheen, fade*.66, .64);
      ink.ellipse(x, y, radius, radius*(offering ? .82 : .56)).stroke({width:scale*1.35, color:sheen, alpha:fade*.75});
    }
  }
}

function lightTexture(document, Pixi) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#fff');
  gradient.addColorStop(.12, '#ffffffdc');
  gradient.addColorStop(.33, '#ffffff74');
  gradient.addColorStop(.67, '#ffffff19');
  gradient.addColorStop(1, '#ffffff00');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return Pixi.Texture.from(canvas);
}

function burstTextures(document, Pixi) {
  const ring=document.createElement('canvas'),shard=document.createElement('canvas');
  ring.width=ring.height=128;shard.width=32;shard.height=24;
  const rim=ring.getContext('2d');
  rim.strokeStyle='#ffffff44';rim.lineWidth=5;
  rim.beginPath();rim.arc(64,64,60,0,Math.PI*2);rim.stroke();
  rim.strokeStyle='#fff';rim.lineWidth=2;
  rim.beginPath();rim.arc(64,64,60,0,Math.PI*2);rim.stroke();
  const chip=shard.getContext('2d');
  chip.fillStyle='#fff';chip.beginPath();chip.moveTo(1,13);chip.lineTo(10,3);chip.lineTo(31,10);chip.fill();
  return {ring:Pixi.Texture.from(ring),shard:Pixi.Texture.from(shard)};
}

export function createCelebrationLights({document, gsap, enabled}) {
  const win = document.defaultView;
  let loading, renderer, cue, meterCue, canvasHost, startFrame, ticking = false, destroyed = false, unavailable = false;
  const cascadeCues = new Map();
  const activeHost = () => cue?.host ?? meterCue?.host ?? cascadeCues.values().next().value?.host;

  function fitCanvas(host = canvasHost) {
    if(!renderer||!host)return;
    const width=host.clientWidth,height=host.clientHeight;
    if(!width||!height||(renderer.width===width&&renderer.height===height))return;
    const resolution=Math.min(1,Math.sqrt(440000/(width*height)));
    renderer.app.renderer.resize(width,height,resolution);
    renderer.width=width;renderer.height=height;
  }
  const onResize = () => fitCanvas();
  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(onResize) : null;
  if(!resizeObserver)win.addEventListener('resize',onResize);

  function syncCanvas() {
    if (!renderer) return;
    const {canvas} = renderer.app;
    const host = activeHost();
    if(host!==canvasHost){
      canvas.removeAttribute('data-light-active');
      resizeObserver?.disconnect();
      canvasHost=host;
      if(host){fitCanvas(host);resizeObserver?.observe(host);}
    }
    if (!host) {
      if(startFrame!==undefined){win.cancelAnimationFrame(startFrame);startFrame=undefined;}
      gsap.ticker.remove(update);
      ticking = false;
      canvas.removeAttribute('data-light-active');
      delete canvas.dataset.celebration;
      for(const attr of ['data-meter-light','data-symbol-clear','data-relic-flight'])canvas.removeAttribute(attr);
      return;
    }
    if (cue) canvas.dataset.celebration = cue.kind;
    else delete canvas.dataset.celebration;
    canvas.toggleAttribute('data-meter-light', meterCue?.host === host);
    canvas.toggleAttribute('data-symbol-clear', cascadeCues.get('symbols')?.host === host);
    canvas.toggleAttribute('data-relic-flight', cascadeCues.get('collection')?.host === host);
    if (canvas.parentElement !== host) host.prepend(canvas);
    if (!ticking) {
      ticking = true;
      startFrame=win.requestAnimationFrame(()=>{
        startFrame=undefined;
        gsap.ticker.add(update);
      });
    }
  }

  function clear(host) {
    if (host && cue?.host !== host) return;
    cue = null;
    if (!host) {
      meterCue = null;
      cascadeCues.clear();
    }
    syncCanvas();
  }

  function prepare() {
    if (loading || destroyed || unavailable || !enabled() || !win.WebGL2RenderingContext || !gsap?.ticker) return loading;
    loading = (async () => {
      const Pixi = await loadPixi(document);
      if (destroyed) return;
      const app = new Pixi.Application();
      await app.init({preference:'webgl', backgroundAlpha:0, width:1, height:1, autoStart:false,
        sharedTicker:false, antialias:false, resolution:1});
      if (destroyed) {
        app.destroy(true, {children:true});
        return;
      }
      const texture = lightTexture(document, Pixi);
      const burst=burstTextures(document,Pixi);
      const primary = new Pixi.Container(), meters = new Pixi.Container(), cascade = new Pixi.Container();
      app.stage.addChild(cascade, primary, meters);
      const sprite = (container = primary, image = texture) => {
        const light = new Pixi.Sprite(image);
        light.anchor.set(.5);
        light.blendMode = 'add';
        light.alpha = 0;
        container.addChild(light);
        return light;
      };
      const make = (count, container, image) => Array.from({length:count}, () => sprite(container,image));
      const [halo, corona, core] = make(3);
      const rays = make(8), sparks = make(28), sources = make(6);
      const meterSprites = make(32, meters);
      const cascadeSprites = make(86, cascade), cascadeRings=make(40,cascade,burst.ring);
      const cascadeShards=make(120,cascade,burst.shard),cascadeInk = new Pixi.Graphics();
      cascadeInk.blendMode = 'add';
      cascade.addChild(cascadeInk);
      const rings = new Pixi.Graphics();
      rings.blendMode = 'add';
      primary.addChild(rings);
      app.canvas.className = 'celebration-light-canvas';
      app.canvas.setAttribute('aria-hidden', 'true');
      app.canvas.addEventListener('webglcontextlost', () => {
        unavailable = true;
        clear();
      }, {once:true});
      renderer = {app, texture, burst, primary, meters, meterSprites, cascade, cascadeSprites, cascadeRings, cascadeShards,cascadeInk,
        halo, corona, core, rays, sparks, sources, rings, width:1, height:1, lastFrame:-Infinity};
      // Prime the sprite and path pipelines before the first player-triggered effect.
      fitCanvas(document.querySelector('.scene'));
      core.alpha=.45;
      cascadeRings[0].alpha=cascadeShards[0].alpha=.25;
      cascadeInk.circle(1,1,1).fill(0xffffff);
      app.render();
      core.alpha=0;
      cascadeRings[0].alpha=cascadeShards[0].alpha=0;
      cascadeInk.clear();
      if (activeHost() && enabled()) syncCanvas();
    })().catch(() => {
      unavailable = true;
      clear();
    });
    return loading;
  }

  function shine(sprite, x, y, size, tint, opacity, aspect=1, rotation=0) {
    sprite.position.set(x, y);
    sprite.width = size;
    sprite.height = size * aspect;
    sprite.tint = tint;
    sprite.alpha = clamp(opacity);
    sprite.rotation = rotation;
  }

  function drawCelebration() {
    const {style, origin, points, scale, large, elapsed:t} = cue;
    const {halo, corona, core, rays, sparks, sources, rings} = renderer;
    const {x, y} = origin();
    const p = t / style.duration;
    const fade = clamp(t / .24) * (1 - clamp((p - .47) / .53)) ** 1.55;
    const swell = .84 + .16 * Math.sin(t * 7.2);
    const r = style.radius * scale * (large ? 1.65 : 1);
    shine(halo, x, y, r * (2.75 + p), style.halo, fade * .49);
    shine(corona, x, y, r * 1.52 * swell, style.color, fade * .47, .83);
    shine(core, x, y, r * (.42 + .16 * swell), style.core, fade * (large ? .58 : .84));

    rays.forEach((ray, index) => {
      const angle = index * Math.PI * 2 / style.rays + t * .18;
      shine(ray, x + Math.cos(angle) * r * .30, y + Math.sin(angle) * r * .30,
        r * (1.3 + (index % 3) * .38), style.color, index < style.rays ? fade * .32 : 0,
        .055 + (index % 3) * .016, angle);
    });

    rings.clear();
    rings.position.set(x, y);
    rings.rotation = -.19 + t * .19;
    for (let i=0;i<style.rings;i++) {
      const q = clamp((p - i * .12) / .8);
      const radius = r * (.20 + q * (.88 + i * .16));
      const alpha = fade * (1 - q) * clamp((p - i * .12) * 10);
      rings.ellipse(0, 0, radius, radius * (.56 + i * .12)).stroke({width:7*scale, color:style.color, alpha:alpha*.14});
      rings.ellipse(0, 0, radius, radius * (.56 + i * .12)).stroke({width:1.35*scale, color:style.core, alpha:alpha*.79});
    }

    sparks.forEach((spark, index) => {
      const phase = clamp((t - (index % 9) * .066) / (style.duration * .78));
      const angle = index * 2.39996 + phase * (cue.kind === 'offering' ? 1.12 : .52);
      const distance = r * (.10 + (1 - (1 - phase) ** 1.6) * (.38 + (index % 7) * .13));
      const brightness = index < style.sparks ? Math.sin(Math.PI * phase) * (1 - p * .62) : 0;
      shine(spark, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .72 - r * phase * phase * .32,
        scale * (5 + index % 5 * 2), index % 3 ? style.core : style.color, brightness, .42, angle);
    });

    const origins = points?.() ?? [];
    sources.forEach((light, index) => {
      const source = origins[index];
      if (!source) {
        light.alpha = 0;
        return;
      }
      const beat = clamp((t - index * .075) / .54);
      shine(light, source.x, source.y, scale * (48 + beat * 42), style.color, (1 - beat) * clamp(t * 8) * .78);
    });
  }

  function drawCascade(highlights, symbols, collection) {
    const {cascade, cascadeInk, cascadeSprites, cascadeRings, cascadeShards, width} = renderer;
    cascade.visible = Boolean(highlights || symbols || collection);
    if (!cascade.visible) return;
    cascadeInk.clear();
    function pool(sprites){
      let used=0;
      return {emit(...values){if(used<sprites.length)shine(sprites[used++],...values);},hide(){
        for(let i=used;i<sprites.length;i++)if(sprites[i].alpha)sprites[i].alpha=0;
      }};
    }
    const glow=pool(cascadeSprites),ring=pool(cascadeRings),shard=pool(cascadeShards);
    if (collection) drawRelicFlights(cascadeInk, glow.emit, collection, Math.max(.65, Math.min(1.5, width/1440)));
    if (symbols) drawSymbolClears(glow.emit,ring.emit,shard.emit,symbols);
    if (highlights) drawSymbolHighlights(glow.emit,ring.emit,highlights);
    glow.hide();ring.hide();shard.hide();
  }

  function update(time, delta=16.7) {
    if (!enabled()) return clear();
    if (cue) {
      cue.elapsed += Math.min(delta, 66) * cue.rate / 1000;
      if (cue.elapsed >= cue.style.duration) clear(cue.host);
    }
    const host = activeHost();
    if (!host?.isConnected) return clear();
    const highlights = cascadeCues.get('highlight'), symbols = cascadeCues.get('symbols'), collection = cascadeCues.get('collection');
    const visibleSymbols = symbols?.host === host ? symbols.data : null;
    const visibleCollection = collection?.host === host ? collection.data : null;
    if (time - renderer.lastFrame < 1/32) return;
    renderer.lastFrame = time;
    const {app, primary, meters, meterSprites} = renderer;
    drawCascade(highlights?.host===host ? highlights.data : null, visibleSymbols, visibleCollection);
    primary.visible = Boolean(cue);
    if (cue) drawCelebration();
    const accents = meterCue?.host === host ? meterCue.sample() : [];
    meters.visible = accents.length > 0;
    if (meters.visible) meterSprites.forEach((sprite, index) => {
      const light = accents[index];
      if (light) shine(sprite, light.x, light.y, light.size, light.color, light.alpha, light.aspect, light.rotation);
      else sprite.alpha = 0;
    });
    app.render();
    if(!app.canvas.hasAttribute('data-light-active'))app.canvas.setAttribute('data-light-active','');
  }

  return {
    prepare, clear,
    play(kind, {host, origin, points, rate=1, large=false}) {
      if (!celebrationStyles[kind] || !enabled() || unavailable || !gsap?.ticker) return false;
      cue = {kind, host, origin, points, rate, large, style:celebrationStyles[kind], elapsed:0,
        scale:Math.max(.58, Math.min(1.5, host.clientWidth / (large ? 680 : 1400)))};
      if (renderer) syncCanvas();
      else prepare();
      return Boolean(renderer);
    },
    meterLights(host, sample) {
      if (sample && (!enabled() || unavailable || !win.WebGL2RenderingContext || !gsap?.ticker)) return;
      meterCue = sample ? {host, sample} : null;
      if (renderer) syncCanvas();
      else if (meterCue) prepare();
    },
    cascadeEffect(host, kind, data) {
      if (!renderer || destroyed || unavailable || !enabled()) return null;
      const effect = {host, data};
      cascadeCues.set(kind, effect);
      syncCanvas();
      return {
        get active() { return cascadeCues.get(kind) === effect; },
        clear() {
          if (cascadeCues.get(kind) !== effect) return;
          cascadeCues.delete(kind);
          syncCanvas();
        },
      };
    },
    destroy() {
      destroyed = true;
      clear();
      resizeObserver?.disconnect();
      if(!resizeObserver)win.removeEventListener('resize',onResize);
      renderer?.texture.destroy(true);
      renderer?.burst.ring.destroy(true);renderer?.burst.shard.destroy(true);
      renderer?.app.destroy(true, {children:true});
      renderer = null;
    },
  };
}
