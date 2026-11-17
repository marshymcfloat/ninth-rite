import { BOARD, bloodGeometry, cellCenter, planTumble, symbolArt } from './view-math.mjs';
import { BloodStreams, makeDissolveFilter } from './blood-fx.mjs';

const COLORS = { blood: 0xe52f52, offering: 0xe9b752, ivory: 0xffe4b1, stone: 0x241621 };
const RITUAL = { width: 240, height: 320, x: 120, y: 120, radius: 112, priestBottom: 264 };
const CHANNELS = {
  blood: { radius: 104, width: 12, angles: [-Math.PI * .75, -Math.PI * .5, -Math.PI * .25], half: .37, base: 0x400713, body: 0xa9233c, light: 0xf49c97, aura: 0xba213e },
  offering: { radius: 80, width: 10, angles: [-.60, 0, .60], half: .23, base: 0x5b3616, body: 0xc99a47, light: 0xffedb3, aura: 0xe3ac4e },
};
const arcStroke = (graphics, radius, start, end, width, color, alpha = 1, cx = 120, cy = 120) => {
  if (end <= start) return;
  graphics.moveTo(cx + Math.cos(start) * radius, cy + Math.sin(start) * radius).arc(cx, cy, radius, start, end).stroke({ width, color, alpha, cap: 'round' });
};

export async function createGameView({ stage, board, ritual, surface, images, art, atlas, seal, onCharge, options }) {
  if (!globalThis.PIXI || !globalThis.gsap || !atlas?.order?.every(symbol => images[symbolArt(art, symbol)?.kind])) {
    surface.dataset.renderer = 'dom-fallback';
    return null;
  }
  let view;
  try {
    view = new GameView({ stage, board, ritual, surface, images, art, atlas, seal, onCharge, options });
    await view.init();
    return view;
  } catch (error) {
    view?.destroy();
    surface.dataset.renderer = 'dom-fallback';
    console.warn('Basic display retained because accelerated graphics could not start.', error.message);
    return null;
  }
}

class GameView {
  constructor(config) {
    Object.assign(this, config);
    this.P = globalThis.PIXI;
    this.gsap = globalThis.gsap;
    this.active = new Set();
    this.cells = new Map();
    this.textures = new Map();
    this.particles = [];
    this.previousBoard = null;
    this.pendingClear = null;
    this.altarState = { tier: 1, blood: 0, offerings: 0, sealed: false };
    this.feature = false;
    this.rules = { bloodThreshold: 5, offeringThreshold: 3 };
    this.dirty = true;
    this.available = false;
    this.disposed = false;
    this.drawTick = this.drawTick.bind(this);
    this.resized = this.resized.bind(this);
    this.visibilityChanged = this.visibilityChanged.bind(this);
    this.hoverPosition = -1;
    this.pointerMoved = event => {
      const bounds=this.board.getBoundingClientRect();
      const col=Math.floor((event.clientX-bounds.left)/bounds.width*6),row=Math.floor((event.clientY-bounds.top)/bounds.height*5);
      this.hoverPosition=col>=0&&col<6&&row>=0&&row<5?row*6+col:-1;this.dirty=true;
    };
    this.pointerLeft = () => {this.hoverPosition=-1;this.dirty=true;};
  }

