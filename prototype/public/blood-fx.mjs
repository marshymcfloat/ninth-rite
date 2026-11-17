const VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vLocal;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main() {
  vec2 p = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  p.x = p.x * (2.0 / uOutputTexture.x) - 1.0;
  p.y = p.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(p, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
  vLocal = aPosition;
}`;

const FRAGMENT = `
in vec2 vTextureCoord;
in vec2 vLocal;
uniform sampler2D uTexture;
uniform float uProgress;
uniform float uSeed;
uniform float uBlackMatte;
out vec4 finalColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)) + uSeed) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec4 tex = texture(uTexture, vTextureCoord);
  float matte = mix(1.0, smoothstep(0.015, 0.085, max(tex.r, max(tex.g, tex.b))), uBlackMatte);
  tex *= matte;
  float n = noise(vLocal*9.0)*0.58 + noise(vLocal*23.0)*0.27 + vLocal.y*0.15;
  float edge = uProgress*1.28;
  float keep = smoothstep(edge-0.06, edge+0.08, n);
  float wet = smoothstep(0.0, 0.30, uProgress);
  float ripple = noise(vec2(vLocal.x*35.0, vLocal.y*12.0-uProgress*3.0));
  vec3 blood = mix(vec3(0.12,0.003,0.021), vec3(0.62,0.025,0.09), ripple);
  blood += vec3(0.62,0.32,0.27) * pow(max(0.0, ripple-0.62)*2.63, 5.0);
  vec3 color = mix(tex.rgb, blood*tex.a, wet*0.93);
  finalColor = vec4(color*keep, tex.a*keep);
}`;

export function makeDissolveFilter(P, seed, blackMatte = false) {
  return new P.Filter({
    glProgram: P.GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: 'rite-blood-dissolve' }),
    resources: { bloodUniforms: { uProgress: { value: 0, type: 'f32' }, uSeed: { value: seed, type: 'f32' }, uBlackMatte: { value: blackMatte ? 1 : 0, type: 'f32' } } },
    padding: 0,
    resolution: 1,
  });
}

const clamp = value => Math.max(0, Math.min(1, value));
function bezier(a, b, c, d, t) {
  const u = 1-t;
  return { x: u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x, y: u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y };
}

function liquidTexture(P, offering) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 64);
  const stops = offering
    ? [[0,'#6a310000'],[.16,'#66321a'],[.43,'#c18c32'],[.48,'#fff0b2'],[.52,'#e3b756'],[.72,'#6d351a'],[1,'#6a310000']]
    : [[0,'#38001900'],[.12,'#51091e'],[.38,'#a10d34'],[.46,'#d53152'],[.49,'#ffc7b4'],[.53,'#a7193c'],[.8,'#57051f'],[1,'#38001900']];
  for (const [at,color] of stops) gradient.addColorStop(at,color);
  context.fillStyle = gradient; context.fillRect(0,0,128,64);
  context.globalAlpha = .18;
  for (let i=0; i<18; i++) {
    context.fillStyle = i%3 ? '#180008' : '#c18c8f';
    context.fillRect(i*7, 17+(i*13)%22, 5, 2);
  }
  return P.Texture.from(canvas);
}

// Reusable geometry for liquid ribbons. These display recorded wins; they carry no meter value.
export class BloodStreams {
  constructor(P, container, capacity = 60) {
    this.P = P; this.container = container;
    this.textures = [liquidTexture(P, false), liquidTexture(P, true)];
    this.items = Array.from({ length: capacity }, () => {
      const positions = new Float32Array(26*2*2), uvs = new Float32Array(26*2*2), indices = [];
      for (let i=0; i<26; i++) {
        uvs.set([i/25,0,i/25,1],i*4);
        if(i<25) { const n=i*2; indices.push(n,n+1,n+2,n+1,n+3,n+2); }
      }
      const geometry = new P.MeshGeometry({ positions, uvs, indices: new Uint16Array(indices) });
      const mesh = new P.Mesh({ geometry, texture: this.textures[0] });
      mesh.visible=false; container.addChild(mesh);
      return { mesh, positions, used:false, progress:0 };
    });
  }

  acquire(from, to, offering = false, seed = 0) {
    const item = this.items.find(item=>!item.used);
    if(!item) return null;
    Object.assign(item,{ used:true, progress:0, from, to, offering, seed });
    item.mesh.texture=this.textures[offering?1:0]; item.mesh.visible=true;
    const reach = Math.min(110,Math.abs(from.x-to.x)*.26);
    item.controlA={ x:from.x-16, y:from.y+34+(seed%4)*5 };
    item.controlB={ x:to.x+reach, y:to.y+18 };
    this.update(item);
    return item;
  }

  update(item) {
    const head=clamp(item.progress), tail=clamp(item.progress-.32);
    const span=head-tail;
    const width=item.offering?2.4:4.2+(item.seed%3)*.7;
    for(let i=0;i<26;i++) {
      const s=i/25, t=tail+span*s;
      const point=bezier(item.from,item.controlA,item.controlB,item.to,t);
      const ahead=bezier(item.from,item.controlA,item.controlB,item.to,Math.min(1,t+.002));
      const behind=bezier(item.from,item.controlA,item.controlB,item.to,Math.max(0,t-.002));
      const dx=ahead.x-behind.x, dy=ahead.y-behind.y, length=Math.hypot(dx,dy)||1;
      const taper=Math.pow(Math.sin(s*Math.PI),.7);
      const radius=width*taper*(.82+Math.sin(t*28+item.seed)*.13)*Math.min(1,span*8);
      item.positions.set([point.x-dy/length*radius,point.y+dx/length*radius,point.x+dy/length*radius,point.y-dx/length*radius],i*4);
    }
    item.mesh.geometry.getBuffer('aPosition').update();
  }

  release(item) { item.used=false; item.mesh.visible=false; }
  get count() { return this.items.filter(item=>item.used).length; }
  clear() { this.items.forEach(item=>this.release(item)); }
  destroy() { this.clear(); for(const item of this.items) { const geometry=item.mesh.geometry; item.mesh.destroy(); geometry.destroy(); } for(const texture of this.textures) texture.destroy(true); }
}
