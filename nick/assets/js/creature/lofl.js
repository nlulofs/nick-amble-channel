/* The Lofl family. One set of proportions feeds flat artwork and smooth volumes.
 * Geometry adapted from Elsewhere's buildCreature (prototype 49d0561), with
 * independently seeded cosmetic variation. No world, storage, or identity code. */
(() => {
  'use strict';
  const INK='#303d46';
  const palettes=[
    {name:'Blue keepsake',base:'#e8e7d6',mark:'#83a9cd',muzzle:'#c6d9e6',accent:'#e9a89c'},
    {name:'Pond leaf',base:'#e8e7c9',mark:'#a9bc88',muzzle:'#ead9b9',accent:'#e9a89c'},
    {name:'Periwinkle',base:'#c6cee3',mark:'#8c89b3',muzzle:'#e4e4ed',accent:'#e5afb1'},
    {name:'Sea glass',base:'#bed7cf',mark:'#759b9b',muzzle:'#e1e8d5',accent:'#e9b5a0'},
    {name:'Peach stone',base:'#e9c9b7',mark:'#b58c9c',muzzle:'#f0e4ce',accent:'#d18e88'},
    {name:'Moon moth',base:'#d8d3e3',mark:'#9aacc2',muzzle:'#eee6df',accent:'#dfa4b5'}
  ];
  function random(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function traits(seed){
    // Zero is the reference rig. Ordinary seeds can approach every proportion.
    const r=random(seed),between=(a,b)=>a+(b-a)*r();
    if((seed>>>0)===0)return {width:1,height:1,ears:1,splay:.25,asymmetry:0,eyes:1,spacing:1,feet:1,lean:0};
    return {width:between(.91,1.09),height:between(.94,1.08),ears:between(.77,1.16),
      splay:between(.16,.39),asymmetry:between(-.065,.065),eyes:between(.88,1.12),
      spacing:between(.94,1.08),feet:between(.91,1.08),lean:between(-.035,.035)};
  }
  function coat(seed){const r=random((seed>>>0)^0x51f15e);return {...palettes[(seed>>>0)===0?0:Math.floor(r()*palettes.length)]};}
  function model(seed,colors,pose='awake',lift=0,pattern='solid'){
    const t=traits(seed),c=colors,parts=[],curves=[];
    const sphere=(name,x,y,z,rx,ry,rz,color,angle=0)=>parts.push({name,x,y,z,rx,ry,rz,color,angle});
    const curve=(name,points,radius,color)=>curves.push({name,points,radius,color});
    const ears=[];
    for(const sign of [-1,1]){
      const angle=-sign*(t.splay+sign*t.asymmetry)+t.lean+(pose==='curious'?sign*.06*lift:0);
      const h=t.ears*(1+sign*t.asymmetry),x=sign*.27*t.width,y=.94*t.height;
      const local=(px,py)=>[x+px*Math.cos(angle)-py*Math.sin(angle),y+px*Math.sin(angle)+py*Math.cos(angle)];
      let p=local(0,.34*h);
      sphere('ear',...p,-.02,.145,.42*h,.1,c.mark,angle);
      sphere('inner-ear',...p,.057,.064,.27*h,.034,c.base,angle);
      ears.push(p);
      sphere('foot',sign*.28*t.width,-.025,.15,.20*t.feet,.12,.25,c.base);
    }
    sphere('body',0,.48*t.height,0,.56*t.width,.64*t.height,.46,c.base);
    sphere('belly',0,.33*t.height,.30,.37*t.width,.34*t.height,.2,c.muzzle);
    for(const sign of [-1,1]){
      sphere('arm',sign*.51*t.width,.37*t.height,.015,.12,.24,.13,c.base,sign*.28);
      const x=sign*.20*t.spacing,y=.65*t.height;
      sphere('eye',x,y,.426,.055*t.eyes,(pose==='sleepy'?.017:.094)*t.eyes,.028,INK);
      if(pose!=='sleepy')sphere('glint',x-.015,y+.037,.453,.015,.023,.012,'#fff9e9');
    }
    sphere('nose',0,.54*t.height,.47,.028,.018,.012,INK);
    curve('smile',[[-.063,.45*t.height,.485],[0,.424*t.height,.49],[.061,.45*t.height,.485]],.009,INK);
    // Optional markings are paint records, never raised ellipsoids.
    const paint='#'+[0,1,2].map(i=>Math.round(parseInt(c.base.slice(1+i*2,3+i*2),16)*.74+parseInt(c.mark.slice(1+i*2,3+i*2),16)*.26).toString(16).padStart(2,'0')).join('');
    if(pattern!=='solid')for(const sign of [-1,1])for(let i=0;i<3;i++){
      const y=(.78-i*.17)*t.height,x=sign*(.42+(i===2?-.015:0))*t.width;
      const z=.46*Math.sqrt(Math.max(.05,1-(x/(.56*t.width))**2-((y-.48*t.height)/(.64*t.height))**2))+.01;
      sphere('mark',x,y,z,pattern==='spots'?.025:.055,.022,0,paint,sign*.2);
    }
    return {parts,curves,traits:t};
  }
  const n=x=>Math.round(x*1000)/1000;
  function flat(coat,pattern,pose,lift,seed){
    const {parts,curves,traits:t}=model(seed,coat,pose,lift,pattern),scale=113,X=x=>160+x*scale,Y=y=>262-y*scale;
    let markup='<g data-lofl="1"><ellipse cx="160" cy="281" rx="64" ry="7" fill="#303d46" opacity=".12"/>';
    const draw=p=>{
      const x=n(X(p.x)),y=n(Y(p.y)),eye=p.name==='eye';
      return `<ellipse data-part="${p.name}"${eye?' class="creature-eye" style="transform-origin:'+x+'px '+y+'px"':''} cx="${x}" cy="${y}" rx="${n(p.rx*scale)}" ry="${n(p.ry*scale)}" transform="rotate(${n(-p.angle*180/Math.PI)} ${x} ${y})" fill="${p.color}"${['body','ear','foot','arm'].includes(p.name)?' stroke="#465461" stroke-opacity=".7" stroke-width="1.8"':''}/>`;
    };
    // Render limb silhouettes behind the uninterrupted egg, details in front.
    const back=['ear','inner-ear','foot','arm'];
    for(const p of parts.filter(p=>back.includes(p.name)))markup+=draw(p);
    for(const p of parts.filter(p=>!back.includes(p.name)))markup+=draw(p);
    for(const c of curves){const [a,b,d]=c.points;markup+=`<path data-part="${c.name}" d="M${n(X(a[0]))} ${n(Y(a[1]))} Q${n(X(b[0]))} ${n(Y(b[1]))} ${n(X(d[0]))} ${n(Y(d[1]))}" fill="none" stroke="${c.color}" stroke-width="${n(c.radius*scale*2)}" stroke-linecap="round"/>`;}
    markup+='</g>';
    return {markup,anchor:{x:160,y:Y(.22*t.height),width:83*t.width},viewBox:'0 0 320 320'};
  }
  // Ink follows the skin: no eyeballs, highlights or floating mouth beads.
  function face(coat,pose,api,{blink=0,open=0,dizzy=0,dizzyPhase=0}={}){
    const t=traits(api.seed??0),ink=INK;
    const skin=(x,y)=>Math.max(
      .46*Math.sqrt(Math.max(0,1-(x/(.56*t.width))**2-((y-.48*t.height)/(.64*t.height))**2)),
      .30+.2*Math.sqrt(Math.max(0,1-(x/(.37*t.width))**2-((y-.33*t.height)/(.34*t.height))**2)));
    const point=(x,y)=>[x*3,(y+.15)*3,(skin(x,y)+.004)*3];
    function ellipse(x,y,rx,ry){
      for(let i=0;i<32;i++){
        const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;
        api.face([point(x,y),point(x+Math.cos(a)*rx,y+Math.sin(a)*ry),point(x+Math.cos(b)*rx,y+Math.sin(b)*ry)],ink,[0,0,1]);
      }
    }
    for(const sign of [-1,1]){
      const x=sign*.20*t.spacing,y=.65*t.height;
      if(dizzy>0){
        // A thin spiral stays painted on the same curved skin as the eyes.
        // The portrait owns its short lifetime; this recipe has no clock.
        const size=(.036+.063*Math.min(1,dizzy))*t.eyes,thickness=.006*t.eyes;
        const spiral=u=>{const a=u*Math.PI*4+sign*dizzyPhase,r=size*(.13+.87*u);return[x+Math.cos(a)*r,y+Math.sin(a)*r];};
        for(let i=0;i<64;i++){
          const a=spiral(i/64),b=spiral((i+1)/64),length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
          const nx=-(b[1]-a[1])/length*thickness,ny=(b[0]-a[0])/length*thickness;
          api.face([point(a[0]+nx,a[1]+ny),point(b[0]+nx,b[1]+ny),point(b[0]-nx,b[1]-ny),point(a[0]-nx,a[1]-ny)],ink,[0,0,1]);
        }
      }else ellipse(x,y,.049*t.eyes,(pose==='sleepy'?.012:.083*(1-Math.min(1,Math.max(0,blink)))+.006)*t.eyes);
    }
    ellipse(0,.54*t.height,.022,.012);
    if(open>.02)ellipse(0,.442*t.height,.036+open*.008,.009+open*.039);
    else for(let i=0;i<20;i++){
      const x=-.062+i/20*.124,next=-.062+(i+1)/20*.124;
      const y=u=>(.434+.016*(u/.062)**2)*t.height;
      api.face([point(x,y(x)-.006),point(next,y(next)-.006),point(next,y(next)+.006),point(x,y(x)+.006)],ink,[0,0,1]);
    }
  }
  function volume(coat,pattern,pose,lift,api){
    const {parts,traits:t}=model(api.seed??0,coat,pose,lift,pattern);
    const normalize=v=>{const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
    // Partition existing body triangles into base/paint areas. New vertices are
    // interpolated on the original triangle planes: no overlay, offset, tube,
    // extra shell, displacement, silhouette change, or texture dependency.
    const marks=parts.filter(p=>p.name==='mark').map(p=>({
      color:p.color,cx:p.x*3,cy:(p.y+.15)*3,r:Math.max(p.rx,p.ry)*3,
      boundary:Array.from({length:20},(_,i)=>{
        const a=i/20*Math.PI*2,x=Math.cos(a)*p.rx,y=Math.sin(a)*p.ry;
        return [(p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle))*3,
          (p.y+.15+x*Math.sin(p.angle)+y*Math.cos(p.angle))*3];
      })
    }));
    function clip(poly,a,b,inside){
      const side=v=>(b[0]-a[0])*(v.point[1]-a[1])-(b[1]-a[1])*(v.point[0]-a[0]);
      const result=[];
      for(let i=0;i<poly.length;i++){
        const v=poly[i],w=poly[(i+1)%poly.length],dv=side(v),dw=side(w);
        const vin=inside?dv>=0:dv<=0,win=inside?dw>=0:dw<=0;
        if(vin)result.push(v);
        if(vin!==win){
          const u=dv/(dv-dw),mix=(a,b)=>a.map((x,k)=>x+(b[k]-x)*u);
          result.push({point:mix(v.point,w.point),normal:mix(v.normal,w.normal)});
        }
      }
      return result;
    }
    function emit(poly,color,normal){
      if(poly.length<3)return;
      api.face(poly.map(v=>v.point),color,normal,poly.map(v=>v.normal));
    }
    function paintedTriangle(tri,color,normal){
      const xs=tri.map(v=>v.point[0]),ys=tri.map(v=>v.point[1]);
      const candidates=marks.filter(m=>Math.max(...xs)>=m.cx-m.r&&Math.min(...xs)<=m.cx+m.r&&Math.max(...ys)>=m.cy-m.r&&Math.min(...ys)<=m.cy+m.r);
      let unpainted=[tri];
      for(const m of candidates){
        const remaining=[];
        for(const polygon of unpainted){
          let inside=polygon;
          for(let i=0;i<m.boundary.length&&inside.length>=3;i++){
            const a=m.boundary[i],b=m.boundary[(i+1)%m.boundary.length];
            const outside=clip(inside,a,b,false);
            if(outside.length>=3)remaining.push(outside);
            inside=clip(inside,a,b,true);
          }
          if(inside.length>=3)emit(inside,m.color,normal);
        }
        unpainted=remaining;
      }
      for(const polygon of unpainted)emit(polygon,color,normal);
    }
    function sphere(p,segments=24,rings=16){
      const ca=Math.cos(p.angle||0),sa=Math.sin(p.angle||0);
      const rotate=([x,y,z])=>[x*ca-y*sa,x*sa+y*ca,z];
      const rows=[];
      for(let j=0;j<=rings;j++){
        const a=j/rings*Math.PI,row=[];
        for(let i=0;i<=segments;i++){
          const b=i/segments*Math.PI*2,u=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
          const offset=rotate([u[0]*p.rx,u[1]*p.ry,u[2]*p.rz]);
          row.push({point:[(p.x+offset[0])*3,(p.y+offset[1]+.15)*3,(p.z+offset[2])*3],normal:normalize(rotate([u[0]/p.rx,u[1]/p.ry,u[2]/p.rz]))});
        }
        rows.push(row);
      }
      for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
        // Original sphere winding and outward normals; DoubleSide material keeps the original shading.
        const q=[rows[j][i],rows[j+1][i],rows[j+1][i+1],rows[j][i+1]];
        const normals=q.map(v=>v.normal),normal=normalize([0,1,2].map(k=>normals.reduce((sum,v)=>sum+v[k],0)));
        if(p.name==='body'&&marks.length&&q.every(v=>v.point[2]>=-1e-9)){
          paintedTriangle([q[0],q[1],q[2]],p.color,normal);
          paintedTriangle([q[0],q[2],q[3]],p.color,normal);
        }else api.face(q.map(v=>v.point),p.color,normal,normals);
      }
    }
    for(const p of parts)if(!['eye','glint','nose','mark'].includes(p.name))sphere(p,p.name==='body'?32:20,p.name==='body'?24:12);
    if(!api.omitFace)face(coat,pose,api);
    return {x:0,y:1.05*t.height,z:1.8,scale:.31,rx:1.42*t.width,rz:1.42,collarY:1.9*t.height,centerZ:0,headX:0,headY:3.82*t.height,headZ:0};
  }
  window.CreatureLofl={traits,coat,model,flat,volume,face,palettes,supportsDizzyFace:true};
})();