  async init() {
    const { Application, Container, Graphics, Texture, Rectangle, Sprite } = this.P;
    this.app = new Application();
    await this.app.init({ width: 1, height: 1, preference: 'webgl', autoStart: false, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2), powerPreference: 'low-power' });
    this.app.stage.eventMode = 'none';
    this.app.canvas.setAttribute('aria-hidden', 'true');
    this.surface.append(this.app.canvas);
    this.root = new Container();
    this.grid = new Container();
    this.symbols = new Container();
    this.boardMask = new Graphics().rect(0, 0, BOARD.width, BOARD.height).fill(0xffffff);
    this.root.addChild(this.grid, this.symbols, this.boardMask);
    this.symbols.mask = this.boardMask;
    this.app.stage.addChild(this.root);
    this.atlas.order.forEach(symbol => {
      const entry = symbolArt(this.art, symbol), source = Texture.from(this.images[entry.kind]).source;
      const { x, y, width, height } = entry.frame;
      this.textures.set(symbol, new Texture({ source, frame: new Rectangle(x, y, width, height) }));
    });
    this.grid.addChild(new Graphics().rect(0, 0, BOARD.width, BOARD.height).fill({ color: 0x241621, alpha: 1 }));
    for (let col = 0; col < BOARD.columns; col++) {
      this.grid.addChild(new Graphics().rect(col*105,0,100,BOARD.height).fill({color:col%2?0x322033:0x2d1b2b,alpha:.8}));
    }
    for (let col = 1; col < BOARD.columns; col++) {
      this.grid.addChild(new Graphics().moveTo(col * 105 - 2.5, 0).lineTo(col * 105 - 2.5, BOARD.height).stroke({ width: 1, color: 0x7f7252, alpha: .32 }));
    }
    for (let row = 1; row < BOARD.rows; row++) {
      this.grid.addChild(new Graphics().moveTo(0, row * 102 - 2.5).lineTo(BOARD.width, row * 102 - 2.5).stroke({ width: .7, color: 0x7f7252, alpha: .1 }));
    }
    this.makeRitual();
    this.effects = new Container();
    this.app.stage.addChildAt(this.effects, 1);
    this.streams = new BloodStreams(this.P, this.effects);
    const dot = new Graphics().circle(4, 4, 3.5).fill(0xffffff);
    this.dotTexture = this.app.renderer.generateTexture(dot);
    dot.destroy();
    this.ambient = new Container();
    this.app.stage.addChildAt(this.ambient,0);
    this.embers=Array.from({length:24},(_,i)=>{
      const sprite=new Sprite(this.dotTexture);
      sprite.anchor.set(.5);sprite.tint=i%3?0xffc47f:0xf15464;sprite.blendMode='screen';sprite.scale.set(.12+(i%4)*.055);
      this.ambient.addChild(sprite);return sprite;
    });
    for (let i = 0; i < 84; i++) {
      const sprite = new Sprite(this.dotTexture);
      sprite.anchor.set(.5); sprite.visible = false;
      this.effects.addChild(sprite);
      this.particles.push({ sprite, used: false });
    }
    this.available = true;
    this.surface.dataset.renderer = 'pixi-webgl';
    this.surface.dataset.version = this.P.VERSION;
    this.surface.getRenderState = () => ({
      renderer: this.surface.dataset.renderer,
      phase: this.surface.dataset.phase || 'idle',
      priest: this.feature ? 'kneeling' : 'standing',
      motion: this.motion(),
      activeTimelines: this.active.size,
      entityAlpha: this.entity.alpha,
      particleCount: this.particles.filter(item => item.used).length,
      streamCount: this.streams.count,
      streams: this.streams.items.filter(item=>item.used).map(item=>({position:item.seed,offering:item.offering,from:{...item.from},to:{...item.to}})),
      seal: { behindPriest: this.ritualRoot.getChildIndex(this.sealLayer) < this.ritualRoot.getChildIndex(this.priestLayer), radius: RITUAL.radius, x: this.ritualRoot.x+RITUAL.x*this.ritualRoot.scale.x, y: this.ritualRoot.y+RITUAL.y*this.ritualRoot.scale.y, blood: this.sealEnergy.blood, offering: this.sealEnergy.offering, bloodDrops: [...this.chargeNodes.blood], offeringSigils: [...this.chargeNodes.offering], tracks: { blood: [...this.trackFills.blood], offering: [...this.trackFills.offering], bloodWidth: CHANNELS.blood.width, offeringWidth: CHANNELS.offering.width, aura: this.meterAura.alpha, reflections: [this.bloodSheen.rotation, this.offeringSheen.rotation] } },
      cells: [...this.cells].map(([position, cell]) => ({ position, symbol: cell.value.symbol, sheet: symbolArt(this.art, cell.value.symbol).kind, marked: cell.value.marked, x: cell.node.x, y: cell.node.y, alpha: cell.node.alpha, scale:cell.node.scale.x, dissolve: cell.filter?.resources.bloodUniforms.uniforms.uProgress ?? 0 })),
    });
    document.body.classList.add('pixi-active');
    this.resizeObserver = new ResizeObserver(this.resized);
    this.resizeObserver.observe(this.stage);
    this.resizeObserver.observe(this.board);
    this.resizeObserver.observe(this.ritual);
    window.addEventListener('resize', this.resized);
    this.board.addEventListener('pointermove',this.pointerMoved);
    this.board.addEventListener('pointerleave',this.pointerLeft);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.app.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.finishActive();
      this.available = false;
      this.gsap.ticker.remove(this.drawTick);
      document.body.classList.remove('pixi-active');
      this.surface.dataset.renderer = 'dom-fallback';
      this.surface.hidden = true;
      const note = document.getElementById('displayNote');
      if (note) note.textContent = 'GDD v1.4 · Basic display · Reload for animations';
    });
    this.resized();
    this.gsap.ticker.add(this.drawTick);
  }

  makeRitual() {
    const { Container, Graphics, Texture, Rectangle, Sprite } = this.P;
    this.ritualRoot = new Container();
    this.app.stage.addChild(this.ritualRoot);
    this.sealLayer = new Container();
    this.ritualRoot.addChild(this.sealLayer);
    this.sealEnergy = { blood: 0, offering: 0 };
    this.sealLayer.addChild(new Graphics().circle(120,120,112).fill(0x030303));
    if (this.images.seal) {
      const source = Texture.from(this.images.seal).source;
      const frame = this.seal?.frame;
      const texture = frame ? new Texture({ source, frame: new Rectangle(frame.x,frame.y,frame.width,frame.height) }) : Texture.from(this.images.seal);
      const sprite = new Sprite(texture);
      sprite.anchor.set(.5); sprite.position.set(120,120); sprite.width=this.seal?.size ?? 232; sprite.height=this.seal?.size ?? 232;
      const mask = new Graphics().circle(120,120,112).fill(0xffffff);
      this.sealLayer.addChild(sprite,mask); sprite.mask=mask;
    }
    this.ambientRim = new Graphics();
    for (let i=0;i<4;i++) this.ambientRim.circle(120,120,112+i*1.2).stroke({ width:1.3, color:COLORS.ivory, alpha:.055-i*.01 });
    this.voidCircle = new Graphics().circle(120,120,this.seal?.voidRadius ?? 73).fill(0x190b1a);
    this.bloodGlow = new Graphics(); this.offeringGlow = new Graphics();
    for(let i=0;i<4;i++) {
      this.bloodGlow.circle(120,120,105+i).stroke({width:7-i,color:COLORS.blood,alpha:.11-i*.02});
      this.offeringGlow.circle(120,120,86+i).stroke({width:6-i,color:COLORS.offering,alpha:.08-i*.016});
    }
    this.meterAura = new Graphics();
    this.meterRings = new Graphics();
    this.bloodFillMask = new Graphics(); this.offeringFillMask = new Graphics();
    this.bloodSheen = new Container(); this.offeringSheen = new Container();
    for (const [kind, container, mask] of [['blood', this.bloodSheen, this.bloodFillMask], ['offering', this.offeringSheen, this.offeringFillMask]]) {
      container.position.set(120, 120);
      const highlights = new Graphics(), channel = CHANNELS[kind];
      for (let i = 0; i < 3; i++) {
        const start = i * Math.PI * 2 / 3;
        arcStroke(highlights, channel.radius - 2, start, start + .17, 1.6, channel.light, .7, 0, 0);
        arcStroke(highlights, channel.radius + 1.3, start + .02, start + .08, 1, channel.light, .45, 0, 0);
      }
      container.addChild(highlights); container.mask = mask;
    }
    this.shock = new Graphics().circle(0,0,102).stroke({width:1.2,color:COLORS.blood,alpha:.65});
    this.shock.position.set(120,120); this.shock.alpha=0;
    this.sealLayer.addChild(this.ambientRim,this.voidCircle,this.bloodGlow,this.offeringGlow,this.meterAura,this.meterRings,this.bloodFillMask,this.offeringFillMask,this.bloodSheen,this.offeringSheen,this.shock);
    this.entity = new Sprite(Texture.from(this.images.scatter));
    this.entity.anchor.set(.5); this.entity.position.set(120,119); this.entity.width=136; this.entity.height=136; this.entity.alpha=0;
    this.sealLayer.addChild(this.entity);
    this.priestLayer = new Container();
    this.priestLayer.position.set(120,RITUAL.priestBottom);
    this.ritualRoot.addChild(this.priestLayer);
    if (this.images.priest) {
      const source = Texture.from(this.images.priest).source;
      for (let i = 0; i < 2; i++) {
        const texture = new Texture({ source, frame: new Rectangle(i * source.width / 2, 0, source.width / 2, source.height) });
        const sprite = new Sprite(texture);
        sprite.anchor.set(.5,1); sprite.height=180; sprite.width=180*(source.width/2)/source.height;
        sprite.alpha = i === 0 ? 1 : 0;
        this.priestLayer.addChild(sprite);
      }
    }
    this.drawRings();
  }

  drawRings() {
    const ring = this.meterRings;
    ring.clear(); this.meterAura.clear(); this.bloodFillMask.clear(); this.offeringFillMask.clear();
    const state=this.previewMeters ?? this.altarState;
    this.chargeNodes = {blood:[],offering:[]};
    this.trackFills = { blood: [], offering: [] };
    for (const kind of ['blood', 'offering']) {
      const channel = kind === 'blood' ? { ...CHANNELS.blood, ...bloodGeometry(this.rules.bloodThreshold) } : CHANNELS.offering;
      const enabled = !this.altarState.sealed && (kind === 'blood' || this.feature);
      const value = enabled ? Math.min(channel.angles.length, kind === 'blood' ? state.blood : state.offerings) : 0;
      const mask = kind === 'blood' ? this.bloodFillMask : this.offeringFillMask;
      for (let i = 0; i < channel.angles.length; i++) {
        const start = channel.angles[i] - channel.half, end = channel.angles[i] + channel.half;
        const fraction = Math.max(0, Math.min(1, value - i));
        this.trackFills[kind].push(fraction);
        arcStroke(ring, channel.radius, start, end, channel.width + 5, 0x080a0b);
        arcStroke(ring, channel.radius, start, end, channel.width + 3, enabled ? 0x8b795a : 0x55544d, enabled ? .95 : .55);
        arcStroke(ring, channel.radius, start, end, channel.width, 0x080a0b);
        arcStroke(ring, channel.radius, start, end, channel.width - 3, kind === 'blood' ? 0x271019 : 0x231e16, enabled ? .9 : .45);
        if (fraction <= .001) continue;
        const tip = start + (end - start) * fraction;
        for (const [extra, alpha] of [[16, .045], [10, .09], [5, .14]]) arcStroke(this.meterAura, channel.radius, start, tip, channel.width + extra, channel.aura, alpha);
        arcStroke(mask, channel.radius, start, tip, channel.width - 1, 0xffffff);
        arcStroke(ring, channel.radius, start, tip, channel.width - .7, channel.base);
        arcStroke(ring, channel.radius - .6, start, tip, channel.width - 4, channel.body);
        arcStroke(ring, channel.radius - 2.8, start + .012, tip, 1.2, channel.light, .68);
        arcStroke(ring, channel.radius + 2.2, start, tip, 1.5, channel.base, .85);
        const tx = 120 + Math.cos(tip) * channel.radius, ty = 120 + Math.sin(tip) * channel.radius;
        ring.circle(tx, ty, channel.width * .26).fill({ color: channel.body, alpha: .9 });
        ring.circle(tx - 1.3, ty - 1.3, 1).fill({ color: channel.light, alpha: .75 });
      }
    }
    for (let i=0;i<this.rules.bloodThreshold;i++) {
      const angle=bloodGeometry(this.rules.bloodThreshold).angles[i];
      const x=120+Math.cos(angle)*105, y=120+Math.sin(angle)*105;
      const fraction=this.altarState.sealed?0:Math.max(0,Math.min(1,state.blood-i));
      const lit=fraction>.99;
      this.chargeNodes.blood.push(lit);
      if(lit) {
        this.meterAura.circle(x,y+3,22).fill({color:0xb51e38,alpha:.08});
        this.meterAura.circle(x,y+3,17).fill({color:0xe23849,alpha:.12});
      }
      ring.circle(x,y+2,15).fill({color:0x08080a,alpha:.98}).stroke({width:1.6,color:lit?0xc99782:0x9b8870,alpha:.95});
      ring.moveTo(x,y-14).bezierCurveTo(x-3,y-7,x-10,y,x-10,y+6).bezierCurveTo(x-10,y+20,x+10,y+20,x+10,y+6).bezierCurveTo(x+10,y,x+3,y-7,x,y-14).fill({color:lit?0x6f0c23:0x211a21,alpha:1}).stroke({width:1.6,color:lit?0xe88a89:0xb4a191});
      if(lit) {
        ring.ellipse(x-2,y+6,6,8).fill({color:0xb82c42,alpha:.9});
        ring.ellipse(x-4,y+3,1.5,4).fill({color:0xffc4b4,alpha:.8});
        ring.circle(x+3,y+11,1).fill({color:0xee9c96,alpha:.45});
      }
    }
    for (let i=0;i<this.rules.offeringThreshold;i++) {
      const ox=[186,200,186][i], oy=[75,120,165][i];
      const offeringLit=this.feature&&!this.altarState.sealed&&state.offerings>=i+1;
      this.chargeNodes.offering.push(offeringLit);
      if(offeringLit) this.meterAura.circle(ox,oy,18).fill({color:0xe2ac50,alpha:.12});
      ring.circle(ox,oy,12).fill({color:0x09090b,alpha:.98}).stroke({width:1,color:0x8d7957,alpha:this.feature?.9:.45});
      ring.poly([ox,oy-10,ox+8,oy,ox,oy+10,ox-8,oy]).fill({color:offeringLit?0xb1823c:0x24211e,alpha:1}).stroke({width:1.6,color:offeringLit?0xffe5a9:0xb3a389,alpha:this.feature?1:.55});
      if(offeringLit) {
        ring.poly([ox,oy-7,ox+5,oy,ox,oy+3,ox-5,oy]).fill({color:0xe9cc8d,alpha:.95});
        ring.circle(ox-1.5,oy-2,1.5).fill(0xfff2d6);
      }
    }
    this.bloodGlow.alpha=this.altarState.sealed?0:Math.min(.8,(state.blood>0?.15:0)+this.sealEnergy.blood*.6);
    this.offeringGlow.alpha=this.altarState.sealed||!this.feature?0:Math.min(.8,(state.offerings>0?.2:0)+this.sealEnergy.offering*.6);
    this.bloodSheen.visible=this.trackFills.blood.some(value=>value>0);
    this.offeringSheen.visible=this.trackFills.offering.some(value=>value>0);
    this.dirty = true;
  }

  resized() {
    if (!this.available || this.disposed) return;
    const bounds = this.surface.getBoundingClientRect();
    const board = this.board.getBoundingClientRect();
    const ritual = this.ritual.getBoundingClientRect();
    if (this.width === bounds.width && this.height === bounds.height && this.boardWidth === board.width && this.boardLeft === board.left - bounds.left && this.boardTop === board.top - bounds.top && this.ritualLeft === ritual.left - bounds.left && this.ritualTop === ritual.top - bounds.top && this.ritualWidth === ritual.width) return;
    this.finishActive();
    this.width = bounds.width; this.height = bounds.height; this.boardWidth = board.width; this.boardLeft = board.left - bounds.left; this.boardTop = board.top - bounds.top; this.ritualLeft = ritual.left - bounds.left; this.ritualTop = ritual.top - bounds.top; this.ritualWidth = ritual.width;
    this.app.renderer.resize(Math.max(1, bounds.width), Math.max(1, bounds.height));
    this.root.position.set(board.left - bounds.left, board.top - bounds.top);
    this.root.scale.set(board.width / BOARD.width, board.height / BOARD.height);
    this.ritualRoot.visible = ritual.width > 0 && ritual.height > 0;
    const ritualScale=Math.min((ritual.width||RITUAL.width)/RITUAL.width,(ritual.height||RITUAL.height)/RITUAL.height);
    this.ritualRoot.position.set(ritual.left-bounds.left+(ritual.width-RITUAL.width*ritualScale)/2,ritual.top-bounds.top+(ritual.height-RITUAL.height*ritualScale)/2);
    this.ritualRoot.scale.set(ritualScale);
    this.dirty = true;
    this.app.render();
  }

  drawTick(time) {
    if (!this.available || document.hidden || this.disposed) return;
    const motion = !this.options().reduced && !this.options().skip;
    this.ambient.visible=motion;
    if(motion)for(const [i,sprite] of this.embers.entries()){
      const phase=(time*(.012+(i%5)*.002)+i*.137)%1;
      const side=i%2?.92:.075;
      sprite.position.set(this.width*(side+Math.sin(time*.17+i)*.018),this.height*(.9-phase*.55));
      sprite.alpha=Math.sin(phase*Math.PI)*(.18+(i%4)*.08);
    }
    if (motion && this.ritualRoot.visible) {
      this.priestLayer.y=RITUAL.priestBottom+Math.sin(time*.9)*1.1;
      this.priestLayer.skew.x=Math.sin(time*.7)*.004;
      this.priestLayer.rotation=0;
      this.ambientRim.alpha=.52+Math.sin(time*.55)*.05;
      this.bloodSheen.rotation=time*.17; this.offeringSheen.rotation=-time*.12;
      this.meterAura.alpha=.72+Math.sin(time*.65)*.06;
    } else {
      this.priestLayer.y=RITUAL.priestBottom; this.priestLayer.rotation=0; this.priestLayer.skew.x=0; this.ambientRim.alpha=.52;
      this.bloodSheen.rotation=-.12; this.offeringSheen.rotation=.06; this.meterAura.alpha=.72;
    }
    for(const [position,cell] of this.cells) {
      cell.hover.alpha=position===this.hoverPosition&&!this.active.size?.5:0;
      if(cell.markGlow)cell.markGlow.alpha=motion?.45+Math.sin(time*1.5+position)*.2:.5;
    }
    if (this.dirty || this.active.size || (motion && this.ritualRoot.visible)) {
      this.app.render();
      this.dirty = false;
    }
  }

  motion() { const settings = this.options(); return this.available && !settings.reduced && !settings.skip && !document.hidden; }

  run(phase, build) {
    if (!this.available || this.disposed) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeline = this.gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.active.delete(timeline);
        this.surface.dataset.phase = this.active.size ? phase : 'idle';
        timeline.kill(); this.dirty = true;
        resolve();
      };
      try { build(timeline); } catch (error) { timeline.kill(); reject(error); return; }
      timeline.eventCallback('onComplete', finish);
      this.active.add(timeline);
      this.surface.dataset.phase = phase;
      this.dirty = true;
      if (!this.motion() || timeline.duration() === 0) { timeline.progress(1, false); finish(); }
      else timeline.timeScale(this.options().fast ? 4 : 1).play();
    });
  }

  wait(milliseconds) { return this.run('hold', timeline => timeline.to({ value: 0 }, { value: 1, duration: milliseconds / 1000 })); }

  finishActive() {
    for (const timeline of [...this.active]) timeline.progress(1, false);
    this.dirty = true;
  }

  settingsChanged() {
    if (!this.motion()) this.finishActive();
    else for (const timeline of this.active) timeline.timeScale(this.options().fast ? 4 : 1);
    this.dirty = true;
  }

  visibilityChanged() { document.body.classList.toggle('page-hidden',document.hidden); if (document.hidden) this.finishActive(); else this.dirty = true; }

  makeCell(value, position) {
    const { Container, Graphics, Sprite } = this.P;
    const node = new Container();
    const halo = new Graphics().roundRect(-49,-47.5,98,95,6).fill({color:0xa51a40,alpha:.28}).stroke({width:1.5,color:0xffc373,alpha:.92});
    halo.roundRect(-46,-44.5,92,89,4).stroke({width:3,color:0xe94262,alpha:.25});
    halo.alpha = 0;
    const sprite = new Sprite(this.textures.get(value.symbol));
    const size = 100;
    sprite.anchor.set(.5); sprite.width = size; sprite.height = size;
    sprite.blendMode = symbolArt(this.art,value.symbol).sheet.matte==='black' ? 'screen' : 'normal';
    if (value.symbol === 'S') { sprite.width = 100; sprite.height = 94; sprite.y=-3; }
    const hover=new Graphics().roundRect(-48,-47,96,94,5).fill({color:0xd3a965,alpha:.18});hover.alpha=0;
    node.addChild(hover,halo, sprite);
    if (value.symbol === 'S') {
      const caption = new this.P.Text({ text: 'SCATTER', style: { fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 'bold', fill: 0xf1dfbc, letterSpacing: .7, stroke: { color: 0x150809, width: 3 } } });
      caption.anchor.set(.5); caption.position.set(0, 39); node.addChild(caption);
    }
    let markGlow=null;
    if (value.marked) {
      markGlow=new Graphics().circle(40,-37,9).fill({color:0xf9bd65,alpha:.35}).circle(40,-37,5).fill({color:0xffdaa7,alpha:.5});node.addChild(markGlow);
      node.addChild(new Graphics().poly([40, -43, 45, -37, 40, -31, 35, -37]).fill(0xf58b7b).stroke({ width: 1, color: 0xffd2b0 }));
    }
    const center = cellCenter(position);
    node.position.set(center.x, center.y);
    this.symbols.addChild(node);
    return { node, sprite, halo, hover, markGlow, value, position };
  }

  async reveal(board, { initial = true, animate = false } = {}) {
    if (!this.available) return;
    this.finishActive();
    const old = this.cells;
    const next = new Map();
    let moves;
    if (!initial && this.previousBoard && this.pendingClear) {
      try { moves = planTumble(this.previousBoard, board, this.pendingClear); }
      catch (error) { console.warn('Rendering the recorded board directly:', error.message); }
    }
    moves ??= Array.from({ length: 30 }, (_, to) => ({ from: null, to, entering: true, distance: 5 }));
    const preserved = new Set(moves.filter(move => move.from !== null).map(move => move.from));
    for (const [position, cell] of old) if (!preserved.has(position)) { cell.filter?.destroy(); cell.node.destroy({children:true}); }
    for (const move of moves) {
      const value = board[Math.floor(move.to / 6)][move.to % 6];
      const cell = move.from === null ? this.makeCell(value, move.to) : old.get(move.from);
      cell.position = move.to;
      cell.node.alpha = 1; cell.node.scale.set(1); cell.halo.alpha = 0;
      if (move.entering && animate && this.motion()) cell.node.y = cellCenter(move.to).y - (initial ? BOARD.height + 110 : move.distance * 102);
      next.set(move.to, cell);
    }
    this.cells = next;
    this.previousBoard = board.map(row => row.map(value => ({ ...value })));
    this.pendingClear = null;
    this.surface.dataset.symbols = '30';
    if (!animate) {
      for (const [p, cell] of next) { const target = cellCenter(p); cell.node.position.set(target.x, target.y); }
      this.dirty = true; this.app.render(); return;
    }
    await this.run(initial ? 'drop' : 'tumble', timeline => {
      for (const move of moves) {
        const cell = next.get(move.to), target = cellCenter(move.to);
        const distance=Math.abs(target.y-cell.node.y);
        if(distance<.01) continue;
        const at=initial?(move.to%6)*.026+Math.floor(move.to/6)*.009:(move.to%6)*.014;
        const duration=initial?.40:Math.max(.20,Math.min(.32,.12+Math.sqrt(distance)*.012));
        timeline.to(cell.node,{x:target.x,y:target.y,duration,ease:'power2.in'},at);
        timeline.fromTo(cell.sprite,{alpha:.72},{alpha:1,duration:.08,ease:'none'},at+duration-.04);
      }
    });
  }

  purchaseExit() {
    return this.run('purchase-exit',timeline=>{
      for(const [position,cell] of this.cells) {
        timeline.to(cell.node,{y:cell.node.y+BOARD.height+110,alpha:0,duration:.28,ease:'power2.in'},(position%6)*.018);
      }
    });
  }

  scatterSignal({singleEntity=false}={}) {
    const scatters=[...this.cells.values()].filter(cell=>cell.value.symbol==='S');
    if(scatters.length<(singleEntity?1:3))return Promise.resolve();
    return this.run('scatter-award',timeline=>{
      if(singleEntity){
        for(const cell of this.cells.values())if(cell.value.symbol!=='S')timeline.to(cell.node,{alpha:.28,duration:.4},0);
        const hero=scatters[0];
        this.symbols.setChildIndex(hero.node,this.symbols.children.length-1);
        timeline.to(hero.node,{x:BOARD.width/2,y:BOARD.height/2,duration:.5,ease:'power2.inOut'},0);
        timeline.to(hero.node.scale,{x:1.65,y:1.65,duration:.5,ease:'power2.inOut'},0);
      }
      for(const [index,cell] of scatters.entries()) {
        timeline.to(cell.halo,{alpha:1,duration:.3},index*.1);
        timeline.to(cell.sprite,{y:-7,duration:.42,ease:'sine.inOut'},index*.1);
        timeline.to(cell.sprite,{y:-3,duration:.45},.65);
        timeline.to(cell.halo,{alpha:0,duration:.4},.8);
      }
      timeline.to(this.sealEnergy,{blood:.9,offering:.65,duration:.4,onUpdate:()=>this.drawRings()},.3);
      timeline.to(this.sealEnergy,{blood:.08,offering:.04,duration:.4,onUpdate:()=>this.drawRings()},.8);
    });
  }

  highlight(event) {
    this.pendingClear = [...event.clearPositions];
    return this.run('highlight', timeline => {
      for (const cluster of event.clusters) for (const p of cluster.positions) {
        const cell = this.cells.get(p);
        timeline.to(cell.halo,{alpha:1,duration:.22,ease:'sine.inOut'},0);
      }
      for (const p of event.orphanPositions) timeline.to(this.cells.get(p).node, { alpha: .30, duration: .24 }, 0);
    });
  }

  particle() {
    const particle = this.particles.find(item => !item.used);
    if (particle) { particle.used = true; particle.sprite.visible = true; particle.sprite.alpha = 1; particle.sprite.scale.set(1); }
    return particle;
  }

  release(particle) { particle.used = false; particle.sprite.visible = false; }

  collect(event) {
    if(!this.available) return Promise.resolve();
    const paid=event.clusters.flatMap(cluster=>cluster.positions);
    if(!this.motion()) { paid.forEach(p=>{this.cells.get(p).node.alpha=0;}); this.dirty=true; return Promise.resolve(); }
    const point=position=>{const c=cellCenter(position);return{x:this.root.x+c.x*this.root.scale.x,y:this.root.y+c.y*this.root.scale.y};};
    const sink=(offering,position)=>{
      const cluster=event.clusters.findIndex(group=>group.positions.includes(position));
      const charge=offering ? Math.min(this.rules.offeringThreshold-1,event.before.offerings+paid.filter(p=>p<position&&this.cells.get(p).value.marked).length) : Math.min(this.rules.bloodThreshold-1,event.before.blood+Math.max(0,cluster));
      const angle=(offering?CHANNELS.offering:bloodGeometry(this.rules.bloodThreshold)).angles[charge], radius=offering?80:104;
      return {x:this.ritualRoot.x+(120+Math.cos(angle)*radius)*this.ritualRoot.scale.x,y:this.ritualRoot.y+(120+Math.sin(angle)*radius)*this.ritualRoot.scale.y};
    };
    this.previewMeters={...event.before};
    const blood=Math.min(this.rules.bloodThreshold,event.before.blood+event.bloodCollected);
    const offerings=Math.min(this.rules.offeringThreshold,event.before.offerings+event.offeringsCollected);
    return this.run('collect',timeline=>{
      paid.forEach((position,index)=>{
        const cell=this.cells.get(position), at=index*.012;
        cell.filter??=makeDissolveFilter(this.P,position*1.37,symbolArt(this.art,cell.value.symbol).sheet.matte==='black');
        cell.sprite.filters=[cell.filter];
        const uniforms=cell.filter.resources.bloodUniforms.uniforms;
        uniforms.uProgress=0;
        timeline.to(uniforms,{uProgress:1,duration:.58,ease:'sine.inOut'},at);
        timeline.to(cell.halo,{alpha:0,duration:.3},at+.22);
        timeline.set(cell.node,{alpha:0},at+.60);
        for(const offering of cell.value.marked&&event.offeringsCollected?[false,true]:[false]) {
          const from=point(position);
          if(offering) {from.x+=3;from.y-=4;}
          const stream=this.streams.acquire(from,sink(offering,position),offering,position);
          if(!stream) continue;
          timeline.to(stream,{progress:1.32,duration:.76,ease:'none',onUpdate:()=>this.streams.update(stream)},at+.20+(offering?.06:0));
          timeline.call(()=>this.streams.release(stream),[],at+.97+(offering?.06:0));
        }
      });
      const arrival=.69+paid.length*.012;
      timeline.to(this.previewMeters,{blood,offerings,duration:.35,ease:'sine.inOut',onUpdate:()=>this.drawRings()},arrival);
      timeline.call(()=>this.onCharge?.(event),[],arrival+.35);
      const fullBlood=event.normalTier>event.before.tier, fullOffering=Boolean(event.promotedTier);
      timeline.to(this.sealEnergy,{blood:event.bloodCollected?(fullBlood?1:.45):0,offering:event.offeringsCollected||fullOffering?(fullOffering?1:.5):0,duration:.3,onUpdate:()=>this.drawRings()},arrival);
      timeline.to(this.sealEnergy,{blood:.08,offering:.04,duration:.45,onUpdate:()=>this.drawRings()},arrival+.32);
    }).finally(()=>{this.streams.clear();});
  }

  clear(event) {
    return this.run('clear', timeline => {
      for (const position of event.clearPositions) {
        const cell = this.cells.get(position);
        const orphan = event.orphanPositions.includes(position);
        timeline.to(cell.node, { alpha: 0, duration: orphan ? .20 : .28 }, 0);
      }
    });
  }

  setRules(rules) {
    this.rules = rules;
    if (this.available) this.drawRings();
  }

  pendingOffer() {
    return this.run('intervention-pending', timeline => {
      timeline.fromTo(document.getElementById('interventionStatus'), { opacity: .4, y: 3 }, { opacity: 1, y: 0, duration: .3, clearProps: 'transform,opacity' }, 0);
      timeline.to(this.sealEnergy, { offering: .35, duration: .25, onUpdate: () => this.drawRings() }, 0);
      timeline.to(this.sealEnergy, { offering: .04, duration: .35, onUpdate: () => this.drawRings() }, .25);
    });
  }

  interventionResult(confirmed) {
    return this.run(confirmed ? 'intervention-confirmed' : 'intervention-expired', timeline => {
      timeline.fromTo(document.getElementById('interventionStatus'), { opacity: .3, y: 5 }, { opacity: 1, y: 0, duration: .35, clearProps: 'transform,opacity' }, 0);
      timeline.to(this.sealEnergy, { offering: confirmed ? 1 : 0, duration: .25, onUpdate: () => this.drawRings() }, 0);
      timeline.to(this.sealEnergy, { offering: .04, duration: .45, onUpdate: () => this.drawRings() }, .3);
    });
  }

  setState(state, feature) {
    if (!this.available) return;
    const changed = feature !== this.feature;
    this.feature = feature; this.altarState = { ...state };
    document.body.classList.toggle('in-bonus',feature);
    this.previewMeters=null;
    this.drawRings();
    this.surface.dataset.priest = feature ? 'kneeling' : 'standing';
    this.surface.dataset.altar = String(state.tier);
    if (changed && this.priestLayer.children.length === 2) {
      this.run('pose', timeline => {
        timeline.to(this.priestLayer.children[0], { alpha: feature ? 0 : 1, duration: .32 }, 0);
        timeline.to(this.priestLayer.children[1], { alpha: feature ? 1 : 0, duration: .32 }, 0);
      });
    }
  }

  invocation({pending=false}={}) {
    if (!this.motion()) return this.wait(90);
    const point={x:this.ritualRoot.x+120*this.ritualRoot.scale.x,y:this.ritualRoot.y+120*this.ritualRoot.scale.y};
    return this.run('invocation', timeline => {
      timeline.fromTo(document.querySelector('#invocation strong'),{opacity:0,y:18,scale:.94},{opacity:1,y:0,scale:1,duration:.55,clearProps:'transform,opacity'},.15);
      timeline.to(this.priestLayer.scale,{x:.98,y:.98,duration:.45,ease:'sine.inOut'},0);
      timeline.to(this.priestLayer.scale,{x:1,y:1,duration:.6,ease:'sine.inOut'},.8);
      timeline.to(this.entity,{alpha:pending?.65:.85,duration:.45},0);
      timeline.to(this.entity,{alpha:0,duration:.65},.95);
      this.shock.scale.set(1.02); this.shock.alpha=.6;
      timeline.to(this.shock.scale,{x:.82,y:.82,duration:.8,ease:'sine.inOut'},0);
      timeline.to(this.shock,{alpha:0,duration:.8},0);
      timeline.to(this.sealEnergy,{blood:1,offering:1,duration:.24,onUpdate:()=>this.drawRings()},0);
      timeline.to(this.sealEnergy,{blood:.08,offering:.04,duration:.6,onUpdate:()=>this.drawRings()},.24);
      for (let i=0;i<12;i++) {
        const item = this.particle();
        if (!item) break;
        const angle=i/12*Math.PI*2, scale=this.ritualRoot.scale.x;
        item.sprite.position.set(point.x+Math.cos(angle)*109*scale,point.y+Math.sin(angle)*109*scale);
        item.sprite.tint=i%3?COLORS.blood:COLORS.offering;
        item.sprite.scale.set(.45,.8); item.sprite.rotation=angle;
        timeline.to(item.sprite,{x:point.x+Math.cos(angle+.22)*73*scale,y:point.y+Math.sin(angle+.22)*73*scale,alpha:0,duration:.8,ease:'sine.in'},0);
        timeline.call(()=>this.release(item),[],.8);
      }
    });
  }

  tierUp() {
    return this.run('tier-up',timeline=>{
      timeline.to(this.sealEnergy,{blood:1,duration:.18,onUpdate:()=>this.drawRings()},0);
      timeline.fromTo(document.getElementById('altar'),{color:'#fff4ca',textShadow:'0 0 24px #f8b253'},{color:'#ffdda1',textShadow:'0 0 0px #f8b200',duration:.75},0);
      timeline.to(this.sealEnergy,{blood:.08,duration:.55,onUpdate:()=>this.drawRings()},.2);
    });
  }

  destroy() {
    if (this.disposed) return;
    this.finishActive(); this.disposed = true;
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.resized);
    this.board.removeEventListener('pointermove',this.pointerMoved);
    this.board.removeEventListener('pointerleave',this.pointerLeft);
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.gsap?.ticker.remove(this.drawTick);
    this.streams?.destroy();
    for(const cell of this.cells.values()) cell.filter?.destroy();
    document.body.classList.remove('pixi-active');
    try { this.app?.destroy(true, { children: true, texture: false, textureSource: false }); } catch { /* Partial initialization has no live application to destroy. */ }
    this.dotTexture?.destroy(true);
  }
}
