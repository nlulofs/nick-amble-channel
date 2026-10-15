/* One wardrobe projection for both renderers; receipts carry frozen tag versions. */
(() => {
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function beads(key,coat) {
    return ({mono:['#fffaf2','#34303c'],candy:['#ef83a6','#c9eacb','#f9db7b','#b899db','#fdf6e8'],pond:['#9fd4b9','#467e77','#dce9bf','#bce0d9'],inherit:[coat.accent,coat.mark,coat.muzzle,'#fffaf2']})[key]||[coat.accent,coat.mark];
  }
  function pixels(word,x,y,s,color='#fffaf2') {
    let out='';
    window.CreatureLettering.mask(word).rows.forEach((row,j)=>[...row].forEach((v,k)=>{
      if(v==='1')out+=`<rect x="${x+k*s}" y="${y+j*s}" width="${s*.96}" height="${s*.96}" fill="${color}"/>`;
    }));
    return out;
  }
  function flat(layers,anchor,coat) {
    let chains='',plaques='';
    layers.forEach((tag,i)=>{
      let out='';
      const w=anchor.width*(i?1.05:1),x=anchor.x,y=anchor.y+i*30, h=25;
      const colors=tag.bead_colors||beads(tag.beads,coat);
      out+=`<g aria-label="${escape(tag.role+' '+tag.word)}"><title>${escape(tag.role==='collar'?'Own collar: '+tag.word:'Received kandi: '+tag.word)}</title>`;
      out+=`<path d="M${x-w*.55},${anchor.y-11} Q${x},${y+35} ${x+w*.55},${anchor.y-11}" fill="none" stroke="${colors[1]}" stroke-width="5"/>`;
      for(let j=0;j<=22;j++){
        const t=j/22, xx=x-w*.55+t*w*1.1, yy=(1-t)*(1-t)*(anchor.y-11)+2*t*(1-t)*(y+35)+t*t*(anchor.y-11);
        out+=`<rect x="${xx-2.7}" y="${yy-2.7}" width="5.4" height="5.4" rx="1" fill="${colors[j%colors.length]}"/>`;
      }
      chains+=out+'</g>';
      out='<g>';
      const by=y+5, bw=Math.min(132,Math.max(w*.9,tag.word.length*7.5));
      out+=`<rect x="${x-bw/2}" y="${by}" width="${bw}" height="${h}" rx="2" fill="#27242e" stroke="#fffaf2" stroke-width="2" stroke-dasharray="2 2"/>`;
      const mask=window.CreatureLettering.mask(tag.word),s=Math.min(2.15,(bw-12)/mask.width,(h-5)/mask.height);
      out+=pixels(tag.word,x-mask.width*s/2,by+(h-mask.height*s)/2,s);
      plaques+=out+'</g>';
    });
    return chains+plaques;
  }
  function board(word,beads,anchor,api){
    const {box,face}=api, glyphs=window.CreatureLettering.glyphs, placement='necklace';
    const a=placement==='nameplate'?{x:0,y:.93,z:2.65,scale:1}:anchor||{x:0,y:3.29,z:1.69,scale:1,rx:1.86,rz:1.31,collarY:4.9,centerZ:0};
    const sc=a.scale;
    const transform=p=>[p[0]*sc+a.x,(p[1]-(placement==='nameplate'?.93:3.29))*sc+a.y,(p[2]-(placement==='nameplate'?2.65:1.69))*sc+a.z];
    const bx=(x,y,z,w,h,d,c)=>{const q=transform([x,y,z]);box(...q,w*sc,h*sc,d*sc,c);};
    const fx=(points,c,n)=>face(points.map(transform),c,n);
    const w=4.75,h=1.53,y=placement==='nameplate'?.93:3.29,z=placement==='nameplate'?2.65:1.69;
    bx(0,y,z,w,h,.23,'#27242e');
    for(let i=0;i<25;i++){const x=-w/2+i*w/24;for(const side of [-1,1])bx(x,y+side*h/2,z+.08,.135,.135,.15,i%2?'#ddd1de':'#fff7eb');}
    for(let i=1;i<8;i++)for(const side of [-1,1])bx(side*w/2,y-h/2+i*h/8,z+.08,.135,.135,.15,i%2?'#ddd1de':'#fff7eb');
    const mask=window.CreatureLettering.mask(word),s=Math.min(.152,4.22/mask.width,1.1/mask.height),left=-mask.width*s/2;
    mask.rows.forEach((row,j)=>[...row].forEach((v,k)=>{if(v==='1'){const x=left+k*s,yy=y+(mask.height/2-j)*s;fx([[x,yy,z+.127],[x+s*.94,yy,z+.127],[x+s*.94,yy-s*.94,z+.127],[x,yy-s*.94,z+.127]],'#fffdf0',[0,0,1]);}}));
    if(placement==='nameplate'){bx(0,.28,z-.18,.25,.6,.28,'#927491');return;}
    for(let i=0;i<38;i++){const t=i/38*Math.PI*2,drop=a.collarY-(a.y+.64*sc);box(a.x+Math.sin(t)*a.rx,a.collarY-Math.max(0,Math.cos(t))*drop,a.centerZ+Math.cos(t)*a.rz,.23*sc,.23*sc,.23*sc,beads[i%beads.length]);}
    for(const side of [-1,1])bx(side*.69,4.08,1.65,.18,.36,.18,'#f0dfbf');
  }

  function volume(layers,anchor,coat,api) {
    const scale=anchor.scale*(layers.length>1?.72:1);
    layers.forEach((t,i)=>board(t.word,t.bead_colors||beads(t.beads,coat),{...anchor,y:anchor.y+(layers.length>1?.2:0)-i*1.68*scale,z:anchor.z+i*.15,rx:anchor.rx*(1+i*.08),rz:anchor.rz+i*.13,scale},api));
  }
  window.CreatureWardrobe={beads,pixels,flat,volume,escape};
})();
