/* Small WebGL scene, independent of persistence, agent identity and label semantics. */
(() => {
  'use strict';
  function accessories(items,a,coat,{box,face}) {
    const dark='#292638', x=a.headX||0, top=a.headY||a.collarY+1.5, z=a.headZ||0;
    function hueColor(hue){
      if(typeof hue!=='number'||!Number.isFinite(hue))return coat.accent;
      const h=((hue%360)+360)%360/60,chroma=.496,q=chroma*(1-Math.abs(h%2-1)),m=.352;
      const rgb=h<1?[chroma,q,0]:h<2?[q,chroma,0]:h<3?[0,chroma,q]:h<4?[0,q,chroma]:h<5?[q,0,chroma]:[chroma,0,q];
      return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
    }
    (items||[]).forEach(item=>{
      const fill=hueColor(item.hue),side=a.rx+.62,front=a.centerZ+a.rz+.08;
      switch(item.kind){
        case 'hat':
          box(x,top+.04,z,1.64,.13,1.05,fill);
          if(item.variant%2){
            const apex=[x,top+1.04,z],base=[[x-.65,top+.11,z+.43],[x+.65,top+.11,z+.43],[x+.65,top+.11,z-.43],[x-.65,top+.11,z-.43]];
            for(let i=0;i<4;i++)face([base[i],base[(i+1)%4],apex],fill,[[0,.4,1],[1,.4,0],[0,.4,-1],[-1,.4,0]][i]);
          }else{box(x,top+.45,z,1.03,.73,.77,fill);box(x,top+.2,z+.4,1.07,.15,.06,dark);}
          break;
        case 'scarf':
          box(0,a.collarY+.08,front,a.rx*2,.25,.17,fill);
          for(const s of [-1,1])box(s*a.rx,a.collarY+.08,a.centerZ,.19,.25,a.rz*2,fill);
          box(a.rx*.72,a.collarY-.45,front+.13,.34,1.2,.2,fill);box(a.rx*.72,a.collarY+.01,front+.2,.46,.37,.27,fill);
          break;
        case 'flag':case 'pennant':
          box(side,a.collarY+.15,a.centerZ,.095,2.6,.095,dark);
          if(item.kind==='flag')box(side+.46,a.collarY+1.12,a.centerZ,.88,.59,.07,fill);
          else{face([[side,a.collarY+1.44,a.centerZ+.04],[side+1.02,a.collarY+1.12,a.centerZ+.04],[side,a.collarY+.82,a.centerZ+.04]],fill,[0,0,1]);face([[side,a.collarY+1.44,a.centerZ-.04],[side+1.02,a.collarY+1.12,a.centerZ-.04],[side,a.collarY+.82,a.centerZ-.04]],fill,[0,0,-1]);}
          break;
        case 'balloon':
          for(let i=0;i<12;i++)box(a.rx+.18+i*.038,a.collarY-.75+i*.17,a.centerZ,.035,.22,.035,dark);
          box(side, a.collarY+1.62,a.centerZ,.75,1.01,.67,fill);box(side,a.collarY+2.16,a.centerZ,.49,.24,.5,fill);box(side,a.collarY+1.08,a.centerZ,.48,.2,.49,fill);box(side,a.collarY+.94,a.centerZ,.19,.15,.17,fill);box(side-.17,a.collarY+1.91,a.centerZ+.35,.13,.3,.04,'#fffaf2');
          break;
        case 'sprout':
          box(x,top+.3,z,.11,.63,.11,'#4a7c46');
          for(const s of [-1,1]){face([[x,top+.45,z+.07],[x+s*.54,top+.93,z+.07],[x+s*.6,top+.6,z+.07]],fill,[0,0,1]);face([[x,top+.45,z-.07],[x+s*.54,top+.93,z-.07],[x+s*.6,top+.6,z-.07]],fill,[0,0,-1]);}
          break;
        case 'lantern':
          box(-a.rx-.3,a.collarY+.1,a.centerZ,.73,.11,.13,dark);box(-side,a.collarY-.11,a.centerZ,.08,.5,.08,dark);
          box(-side,a.collarY-.61,a.centerZ,.58,.75,.5,fill);box(-side,a.collarY-.6,a.centerZ+.27,.38,.5,.05,'#ffde88');box(-side,a.collarY-.2,a.centerZ,.69,.13,.58,dark);box(-side,a.collarY-1.01,a.centerZ,.69,.13,.58,dark);
          break;
        case 'bell':
          box(0,a.y-.57,front+.16,.075,.48,.075,dark);box(0,a.y-.91,front+.16,.38,.4,.32,fill);box(0,a.y-1.12,front+.16,.53,.12,.39,fill);box(0,a.y-1.24,front+.16,.13,.13,.14,dark);
          break;
      }
    });
  }
  function create(canvas) {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true});
    if(!gl) return null;
    const shader=(type,source)=>{
      const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('3D shader unavailable');
      return s;
    };
    const program=gl.createProgram();
    const shaders=[shader(gl.VERTEX_SHADER,'attribute vec3 position; attribute vec4 color; varying vec4 tint; void main(){gl_Position=vec4(position,1.0);tint=color;}'),shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec4 tint; void main(){gl_FragColor=tint;}')];
    shaders.forEach(s=>gl.attachShader(program,s));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('3D renderer unavailable');
    gl.useProgram(program);
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [key,size,offset] of [['position',3,0],['color',4,12]]){
      const loc=gl.getAttribLocation(program,key); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);
    }
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    let angle=-.38, zoom=1, drag=null, latest=null,destroyed=false;
    let faces=[];
    const shade=(hex,n)=>'#'+hex.slice(1).match(/../g).map(v=>Math.min(255,Math.max(0,Math.round(parseInt(v,16)*n))).toString(16).padStart(2,'0')).join('');
    const face=(points,color,normal,normals)=>faces.push({points,color,normal,normals});
    function box(x,y,z,w,h,d,color){
      const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
      face([[a,c,g],[b,c,g],[b,e,g],[a,e,g]],color,[0,0,1]); face([[b,c,f],[a,c,f],[a,e,f],[b,e,f]],shade(color,.74),[0,0,-1]);
      face([[a,c,f],[a,c,g],[a,e,g],[a,e,f]],shade(color,.82),[-1,0,0]); face([[b,c,g],[b,c,f],[b,e,f],[b,e,g]],shade(color,.91),[1,0,0]);
      face([[a,e,g],[b,e,g],[b,e,f],[a,e,f]],shade(color,1.1),[0,1,0]); face([[a,c,f],[b,c,f],[b,c,g],[a,c,g]],shade(color,.66),[0,-1,0]);
    }
    function camera(p){
      const c=Math.cos(angle),s=Math.sin(angle),x=p[0]*c+p[2]*s,z=-p[0]*s+p[2]*c;
      return [x,p[1]*Math.cos(.12)-z*Math.sin(.12),p[1]*Math.sin(.12)+z*Math.cos(.12)];
    }
    function render(agent,coat,layers,lift) {
      if(destroyed)return;
      latest=[agent,coat,layers,lift];
      const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
      if(!w||!h) return;
      const d=Math.min(devicePixelRatio||1,2),cw=Math.round(w*d),ch=Math.round(h*d);
      if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
      gl.viewport(0,0,cw,ch); faces=[];
      const spec=window.CreatureBodies.species[agent.shape];
      if(agent.aura!=='off'){
        const radius=agent.aura==='quiet'?3.25:3.7;
        for(let i=0;i<64;i++){const t=i/64*Math.PI*2;box(Math.cos(t)*radius,spec.focus+Math.sin(t)*radius,-2.3,.055,.055,.055,coat.accent);}
      }
      if(agent.shape==='lofl'){
        for(let i=0;i<48;i++){
          const a=i/48*Math.PI*2,b=(i+1)/48*Math.PI*2;
          face([[0,0,0],[Math.cos(a)*1.9,0,Math.sin(a)*1.1],[Math.cos(b)*1.9,0,Math.sin(b)*1.1]],'#78858b',[0,1,0]);
        }
      }else box(0,-.13,0,6.8,.15,4.8,coat.mark);
      const anchor=window.CreatureBodies.build(agent.shape,coat,agent.pattern,agent.pose,lift,{box,face,seed:agent.seed});
      accessories(agent.legacy_items,anchor,coat,{box,face});
      window.CreatureWardrobe.volume(layers,anchor,coat,{box,face});
      const scale=Math.min(w/9.8,h/spec.span)*zoom;
      const project=p=>{const c=camera(p);return [c[0]*scale*2/w,(c[1]-spec.focus)*scale*2/h,c[2]];};
      const vertices=[];
      for(const f of faces){
        if(camera(f.normal)[2]<=.001)continue;
        const ps=f.points.map(project),color=f.color.slice(1).match(/../g).map(c=>parseInt(c,16)/255);
        const colors=f.normals?f.normals.map(n=>{
          // Soft clay: warm key from upper left and a cool fill. Vertex lighting
          // preserves the continuous curves rather than shading polygon plates.
          const key=Math.max(0,n[0]*-.42+n[1]*.70+n[2]*.57);
          const light=.64+.46*key,shine=.06*Math.pow(Math.max(0,n[0]*-.22+n[1]*.40+n[2]*.89),18);
          return color.map((c,k)=>Math.min(1,c*light+shine+[.025,.017,.012][k]));
        }):ps.map(()=>color);
        for(let i=1;i<ps.length-1;i++)for(const j of [0,i,i+1]){const p=ps[j];vertices.push(p[0],p[1],-p[2]/30,...colors[j],1);}
      }
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);
    }
    const repaint=()=>{if(latest)render(...latest);};
    const listeners={pointerdown:e=>{drag={x:e.clientX,angle};canvas.setPointerCapture(e.pointerId);},pointermove:e=>{if(drag){angle=drag.angle+(e.clientX-drag.x)*.009;repaint();}},pointerup:()=>drag=null,pointercancel:()=>drag=null,keydown:e=>{if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();angle=e.key==='Home'?0:angle+(e.key==='ArrowLeft'?-.15:.15);repaint();}}};
    Object.entries(listeners).forEach(([event,fn])=>canvas.addEventListener(event,fn));
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(repaint):null;
    if(observer)observer.observe(canvas);
    return {render,front:()=>{angle=0;repaint();},zoom:value=>{zoom=Math.min(2,Math.max(.5,Number(value)||1));repaint();},destroy:()=>{destroyed=true;if(observer)observer.disconnect();Object.entries(listeners).forEach(([event,fn])=>canvas.removeEventListener(event,fn));gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);latest=null;}};
  }
  window.CreatureScene={create,accessories,supportsLegacyItems:true};
})();
