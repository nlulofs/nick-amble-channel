/* Canonical creature geometry. Each body has its own rig. */
(() => {
  'use strict';
  const coats = {
    gold: {name:'Marigold', base:'#f2b72d', mark:'#8b4229', muzzle:'#ffde8c', accent:'#f35d75'},
    zebra: {name:'Zebra ink', base:'#fff5dd', mark:'#262334', muzzle:'#655568', accent:'#f746a0'},
    pool: {name:'Pool party', base:'#28c9c2', mark:'#155574', muzzle:'#e0f79a', accent:'#fc4d99'},
    coral: {name:'Hot coral', base:'#fa7044', mark:'#782851', muzzle:'#ffdb84', accent:'#7af1d2'},
    violet: {name:'Ultraviolet', base:'#9a70f4', mark:'#46316d', muzzle:'#f4c2ed', accent:'#cbf253'},
    midnight: {name:'After hours', base:'#353b59', mark:'#8cf2c7', muzzle:'#b7a9e0', accent:'#ffd052'},
    apricot: {name:'Apricot', base:'#edac5b', mark:'#c78043', muzzle:'#ffd58d', accent:'#f5829a'},
    lilac: {name:'Lilac', base:'#af94d0', mark:'#8768a6', muzzle:'#d7bde9', accent:'#bdea94'},
    pond: {name:'Pond', base:'#87b4a0', mark:'#557f74', muzzle:'#b8d9b7', accent:'#ffba77'}
  };
  const species = {
    lofl:{name:'Lofl',caption:'A little round someone. A family of its own.',focus:2.55,span:6.9},
    amble:{name:'Amble',caption:'A familiar odd little presence.',focus:2.95,span:8.4},
    rabbit:{name:'Rabbit',caption:'Long ears, tiny paws, room for a collar.',focus:3.4,span:9.5},
    cat:{name:'Cat',caption:'Pointy ears and a tail with opinions.',focus:2.9,span:8.5},
    dog:{name:'Dog',caption:'Floppy ears. Ready to come along.',focus:2.8,span:8.6},
    gecko:{name:'Gecko',caption:'Low to the ground, loud in the room.',focus:2.9,span:8.6},
    manta:{name:'Manta',caption:'A little floating wing thing.',focus:3.25,span:9.8},
    crab:{name:'Crab',caption:'Two claws. One excellent necklace.',focus:3.1,span:9.2}
  };
  // Keep the canonical renderer's PRNG order. A seed retains its ear, tail,
  // eye size, squash and intentional asymmetry across this new pair of views.
  function ambleTraits(seed) {
    let a=Number(seed)>>>0;
    function r(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;}
    const lerp=(x,y,n)=>x+(y-x)*n, pick=items=>items[Math.floor(r()*items.length)%items.length];
    const t={hue:Math.floor(r()*360),sat:Math.floor(lerp(38,62,r())),lit:Math.floor(lerp(58,72,r())),
      ear:pick(['nub','leaf','tall','antenna']),tail:pick(['curl','tuft','stub','whip']),
      marking:pick(['none','patch','speckles','sock']),eye:lerp(.85,1.2,r()),accent:Math.floor(r()*360),
      squish:lerp(.9,1.08,r()),wrongEar:r()<.5?-1:1,wrongTilt:Math.round(lerp(9,17,r())),
      cut1:r()<.5?1:7,cut2:r()<.5?3:5,jag:[]};
    for(let i=0;i<9;i++)t.jag.push(lerp(-.05,.05,r()));
    return t;
  }
  // The same resting mouth is used by static previews and speaking presenters.
  // Keep the head/lift coordinates here so animation cannot drift off the rig.
  function geckoMouth(coat, lift, api, {open=0}={}) {
    const amount=Math.max(0,Math.min(1,Number(open)||0));
    const head=2.72+Math.max(0,Math.min(1,Number(lift)||0))*.24;
    api.box(0,head-.27-amount*.04,2.22,.9-amount*.1,.065+amount*.34,.025,coat.mark);
  }
  function build(shape, coatName, pattern, pose, lift, api) {
    const supplied=typeof coatName==='object'&&coatName!==null?coatName:coats[coatName];
    const c={...coats.gold,...supplied}, {box,face}=api, dark='#242436';
    if(shape==='lofl'&&window.CreatureLofl)return window.CreatureLofl.volume(c,pattern,pose,lift,api);
    lift=Math.max(0,Math.min(1,Number(lift)||0));
    const sleep=pose==='sleepy';
    function clip(poly,axis,edge,greater) {
      const out=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],ina=greater?a[axis]>=edge:a[axis]<=edge,inb=greater?b[axis]>=edge:b[axis]<=edge;
        if(ina)out.push(a);
        if(ina!==inb){const t=(edge-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
      }
      return out;
    }
    function panel(o,u,v,w,h,n) {
      const point=([x,y])=>o.map((a,i)=>a+u[i]*x+v[i]*y);
      if(pattern==='stripes'){
        const step=.53,slant=.37;
        for(let at=-h*slant-step;at<w+step;at+=step){
          let poly=[[at,0],[at+.23,0],[at+.23+h*slant,h],[at+h*slant,h]];
          for(const [axis,edge,greater] of [[0,0,true],[0,w,false],[1,0,true],[1,h,false]])poly=clip(poly,axis,edge,greater);
          if(poly.length>=3)face(poly.map(point),c.mark,n);
        }
      } else if(pattern==='spots') {
        const nx=Math.max(1,Math.floor(w/.65)),ny=Math.max(1,Math.floor(h/.7));
        for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
          const x=(i+.28+(j%2)*.2)*w/nx,y=(j+.28)*h/ny,sw=w/nx*.43,sh=h/ny*.46;
          face([[x,y],[x+sw,y],[x+sw,y+sh*.7],[x+sw*.65,y+sh],[x,y+sh]].map(point),c.mark,n);
        }
      }
    }
    function body(x,y,z,w,h,d) {
      box(x,y,z,w,h,d,c.base);
      panel([x-w/2,y-h/2,z+d/2+.008],[1,0,0],[0,1,0],w,h,[0,0,1]);
      panel([x+w/2,y-h/2,z-d/2-.008],[-1,0,0],[0,1,0],w,h,[0,0,-1]);
      panel([x+w/2+.008,y-h/2,z+d/2],[0,0,-1],[0,1,0],d,h,[1,0,0]);
      panel([x-w/2-.008,y-h/2,z-d/2],[0,0,1],[0,1,0],d,h,[-1,0,0]);
    }
    function eye(x,y,z,size=.35) {
      box(x,y,z,size,sleep?.075:size,.09,dark);
      if(!sleep)box(x-.055,y+.07,z+.058,size*.27,size*.28,.025,'#ffffff');
    }
    function prism(points,z,depth,color) {
      const cx=points.reduce((sum,p)=>sum+p[0],0)/points.length,cy=points.reduce((sum,p)=>sum+p[1],0)/points.length;
      const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0),sign=area<0?-1:1;
      for(let i=0;i<points.length;i++){
        const p=points[i],q=points[(i+1)%points.length],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy)||1;
        face([[cx,cy,z+depth/2],[p[0],p[1],z+depth/2],[q[0],q[1],z+depth/2]],color,[0,0,1]);
        face([[cx,cy,z-depth/2],[q[0],q[1],z-depth/2],[p[0],p[1],z-depth/2]],color,[0,0,-1]);
        face([[p[0],p[1],z+depth/2],[p[0],p[1],z-depth/2],[q[0],q[1],z-depth/2],[q[0],q[1],z+depth/2]],color,[sign*dy/length,-sign*dx/length,0]);
      }
    }
    function paws(w,z=0) {
      for(const s of [-1,1]){box(s*w,.31,z+.49,.75,.4,1.14,c.base);box(s*w,.34,z+1.07,.69,.29,.045,c.muzzle);}
    }
    function rabbit() {
      const bob=lift*.1,head=3.55+bob;
      box(0,1.78,-.08,2.22,2.32,1.66,c.base);body(0,1.92,.03,1.86,2.1,1.88);
      box(0,1.86,1.03,1.2,1.29,.06,c.muzzle);paws(.78);
      for(const s of [-1,1]){
        box(s*1.14,1.65,.45,.4,1.08,.57,c.base);
        const earX=s*.66+(s===1?lift*.13:0),earH=s===1?2.24:2.53;
        box(earX,head+1.22,0,.56,earH,.57,c.base);
        box(earX,head+1.37,.3,.24,earH-.57,.04,c.accent);
        box(earX,head+earH/2+1.16,0,.35,.22,.54,c.base);
      }
      body(0,head,.17,2.29,1.75,1.85);
      box(0,head-.29,1.19,1.41,.64,.48,c.muzzle);
      for(const s of [-1,1]){box(s*.63,head+.15,1.119,.51,.53,.02,c.base);eye(s*.63,head+.15,1.16,.35);}
      box(0,head-.13,1.449,.23,.19,.05,c.accent);
      box(0,head-.33,1.455,.055,.17,.035,dark);
      box(0,head-.43,1.46,.39,.055,.035,dark);
      box(-.39,1.01,-1.07,.77,.77,.76,c.muzzle);
      return {x:0,y:2.18,z:1.39,scale:.67,rx:1.05,rz:.88,collarY:2.95+bob,centerZ:.2,headX:0,headY:head+.875,headZ:.17};
    }
    function cat() {
      const head=3.46+lift*.1;
      body(0,1.58,-.1,2.05,2.35,1.54);box(0,1.68,.69,1.07,1.31,.07,c.muzzle);paws(.7);
      // The hooked tail grows directly from the back of the haunch.
      for(const [x,y,z,w,h,d] of [[-1.1,1.1,-.42,.94,.41,.42],[-1.64,1.56,-.44,.39,1.24,.42],[-1.77,2.51,-.43,.38,1.05,.43],[-1.47,3.09,-.4,.79,.35,.43]])box(x,y,z,w,h,d,c.base);
      box(-1.09,3.05,-.4,.37,.44,.45,c.mark);
      for(const s of [-1,1]){
        prism([[s*.44,head+.51],[s*1.16,head+1.66],[s*1.26,head+.46]],.12,.64,c.base);
        prism([[s*.69,head+.64],[s*1.12,head+1.35],[s*1.16,head+.61]],.457,.025,c.accent);
        box(s*1.02,1.47,.24,.37,1.22,.53,c.base);
      }
      body(0,head,.18,2.51,1.57,1.81);
      for(const s of [-1,1]){
        box(s*.63,head+.12,1.105,.52,.54,.02,c.base);eye(s*.63,head+.12,1.15,.36);
        box(s*.24,head-.35,1.153,.48,.34,.14,c.muzzle);
        for(const dy of [-.17,.04])box(s*1.13,head-.29+dy,1.115,.57,.047,.025,dark);
      }
      box(0,head-.24,1.245,.24,.15,.04,c.accent);box(0,head-.42,1.248,.045,.14,.025,dark);
      return {x:0,y:2.06,z:1.36,scale:.66,rx:1.04,rz:.8,collarY:2.81+lift*.1,centerZ:.17,headX:0,headY:head+.785,headZ:.18};
    }
    function dog() {
      const head=3.41+lift*.1;
      body(0,1.57,-.32,2.18,2.34,1.86);box(0,1.65,.63,1.21,1.25,.045,c.muzzle);paws(.75);
      for(const s of [-1,1]){
        box(s*1.06,1.46,.34,.45,1.35,.64,c.base);
        // Floppy ears frame the face instead of standing above it.
        box(s*1.39,head-.09,.08,.7,1.8,.83,c.base);
        box(s*1.39,head-.98,.12,.56,.33,.73,c.base);
        box(s*1.48,head-.14,.512,.25,1.22,.04,c.accent);
        box(s*1.48,head-.58,.54,.13,.24,.028,c.mark);
      }
      body(0,head,.2,2.42,1.86,1.79);
      box(0,head-.39,1.32,1.46,.78,.76,c.muzzle);
      for(const s of [-1,1]){box(s*.61,head+.18,1.11,.52,.54,.02,c.base);eye(s*.61,head+.18,1.16,.36);}
      box(0,head-.2,1.716,.46,.29,.07,dark);box(0,head-.49,1.727,.055,.29,.04,dark);
      box(0,head-.62,1.732,.39,.05,.04,dark);
      if(pose==='curious')box(.16,head-.76,1.737,.24,.24,.08,c.accent);
      box(.78,1.6,-1.45,.39,.45,.98,c.base);box(1.04,2.07+lift*.2,-1.76,.39,1.2,.38,c.base);box(1.04,2.73+lift*.2,-1.76,.41,.28,.4,c.mark);
      return {x:0,y:2.06,z:1.45,scale:.7,rx:1.12,rz:.99,collarY:2.79+lift*.1,centerZ:.1,headX:0,headY:head+.93,headZ:.2};
    }
    function amble() {
      const t=ambleTraits(api.seed??1),cy=2.48,ry=1.92*t.squish,rx=1.48;
      const points=[];
      // One continuous rounded-angular volume, with seeded shoulder/hip cuts.
      for(let i=0;i<16;i++){
        const j=i/2,a=j/8*Math.PI*2-Math.PI/2,k=Math.floor(j),next=(k+1)%8;
        let wob=1+(t.jag[k]+t.jag[next])*.5;
        if(k===t.cut1||k===t.cut2)wob-=.1;
        points.push([Math.cos(a)*rx*wob,cy-Math.sin(a)*ry*wob]);
      }
      // A rooted tail and tiny feet preserve the existing creature's scale.
      box(-1.47,1.38,-.12,.87,.25,.32,c.mark);
      if(t.tail==='curl'){box(-1.93,1.65,-.1,.25,.7,.31,c.mark);box(-1.73,2.03,-.09,.53,.23,.3,c.mark);}
      if(t.tail==='tuft')box(-1.97,1.4,-.13,.49,.46,.44,c.accent);
      if(t.tail==='whip')box(-2.04,1.67,-.13,.26,.7,.29,c.mark);
      for(const s of [-1,1]){
        box(s*.62,.55,.29,.72,.35,.81,c.base);
        const wrong=s===t.wrongEar,ex=s*.78+(wrong?s*.23:0),ey=4.09+(wrong?-.12:.1);
        if(t.ear==='nub')box(ex,ey+.21,0,.56,.67,.65,c.base);
        else if(t.ear==='antenna'){
          box(ex,ey+.4,-.08,.14,.94,.18,c.mark);box(ex+(wrong?s*.17:0),ey+.91,-.08,.33,.32,.35,c.accent);
        }else{
          const h=t.ear==='tall'?1.27:.93,tilt=wrong?s*.39:s*.07;
          prism([[ex-.28,ey-.17],[ex+tilt-.13,ey+h],[ex+tilt+.23,ey+h*.84],[ex+.29,ey-.12]],0,.61,c.base);
          prism([[ex-.12,ey+.09],[ex+tilt-.05,ey+h*.78],[ex+tilt+.09,ey+h*.68],[ex+.1,ey+.08]],.318,.025,c.accent);
        }
      }
      prism(points,0,1.96,c.base);
      panel([-.84,1.37,.99],[1,0,0],[0,1,0],1.68,2.14,[0,0,1]);
      if(pattern==='solid'&&t.marking==='patch')prism([[-1.06,2.06],[-.89,2.54],[-.46,2.4],[-.51,1.91]],1.004,.02,c.muzzle);
      const ey=3.33+lift*.045,size=.4*t.eye;
      for(const s of [-1,1]){
        box(s*.57,ey,1.017,size+.13,sleep?.07:size+.1,.055,dark);
        if(!sleep){box(s*.57,ey-.025,1.052,size-.08,size-.01,.025,c.muzzle);box(s*.57+.035,ey-.03,1.072,.15,.21,.025,dark);box(s*.57,ey+size*.29,1.077,size+.13,.16,.032,c.base);}
      }
      box(.03,2.9,1.034,.38,.055,.04,dark);box(.23,2.944,1.034,.08,.12,.04,dark);
      return {x:0,y:1.94,z:1.3,scale:.71,rx:1.24,rz:1.02,collarY:2.68,centerZ:0,headX:0,headY:4.28,headZ:0};
    }
    function gecko() {
      const head=2.72+lift*.24;
      body(0,1.87,-.33,2.5,1.1,3.32);
      for(const s of [-1,1])for(const z of [-1.15,1.03]){
        box(s*1.64,1.05,z,.9,.4,.52,c.base);box(s*2.02,.67,z+.2,.48,.58,.5,c.base);
        for(let i=0;i<3;i++)box(s*(1.87+i*.18),.35,z+.52,.13,.16,.69,c.accent);
      }
      for(let i=0;i<6;i++)body(Math.sin(i*.38)*.48,1.6-i*.13,-2.07-i*.57,1.43-i*.19,.77-i*.1,.72);
      body(0,head,1.15,3.18,1.25,1.65);box(0,head-.31,2.0,2.52,.5,.4,c.muzzle);
      for(const s of [-1,1]){box(s*1.02,head+.62,1.29,.84,.59,.91,c.base);box(s*1.01,head+.57,1.92,.57,.62,.29,c.muzzle);eye(s*1.01,head+.57,2.082,.4);}
      if(!api.omitFace&&!api.omitMouth)geckoMouth(c,lift,api);
      return {x:0,y:1.63,z:2.01,scale:.63,rx:1.55,rz:1.04,collarY:2.65,centerZ:.86,headX:0,headY:head+.625,headZ:1.15};
    }
    function manta() {
      const y=3.1+lift*.25;
      body(0,y,0,2.22,.96,2.85);box(0,y-.4,.49,1.68,.22,1.89,c.muzzle);
      for(const s of [-1,1]){
        for(let i=0;i<5;i++)body(s*(1.32+i*.5),y+(i/4)*(lift-.5)*1.0,-.3-i*.18,.7,.55-i*.065,2.5-i*.4);
        box(s*.79,y+.22,1.64,.4,.49,.63,c.base);eye(s*.77,y+.3,1.979,.25);
        box(s*.64,y-.18,1.91,.36,.23,.6,c.accent);
      }
      for(let i=0;i<6;i++)box(Math.sin(i*.4)*.18,y-.12,-1.75-i*.51,.3-i*.036,.25,.65,i===5?c.accent:c.mark);
      return {x:0,y:y-.59,z:1.83,scale:.55,rx:1.01,rz:.83,collarY:y+.27,centerZ:1.0,headX:0,headY:y+.5,headZ:0};
    }
    function crab() {
      body(0,2.11,0,3.11,1.39,2.06);box(0,2.85,0,2.39,.24,1.62,c.accent);
      for(const s of [-1,1]){
        for(let i=0;i<3;i++){
          const z=-.71+i*.71;box(s*1.88,1.27,z,.93,.28,.28,c.base);box(s*2.29,.86,z+.23,.26,.83,.29,c.mark);box(s*2.46,.47,z+.27,.43,.22,.41,c.accent);
        }
        const hand=3.33+lift*.67;
        box(s*1.89,2.48,1.1,.72,.44,.48,c.base);box(s*2.35,2.92+lift*.34,1.17,.45,.89+lift*.6,.45,c.base);
        body(s*2.62,hand,1.2,1.12,.91,.88);
        box(s*2.96,hand+.65,1.2,.39,.71,.88,c.mark);box(s*2.29,hand+.48,1.2,.35,.46,.88,c.accent);
        box(s*.72,3.05,.63,.22,.76,.24,c.base);eye(s*.72,3.47,.78,.43);
      }
      box(0,2.41,1.044,.67,.075,.035,c.mark);
      return {x:0,y:1.7,z:1.52,scale:.65,rx:1.58,rz:1.12,collarY:2.77,centerZ:0,headX:0,headY:2.98,headZ:0};
    }
    return ({amble,rabbit,cat,dog,gecko,manta,crab}[shape]||amble)();
  }
  window.CreatureBodies={coats,species,build,ambleTraits,geckoMouth};
})();
