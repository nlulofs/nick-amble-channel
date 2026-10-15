/* Flat creature art. No DOM, wardrobe state, network calls or user metadata.
 * A collar renderer can use the returned chest anchor in any SVG surface. */
(() => {
  'use strict';
  const INK='#292638';
  const fallback={base:'#b8a0e8',mark:'#665087',muzzle:'#e8dcfb',accent:'#d6ea99'};
  const number=value=>Math.round(value*100)/100;
  const coords=points=>points.map(p=>p.map(number).join(',')).join(' ');
  function color(value,otherwise){return /^#[0-9a-f]{6}$/i.test(value||'')?value:otherwise;}
  function build(shape,coat,pattern,pose,lift,seed) {
    const c=Object.fromEntries(Object.entries(fallback).map(([key,value])=>[key,color(coat&&coat[key],value)]));
    if(shape==='lofl'&&window.CreatureLofl)return window.CreatureLofl.flat(c,pattern,pose,lift,seed);
    lift=Math.max(0,Math.min(1,Number(lift)||0));
    const sleepy=pose==='sleepy', parts=[];
    const add=svg=>parts.push(svg);
    function path(d,fill=c.base,stroke=INK,width=3.5){add(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`);}
    function poly(points,fill=c.base,stroke=INK,width=3.5){add(`<polygon points="${coords(points)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`);}
    function rect(x,y,w,h,fill=c.base,r=0,stroke='none',sw=0){add(`<rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);}
    function ellipse(x,y,rx,ry,fill=c.base,stroke=INK,sw=3.5){add(`<ellipse cx="${number(x)}" cy="${number(y)}" rx="${number(rx)}" ry="${number(ry)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);}
    function line(d,stroke=INK,width=3){path(d,'none',stroke,width);}
    function eye(x,y,size=7,smug=false) {
      add(`<g class="creature-eye" style="transform-origin:${x}px ${y}px">`);
      if(sleepy){line(`M${x-size},${y} q${size},${size*.72} ${size*2},0`,INK,3.5);add('</g>');return;}
      if(smug){
        ellipse(x,y,size+2,size+1,c.muzzle,INK,2.5);
        rect(x-1,y-1,4,size+1,INK,1);
        path(`M${x-size-2},${y-1} Q${x},${y-3} ${x+size+2},${y-1} L${x+size+3},${y-size-4} H${x-size-3} Z`,c.base,'none',0);
        line(`M${x-size-2},${y-1} l${size*2+4},0`,INK,2.7);
      }else{
        rect(x-size*.7,y-size,size*1.4,size*1.85,INK,2);
        rect(x-size*.4,y-size*.67,size*.42,size*.48,'#ffffff',.6);
      }
      add('</g>');
    }
    // Pattern panels fit inside their silhouettes; no SVG IDs or global defs.
    function marks(x,y,w,h,variant=0){
      if(pattern==='stripes'){
        const n=Math.max(1,Math.floor(h/21));
        for(let i=0;i<n;i++){
          const yy=y+i*h/n,offset=(i%2)*w*.15;
          poly([[x+offset,yy+4],[x+w,yy],[x+w-offset,yy+7],[x+w*.16,yy+13]],c.mark,'none',0);
        }
      }else if(pattern==='spots'){
        const nx=Math.max(1,Math.floor(w/27)),ny=Math.max(1,Math.floor(h/24));
        for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
          const xx=x+(i+.28+(j%2)*.16)*w/nx,yy=y+(j+.2)*h/ny,sw=w/nx*.48,sh=h/ny*.47;
          poly([[xx,yy],[xx+sw*.8,yy-1],[xx+sw,yy+sh*.6],[xx+sw*.6,yy+sh],[xx-1,yy+sh*.77]],c.mark,'none',0);
        }
      }
    }
    function rabbit(){
      // Ears remain visible at small sizes; the head does not become a blob.
      path('M124 133 L116 44 Q114 28 127 27 Q140 28 141 46 L148 127');
      path('M173 128 L181 48 Q183 31 196 35 Q208 38 203 56 L191 137');
      path('M130 109 L124 48 Q126 40 131 46 L137 110 Z',c.accent,'none');
      path('M181 112 L188 51 Q192 43 195 51 L186 115 Z',c.accent,'none');
      ellipse(214,232,21,22,c.muzzle);
      path('M119 183 Q100 214 108 247 L116 267 H204 L211 247 Q217 212 198 184 Z');
      ellipse(119,268,23,10);ellipse(192,268,23,10);
      marks(119,208,76,42);
      path('M139 207 Q159 196 179 207 L186 250 H132 Z',c.muzzle,'none');
      path('M113 213 L108 244 M206 212 L209 241', 'none', INK, 3);
      path('M108 139 L122 120 L190 119 L212 139 L215 168 L201 191 L181 198 H137 L114 186 L104 165 Z');
      marks(123,125,70,18);
      ellipse(147,175,17,11,c.muzzle,'none',0);ellipse(173,175,17,11,c.muzzle,'none',0);
      eye(131,158);eye(189,158);
      poly([[154,171],[166,171],[160,178]],c.accent,'none');
      line('M160 178 v7 M150 184 q10 7 20 0',INK,2.5);
      return {x:160,y:201,width:98};
    }
    function cat(){
      path('M116 237 C65 248 58 219 72 197 C84 178 75 163 63 169','none',INK,18);
      path('M116 237 C65 248 58 219 72 197 C84 178 75 163 63 169','none',c.base,11);
      path('M70 168 q-4-2-7 1','none',c.mark,11);
      path('M120 182 L107 232 L111 266 H211 L216 232 L198 183 Z');
      marks(117,211,86,42);
      path('M142 204 L137 254 H185 L180 204 Z',c.muzzle,'none');
      ellipse(127,269,22,10);ellipse(195,269,22,10);
      line('M132 228 v28 M188 228 v28',INK,2.5);
      path('M104 141 L101 71 L143 108 L181 108 L220 70 L218 140 L222 166 L200 191 L162 200 L124 191 L102 167 Z');
      poly([[111,92],[115,132],[137,116]],c.accent,'none');
      poly([[209,92],[186,116],[209,133]],c.accent,'none');
      marks(133,120,57,19);
      eye(132,153,7.6);eye(190,153,7.6);
      ellipse(150,175,15,10,c.muzzle,'none');ellipse(174,175,15,10,c.muzzle,'none');
      poly([[154,169],[170,169],[162,177]],c.accent,'none');
      line('M162 177 v8 M150 183 q5 7 12 2 q7 5 12-2',INK,2.2);
      line('M136 174 l-34-6 M136 180 l-31 5 M188 174 l31-6 M188 180 l30 5',INK,2.1);
      return {x:161,y:204,width:106};
    }
    function dog(){
      path('M205 235 Q249 229 247 187','none',INK,18);
      path('M205 235 Q249 229 247 187','none',c.base,11);
      line('M247 191 v-5',c.mark,11);
      path('M119 183 Q99 223 112 268 H210 Q222 219 201 183 Z');
      marks(119,213,81,39);
      path('M142 204 Q160 194 180 204 L188 253 H133 Z',c.muzzle,'none');
      ellipse(125,269,24,10);ellipse(195,269,24,10);
      line('M132 230 v25 M189 230 v25',INK,2.5);
      path('M117 111 Q91 97 84 121 L81 175 Q85 200 107 190 L124 159 Z');
      path('M204 111 Q230 98 236 122 L240 175 Q235 201 215 189 L197 158 Z');
      path('M103 118 Q94 116 92 132 L90 173 Q91 185 101 181 L111 150 Z',c.accent,'none');
      path('M218 118 Q227 116 229 132 L231 173 Q230 185 220 181 L210 150 Z',c.accent,'none');
      line('M94 164 l-1 11 M227 164 l1 11',c.mark,2.5);
      path('M109 123 L124 105 H197 L213 124 L216 166 L200 190 L161 201 L122 189 L105 166 Z');
      if(pattern==='spots')path('M114 130 l20-13 17 11-4 27-16 8-19-13 Z',c.mark,'none');
      else marks(126,111,69,21);
      eye(130,148,7.8);eye(192,148,7.8);
      path('M140 161 Q160 151 181 161 L193 176 Q194 189 176 192 H145 Q127 188 129 176 Z',c.muzzle,INK,2.5);
      path('M150 165 Q160 161 171 165 L168 175 Q161 181 153 175 Z',INK,'none');
      line('M161 178 v7 M145 185 q7 7 16 0 q9 7 16 0',INK,2.3);
      if(pose==='curious')path('M162 188 h12 v10 q-6 9-12 0 Z',c.accent,INK,2);
      return {x:161,y:205,width:112};
    }
    function amble(){
      const traits=window.CreatureBodies&&window.CreatureBodies.ambleTraits;
      const t=traits?traits(seed??1):{ear:'leaf',tail:'curl',eye:1,squish:1,wrongEar:-1,wrongTilt:13,cut1:1,cut2:5,jag:Array(9).fill(0)};
      const cx=162,cy=184,rx=64,ry=81*t.squish;
      const points=Array.from({length:8},(_,i)=>{
        const a=i/8*Math.PI*2-Math.PI/2,w=1+t.jag[i]-((i===t.cut1||i===t.cut2)?.13:0);
        return [cx+Math.cos(a)*rx*w,cy+Math.sin(a)*ry*w];
      });
      const p=i=>points[(i+8)%8],mid=(i,j)=>[(p(i)[0]+p(j)[0])/2,(p(i)[1]+p(j)[1])/2].map(number).join(' '),pt=i=>p(i).map(number).join(' ');
      let outline=`M${mid(7,0)}`;
      for(let i=0;i<8;i++)outline+=(i===t.cut1||i===t.cut2)?` L${pt(i)} L${mid(i,i+1)}`:` Q${pt(i)} ${mid(i,i+1)}`;
      outline+=' Z';
      if(t.tail==='curl')line('M105 215 Q70 218 77 191 Q83 177 91 188 Q95 197 85 201',c.mark,7);
      else if(t.tail==='tuft'){line('M105 217 q-25 9-31-12',c.mark,6);ellipse(73,202,8,8,c.accent,INK,2.5);}
      else if(t.tail==='stub')ellipse(101,220,12,11);
      else line('M105 218 Q70 240 70 207',c.mark,6);
      ellipse(138,264,15,8);ellipse(188,264,15,8);
      for(const s of [-1,1]){
        const x=cx+s*36,wrong=s===t.wrongEar,angle=wrong?s*t.wrongTilt:0;
        add(`<g transform="rotate(${angle} ${x} 113)">`);
        if(t.ear==='nub')ellipse(x,109,15,16);
        else if(t.ear==='antenna'){
          line(`M${x} 116 q${s*10}-22 ${s*14}-40`,INK,3.5);ellipse(x+s*14,76,7,7,c.accent,INK,2.5);
        }else{
          const h=t.ear==='tall'?51:39;
          path(`M${x-11} 123 Q${x-21} ${108-h} ${x+4} ${107-h} Q${x+22} ${111-h/2} ${x+10} 124 Z`);
          path(`M${x-4} 108 Q${x-10} ${115-h} ${x+3} ${117-h} L${x+4} 110 Z`,c.accent,'none');
        }
        add('</g>');
      }
      path(outline);
      marks(120,150,79,83);
      if(pattern==='solid'&&t.marking==='patch')path('M111 196 q12-14 23-4 l-2 23-18 2 Z',c.muzzle,'none');
      if(pattern==='solid'&&t.marking==='speckles')for(const [x,y] of [[114,193],[124,198],[118,205]])ellipse(x,y,2,2,c.mark,'none',0);
      eye(138,163,8*t.eye,true);eye(185,163,8*t.eye,true);
      if(sleepy)line('M155 186 q6 4 14 0',INK,2.5);
      else line('M155 186 q7 4 16 0 l3-5',INK,2.5);
      return {x:161,y:204,width:114};
    }
    function gecko(){
      path('M152 219 Q169 259 218 272 Q254 282 263 260 Q244 272 218 252 L178 211 Z');
      marks(194,249,36,12);
      for(const [x,y,s] of [[97,208,-1],[110,247,-1],[222,208,1],[212,247,1]]){
        line(`M${x-s*16} ${y-8} L${x} ${y} l${s*12} 12`,INK,16);
        line(`M${x-s*16} ${y-8} L${x} ${y} l${s*12} 12`,c.base,10);
        for(let i=0;i<3;i++)line(`M${x+s*9} ${y+8} l${s*(10+i*3)} ${i*7-2}`,c.accent,4);
      }
      path('M111 179 Q160 158 209 178 L205 220 L186 242 H133 L112 223 Z');
      marks(121,200,73,29);
      path('M139 200 Q160 192 182 202 L184 234 H138 Z',c.muzzle,'none');
      path('M98 141 Q115 119 139 133 H181 Q207 119 226 142 L231 164 L211 190 Q160 208 109 190 L88 165 Z');
      ellipse(116,141,22,24);ellipse(206,141,22,24);
      ellipse(116,140,14,17,c.muzzle,INK,2.5);ellipse(206,140,14,17,c.muzzle,INK,2.5);
      eye(116,140,8.5);eye(206,140,8.5);
      marks(138,147,48,22);
      path('M104 176 Q160 189 218 176 L209 191 Q158 208 111 191 Z',c.muzzle,'none');
      line('M129 183 Q159 194 191 183',INK,2.5);
      return {x:160,y:205,width:125};
    }
    function manta(){
      const rise=lift*17,head=152;
      path('M150 215 Q148 262 168 278 Q159 255 165 216 Z',c.mark,INK,2.5);
      path(`M129 155 L105 167 Q79 155 39 ${138-rise} Q48 ${195-rise} 93 225 L126 213 Q159 237 194 213 L227 225 Q271 ${195-rise} 281 ${138-rise} Q242 157 214 167 L191 155 Z`);
      marks(63,174-rise,52,23);marks(207,174-rise,50,23);
      path('M122 183 Q160 171 198 183 L192 211 Q160 230 128 211 Z',c.muzzle,'none');
      path('M125 164 Q118 136 131 128 Q143 129 143 152 H177 Q177 128 190 128 Q202 136 195 164 Z');
      eye(134,157,6.8);eye(187,157,6.8);
      marks(142,173,37,11);
      line('M152 181 q9 5 18 0',INK,2.4);
      return {x:160,y:192,width:119};
    }
    function crab(){
      for(const s of [-1,1])for(let i=0;i<3;i++){
        const x=160+s*53,y=204+i*12,dx=35+i*6;
        line(`M${x} ${y} l${s*dx} ${5+i*2} l${s*4} 21`,INK,10);
        line(`M${x} ${y} l${s*dx} ${5+i*2} l${s*4} 21`,c.base,5.5);
      }
      for(const s of [-1,1]){
        const x=160+s*99,y=160-lift*22;
        line(`M${160+s*57} 209 L${x} 195 L${x} ${y+15}`,INK,15);
        line(`M${160+s*57} 209 L${x} 195 L${x} ${y+15}`,c.base,9);
        path(`M${x-22} ${y+13} Q${x-33} ${y-8} ${x-18} ${y-30} L${x-4} ${y-5} L${x+7} ${y-32} Q${x+29} ${y-15} ${x+23} ${y+11} Q${x} ${y+29} ${x-22} ${y+13} Z`);
        marks(x-15,y,27,16);
      }
      path('M111 176 L132 165 H190 L211 177 L224 203 L213 230 L187 243 H133 L107 230 L97 202 Z');
      marks(111,193,96,35);
      path('M115 184 Q159 168 208 184',c.accent,'none');
      for(const x of [135,186]){
        line(`M${x} 181 v-33`,INK,10);line(`M${x} 181 v-33`,c.base,5);
        ellipse(x,145,14,15,c.base,INK,2.8);eye(x,145,7.5);
      }
      line('M149 190 q12 7 24 0',INK,2.5);
      return {x:160,y:204,width:125};
    }
    const anchor=({amble,rabbit,cat,dog,gecko,manta,crab}[shape]||amble)();
    return {markup:parts.join(''),anchor,viewBox:'0 0 320 320'};
  }
  window.CreatureFlatBodies={build};
})();
