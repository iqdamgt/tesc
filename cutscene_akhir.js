// =====================================================================
// CUTSCENE AKHIR - MIDNIGHT LAB..
// Tiga panggung 3D tambahan (dimuat SETELAH cutscene3d.js):
//   'jalan' : Wandih naik Vespa merah di jalan hutan malam hari (monolog)
//   'rumah' : Wandih sampai, parkir di halaman rumah (rumah batu), tetangga di sebelah (BERHASIL)
//   'tidur' : Wandih berbaring di kasur, selimut dinamis (gambar sendiri), tangan di dada, efek Zzz (SELESAI)
// Tokoh Wandih di sini memakai rangka bersendi (siku & lutut) supaya pose motor dan tidur realistis.
// Kalau ada error, adegan otomatis kembali ke tampilan lama (sv) lewat mekanisme cutscene3d.js.
// =====================================================================
(function(){
'use strict';
if(typeof THREE==='undefined'||!window.CUT3D||!CUT3D.api)return;
const A=CUT3D.api,PI=Math.PI,V3=THREE.Vector3,Q=THREE.Quaternion,F=A.F;
const LM=A.LM,BM=A.BM,bx=A.bx,cvTex=A.cvTex;
const MOTOR=(typeof CUT_SND!=='undefined'&&CUT_SND.motor)||'motor.wav';
const BLANKET=(typeof BLANKET_URL!=='undefined'&&BLANKET_URL)||'';
const rng=seed=>{let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>{s=s*16807%2147483647;return(s-1)/2147483646}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,k)=>a+(b-a)*k,sstep=k=>{k=clamp(k,0,1);return k*k*(3-2*k)};
const X=new V3(1,0,0),DOWN=new V3(0,-1,0);

// ---------- rangka Wandih bersendi (siku & lutut) ----------
function halfUV(g,w,h,d,half){const W=2*d+2*w,H=d+h,hh=h/2,uv=g.attributes.uv,R=[[0,d,d,h],[d+w,d,d,h],[d,0,w,d],[d+w,0,w,d],[2*d+w,d,w,h],[d,d,w,h]];
 R.forEach((r,k)=>{let x=r[0],y=r[1],rw=r[2],rh=r[3];if(k!==2&&k!==3){y=d+half*hh;rh=hh}
  const u0=x/W,u1=(x+rw)/W,vT=1-y/H,vB=1-(y+rh)/H;let p=[[u0,vT],[u1,vT],[u0,vB],[u1,vB]];if(k===2)p=[[u1,vB],[u0,vB],[u1,vT],[u0,vT]];
  p.forEach((q,i)=>uv.setXY(k*4+i,q[0],q[1]))});uv.needsUpdate=true}
function mkJ(){
 const hasS=typeof skinM==='function',hasB=typeof bg==='function';
 const sm=(u,c)=>hasS?skinM(u||'',c):LM(c,0x1c1c1c);
 const gT=hasB?bg(.46,.7,.23,F.badan,8,12,4):new THREE.BoxGeometry(.46,.7,.23);
 let gH,mH;if(F.kepala&&hasB){gH=bg(.46,.46,.46,F.kepala,8,8,8);mH=sm(F.kepala,0xe0b48c)}else{gH=new THREE.BoxGeometry(.46,.46,.46);mH=LM(0xe0b48c,0x302820)}
 const root=new THREE.Group(),P=new THREE.Group(),H=new THREE.Group();root.add(P);
 const tm=new THREE.Mesh(gT,sm(F.badan,0xe4e8ee));tm.position.y=.35;P.add(tm);
 H.position.y=.7;P.add(H);const hm=new THREE.Mesh(gH,mH);hm.position.y=.23;H.add(hm);
 const limb=(url,col)=>{const m=sm(url,col),g=new THREE.Group(),gu=new THREE.BoxGeometry(.23,.35,.23),gl=new THREE.BoxGeometry(.23,.35,.23);
  if(url&&hasB){halfUV(gu,4,12,4,0);halfUV(gl,4,12,4,1)}
  const mu=new THREE.Mesh(gu,m);mu.position.y=-.175;g.add(mu);
  const k=new THREE.Group();k.position.y=-.35;g.add(k);const ml=new THREE.Mesh(gl,m);ml.position.y=-.175;k.add(ml);root.add(g);return{g:g,k:k}};
 return{root:root,P:P,H:H,arms:[limb(F.tanganKiri,0xe0b48c),limb(F.tanganKanan,0xe0b48c)],legs:[limb(F.kakiKiri,0x3d4452),limb(F.kakiKanan,0x3d4452)]}}
// IK dua tulang (panjang atas = bawah = .35). s=bahu/pinggul, t=target tangan/kaki, pole=arah tekukan siku/lutut. Semua koordinat dunia.
function setLimb(l,s,t,pole){
 const u=t.clone().sub(s);let d=Math.min(u.length(),.699);if(d<.06)d=.06;u.normalize();
 const a=d/2,h=Math.sqrt(Math.max(0,.1225-a*a)),pp=pole.clone();pp.addScaledVector(u,-pp.dot(u));if(pp.lengthSq()<1e-6)pp.set(0,0,1);pp.normalize();
 const e=s.clone().addScaledVector(u,a).addScaledVector(pp,h),w=s.clone().addScaledVector(u,d);
 const q1=new Q().setFromUnitVectors(DOWN,e.clone().sub(s).normalize()),q2=new Q().setFromUnitVectors(DOWN,w.clone().sub(e).normalize());
 l.g.position.copy(s);l.g.quaternion.copy(q1);l.k.quaternion.copy(q1.clone().invert().multiply(q2))}
function limbSet(l,s,c){
 if(c.t)setLimb(l,s,c.t,c.p);
 else{l.g.position.copy(s);l.g.quaternion.copy(c.q).multiply(new Q().setFromAxisAngle(X,c.a));l.k.quaternion.setFromAxisAngle(X,c.b)}}
// o: {pel:V3 (pinggul), q:Quaternion badan, hx,hy,hz:kepala, arm:[fn(bahu)->cfg,fn],leg:[fn(pinggul)->cfg,fn]}  cfg = {t,p} (IK) atau {q,a,b} (engsel)
function pose(W,o){
 const P=W.P;P.position.copy(o.pel);P.quaternion.copy(o.q);P.updateMatrix();const m=P.matrix;
 W.H.position.set(0,.7,o.hz||0);W.H.rotation.set(o.hx||0,o.hy||0,0);
 for(let i=0;i<2;i++){const sh=new V3(i?.345:-.345,.7,0).applyMatrix4(m),hp=new V3(i?.115:-.115,0,0).applyMatrix4(m);
  limbSet(W.arms[i],sh,o.arm[i](sh));limbSet(W.legs[i],hp,o.leg[i](hp))}}
const qYaw=a=>new Q().setFromAxisAngle(new V3(0,1,0),a),qX=a=>new Q().setFromAxisAngle(X,a);

// ---------- Vespa merah (depan = -Z) ----------
function mkVespa(){
 const g=new THREE.Group();g.rotation.order='YXZ';
 const RED=LM(0xc4161c,0x300506),CH=LM(0xd8dce0,0x303236),BK=LM(0x16161a,0x050506),TIRE=LM(0x0c0c0e,0),CRM=LM(0xe8c06a,0x302008);
 const B=(par,w,h,d,m,x,y,z)=>bx(par,w,h,d,m,x,y,z);
 // bodi
 B(g,.4,.04,.56,RED,0,.18,-.14);B(g,.012,.02,.5,CH,-.2,.205,-.14);B(g,.012,.02,.5,CH,.2,.205,-.14);
 B(g,.34,.3,.3,RED,0,.42,.5);B(g,.33,.22,.62,RED,0,.5,.31);B(g,.36,.13,.3,RED,0,.3,.56);
 B(g,.34,.07,.55,BK,0,.625,.175);B(g,.3,.03,.5,LM(0x2a2a30,0x08080a),0,.66,.175);
 B(g,.2,.12,.06,LM(0xff2a2a,0x801010),0,.55,.67);B(g,.08,.08,.3,CH,.2,.24,.5);
 const sh=B(g,.36,.75,.05,RED,0,.56,-.36);sh.rotation.x=.15;
 B(g,.09,.5,.05,RED,0,.45,-.52).rotation.x=.12;
 // kemudi + roda depan (berputar saat belok): pivot di (0,0,-.45)
 const steer=new THREE.Group();steer.position.set(0,0,-.45);g.add(steer);
 B(steer,.64,.035,.035,CH,0,1.02,.05);B(steer,.11,.05,.05,BK,-.31,1.02,.05);B(steer,.11,.05,.05,BK,.31,1.02,.05);
 B(steer,.26,.2,.2,RED,0,.97,.08);B(steer,.04,.5,.04,CH,0,.78,-.0);
 const lamp=B(steer,.18,.14,.05,BM(0xfff2c8),0,.96,-.05);B(steer,.22,.18,.06,CH,0,.96,-.02);
 B(steer,.015,.16,.015,CH,-.3,1.1,.03);B(steer,.015,.16,.015,CH,.3,1.1,.03);B(steer,.1,.065,.014,LM(0xbfd0e6,0x20242a),-.3,1.2,.03);B(steer,.1,.065,.014,LM(0xbfd0e6,0x20242a),.3,1.2,.03);
 B(steer,.04,.4,.04,CH,-.07,.42,-.15);B(steer,.04,.4,.04,CH,.07,.42,-.15);B(steer,.14,.045,.3,RED,0,.45,-.15);
 const mkWheel=z=>{const w=new THREE.Group();w.position.set(0,.19,z);
  const t=new THREE.CylinderGeometry(.19,.19,.09,18);t.rotateZ(PI/2);w.add(new THREE.Mesh(t,TIRE));
  const r=new THREE.CylinderGeometry(.125,.125,.095,12);r.rotateZ(PI/2);w.add(new THREE.Mesh(r,CH));
  for(let i=0;i<3;i++){const s=bx(w,.1,.02,.23,BK,0,0,0);s.rotation.x=i*PI/3}return w};
 const fw=mkWheel(-.15);steer.add(fw);const rw=mkWheel(.58);g.add(rw);
 // lampu depan (cahaya + berkas)
 const hl=new THREE.PointLight(0xfff0cc,.9,7);hl.position.set(0,1,-.5);g.add(hl);
 const bm=new THREE.Mesh(new THREE.ConeGeometry(.9,3.6,14,1,true),new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.06,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 bm.geometry.rotateX(-PI/2);bm.geometry.translate(0,0,-1.8);bm.position.set(0,.96,-.55);g.add(bm);
 return{g:g,steer:steer,fw:fw,rw:rw}}
const wpt=(V,x,y,z)=>V.g.localToWorld(new V3(x,y,z));

// ---------- pose duduk di Vespa (pinggul di jok, tangan lurus ke stang, lutut bengkok, kaki di papan pijak) ----------
function seatedOpts(V,t,vib){
 V.g.updateMatrixWorld(true);const sq=new Q().setFromRotationMatrix(V.g.matrixWorld),lean=.12;
 const hip=wpt(V,0,.775+(vib?Math.sin(t*47)*.002:0),.15),gr=[V.steer.localToWorld(new V3(-.31,1.02,.05)),V.steer.localToWorld(new V3(.31,1.02,.05))],
  fo=[wpt(V,-.17,.215,-.06),wpt(V,.17,.215,-.06)],dr=(x,y,z)=>new V3(x,y,z).applyQuaternion(sq);
 return{pel:hip,q:sq.clone().multiply(qX(-lean)),hx:lean+Math.sin(t*.8)*.02,hy:Math.sin(t*.5)*.08,
  arm:[0,1].map(i=>sh=>({t:gr[i],p:dr(i?.7:-.7,-.9,.1)})),leg:[0,1].map(i=>hp=>({t:fo[i],p:dr(i?.25:-.25,.35,-1)})),sq:sq,gr:gr,fo:fo,dr:dr,hip:hip}}

// =====================================================================
// PANGGUNG 'jalan' - jalan hutan malam, tiang lampu tiap 10 m
// =====================================================================
const PER=80,SPD=9;let RD=null,WANDIH=null,VESPA=null;
function sharedActors(){if(!WANDIH){WANDIH=mkJ();const nk=bx(WANDIH.H,.26,.24,.26,LM(0xe0b48c,0x302010),0,-.04,.17);nk.visible=false;WANDIH.neck=nk}if(!VESPA)VESPA=mkVespa();WANDIH.neck.visible=false}
function envRoad(){
 if(RD)return RD;
 const sc=new THREE.Scene(),fogC=0x06090f;sc.background=new THREE.Color(fogC);sc.fog=new THREE.Fog(fogC,7,62);
 sc.add(new THREE.AmbientLight(0x35466e,.8));const mo=new THREE.DirectionalLight(0x8aa4e0,.55);mo.position.set(-12,22,10);sc.add(mo);
 const gp=new THREE.Mesh(new THREE.PlaneGeometry(400,500),LM(0x16281a,0x050a06));gp.rotation.x=-PI/2;gp.position.y=-.01;sc.add(gp);
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(8,500),LM(0x2c2a22,0x0a0908));sh.rotation.x=-PI/2;sh.position.y=.004;sc.add(sh);
 const rd=new THREE.Mesh(new THREE.PlaneGeometry(5.2,500),LM(0x2a2c32,0x0a0a0c));rd.rotation.x=-PI/2;rd.position.y=.01;sc.add(rd);
 // langit: bintang + bulan
 const r0=rng(5),sp=[];for(let i=0;i<220;i++){const a=r0()*PI*2,e=.15+r0()*1.2,R=190;sp.push(Math.cos(a)*Math.cos(e)*R,Math.sin(e)*R*.9+10,Math.sin(a)*Math.cos(e)*R)}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
 const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false}));sc.add(stars);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(6,16,12),new THREE.MeshBasicMaterial({color:0xeaf0ff,fog:false}));moon.position.set(-70,60,-150);sc.add(moon);
 // bahan & geometri bersama
 const G={trunk:new THREE.CylinderGeometry(.12,.2,2.6,6),c1:new THREE.ConeGeometry(1.45,3.2,7),c2:new THREE.ConeGeometry(1.05,2.6,7),bush:new THREE.SphereGeometry(.7,6,5),
  pole:new THREE.CylinderGeometry(.08,.11,5.4,6),arm:new THREE.BoxGeometry(1.3,.08,.08),head:new THREE.BoxGeometry(.5,.1,.26),bulb:new THREE.SphereGeometry(.13,8,6),
  pool:new THREE.CircleGeometry(3,20),beam:new THREE.ConeGeometry(2.4,5.2,16,1,true),dash:new THREE.BoxGeometry(.12,.012,2),edge:new THREE.BoxGeometry(.08,.012,PER)};
 G.trunk.translate(0,1.3,0);G.c1.translate(0,3.6,0);G.c2.translate(0,5.4,0);G.bush.translate(0,.3,0);G.pole.translate(0,2.7,0);G.arm.translate(-.6,5.4,0);G.head.translate(-1.15,5.32,0);G.bulb.translate(-1.15,5.22,0);
 G.pool.rotateX(-PI/2);G.pool.translate(-1.15,.03,0);G.beam.translate(-1.15,2.6,0);
 const M={trunk:LM(0x3a2a1e,0x080604),leaf:LM(0x1a3a22,0x040a05),leaf2:LM(0x214a2a,0x050c06),bush:LM(0x224528,0x050c06),pole:LM(0x4a4e56,0x0c0d10),bulb:new THREE.MeshBasicMaterial({color:0xffe6a8}),
  pool:new THREE.MeshBasicMaterial({color:0xffb060,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false}),
  beam:new THREE.MeshBasicMaterial({color:0xffc880,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),
  dash:new THREE.MeshBasicMaterial({color:0xd8d8c0}),edge:new THREE.MeshBasicMaterial({color:0x9a9a90})};
 const poleZ=[];for(let i=0;i<8;i++)poleZ.push(-5-10*i); // tiang tiap 10 m
 const chunks=[];
 for(let k=0;k<3;k++){
  const ch=new THREE.Group(),r=rng(11),d=new THREE.Object3D(),NT=130,NB=170;
  const mk=(geo,mat,n)=>{const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;ch.add(m);return m};
  const tr=mk(G.trunk,M.trunk,NT),c1=mk(G.c1,M.leaf,NT),c2=mk(G.c2,M.leaf2,NT),bu=mk(G.bush,M.bush,NB);
  for(let i=0;i<NT;i++){const sd=i%2?1:-1,x=sd*(4.8+Math.pow(r(),1.5)*26),z=-r()*PER,s=.8+r()*.9;d.position.set(x,0,z);d.rotation.set(0,r()*6.28,0);d.scale.set(s,s*(.9+r()*.4),s);d.updateMatrix();tr.setMatrixAt(i,d.matrix);c1.setMatrixAt(i,d.matrix);c2.setMatrixAt(i,d.matrix)}
  for(let i=0;i<NB;i++){const sd=i%2?1:-1,x=sd*(3.4+r()*10),z=-r()*PER,s=.5+r()*.8;d.position.set(x,0,z);d.rotation.set(0,r()*6.28,0);d.scale.set(s*(1+r()*.5),s*.8,s);d.updateMatrix();bu.setMatrixAt(i,d.matrix)}
  const np=poleZ.length,pm=mk(G.pole,M.pole,np),am=mk(G.arm,M.pole,np),hm=mk(G.head,M.pole,np),bm=mk(G.bulb,M.bulb,np),plm=mk(G.pool,M.pool,np),bem=mk(G.beam,M.beam,np);
  for(let i=0;i<np;i++){d.position.set(3.3,0,poleZ[i]);d.rotation.set(0,0,0);d.scale.set(1,1,1);d.updateMatrix();[pm,am,hm,bm,plm,bem].forEach(m=>m.setMatrixAt(i,d.matrix))}
  const dm=mk(G.dash,M.dash,16);for(let i=0;i<16;i++){d.position.set(0,.012,-2.5-5*i);d.updateMatrix();dm.setMatrixAt(i,d.matrix)}
  for(const sx of[-2.45,2.45]){const e=new THREE.Mesh(G.edge,M.edge);e.position.set(sx,.012,-PER/2);ch.add(e)}
  sc.add(ch);chunks.push(ch)}
 const lights=[];for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffc070,1.25,15);sc.add(l);lights.push(l)}
 const sh0={p:[2.4,1.25,-.2],l:[0,.95,.1],f:44},sh1={p:[.9,1.75,3.3],l:[0,1.15,-2],f:48},sh2={p:[-1.5,.95,-3.4],l:[0,1.1,0],f:46},sh3={p:[2.9,2.7,2.3],l:[0,.8,-.6],f:46};
 RD={scene:sc,chunks:chunks,lights:lights,poleZ:poleZ,shots:{kiri:sh0,belakang:sh1,depan:sh2,atas:sh3},d:0};
 return RD}
function stJalan(){
 sharedActors();const E=envRoad(),sc=E.scene;A.setScene(sc);
 sc.add(WANDIH.root);sc.add(VESPA.g);VESPA.g.position.set(0,0,0);VESPA.g.rotation.set(0,0,0);VESPA.steer.rotation.set(0,0,0);E.d=0;
 return{shots:E.shots,
  tick:function(t,dt){
   E.d+=SPD*dt;const m=E.d%PER;E.chunks.forEach((c,k)=>{c.position.z=m+PER-k*PER});
   VESPA.fw.rotation.x-=dt*26;VESPA.rw.rotation.x-=dt*26;
   VESPA.g.rotation.z=Math.sin(t*.6)*.012;VESPA.g.position.y=Math.abs(Math.sin(t*23))*.004;VESPA.steer.rotation.y=Math.sin(t*.45)*.05;
   pose(WANDIH,seatedOpts(VESPA,t,true));
   // lampu jalan: 4 tiang terdekat diberi cahaya
   const L=[];E.chunks.forEach(c=>E.poleZ.forEach(z=>L.push(c.position.z+z)));L.sort((a,b)=>Math.abs(a)-Math.abs(b));
   E.lights.forEach((l,i)=>l.position.set(2.15,5,L[i]));
   // kamera ikut bergoyang halus
   const s=E.shots;s.kiri.p[1]=1.25+Math.sin(t*.5)*.05;s.belakang.p[0]=.9+Math.sin(t*.4)*.35;s.depan.p[0]=-1.5+Math.sin(t*.35)*.3;s.atas.p[2]=2.3+Math.sin(t*.3)*.5},
  onScene:function(){}}}

// =====================================================================
// PANGGUNG 'rumah' - Wandih tiba & parkir di halaman rumah (rumah batu), rumah tetangga modern di sebelahnya
// =====================================================================
let HM=null;
function stoneTex(){return cvTex(128,128,(g,w,h)=>{g.fillStyle='#4d463f';g.fillRect(0,0,w,h);const r=rng(3),pal=['#9a8f82','#7c7266','#a89c8c','#6e655b','#b0a495','#8b8074'];
 for(let y=0;y<h;y+=16){let x=-((y/16)%2)*12;while(x<w){const bw=18+(r()*22|0);g.fillStyle=pal[r()*pal.length|0];g.fillRect(x+1,y+1,bw-2,14);x+=bw}}})}
function tileTex(){return cvTex(128,128,(g,w,h)=>{g.fillStyle='#6b2e14';g.fillRect(0,0,w,h);const r=rng(9),pal=['#c4622d','#b5552a','#d0703a','#a94b24','#cc6a33'];
 for(let y=0;y<h;y+=16){const o=(y/16)%2?16:0;for(let x=-16;x<w;x+=32){g.fillStyle=pal[r()*pal.length|0];g.fillRect(x+o+1,y+1,30,14)}}})}
function rep(t,rx,ry,emi){const c=t.clone();c.wrapS=c.wrapT=THREE.RepeatWrapping;c.repeat.set(rx,ry);c.needsUpdate=true;return new THREE.MeshLambertMaterial({map:c,emissive:emi||0x0c0b09})}
function gable(par,cx,cy,cz,span,len,rise,along,tm,wm){ // atap pelana: along='x' (bubungan searah x) / 'z'
 const ov=.35,ang=Math.atan2(rise,span/2),sl=Math.hypot(span/2+ov,rise+ov*Math.tan(ang)),eh=ov*Math.tan(ang);
 for(const sd of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(along==='x'?len+ov*2:sl,.12,along==='x'?sl:len+ov*2),tm);
  const hx=sd*(span/4+ov/2),hy=cy+rise/2-eh/2;
  if(along==='x'){m.position.set(cx,hy,cz+hx);m.rotation.x=sd*ang}else{m.position.set(cx+hx,hy,cz);m.rotation.z=-sd*ang}par.add(m)}
 const sh=new THREE.Shape();sh.moveTo(-span/2,0);sh.lineTo(span/2,0);sh.lineTo(0,rise);sh.lineTo(-span/2,0);
 for(const sd of[-1,1]){const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),wm);
  if(along==='x'){m.rotation.y=PI/2;m.position.set(cx+sd*len/2,cy,cz)}else{m.position.set(cx,cy,cz+sd*len/2)}par.add(m)}}
function win(par,x,y,z,w,h,ry,gc){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry||0;par.add(g);const GR=LM(0x4f7a2a,0x0c1406);
 bx(g,w+.16,h+.16,.08,GR,0,0,0);bx(g,w,h,.09,BM(gc||0xffd890),0,0,0);bx(g,w,.05,.11,GR,0,0,0);bx(g,.05,h,.11,GR,0,0,0);bx(g,w+.3,.07,.22,LM(0xb0a698,0x14120f),0,-h/2-.1,.05);return g}
function fenceRun(par,x0,z0,x1,z1,col,pk,thin){
 const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),g=new THREE.Group();g.position.set(x0,0,z0);g.rotation.y=Math.atan2(-dz,dx);par.add(g);
 const m=LM(col,0x0a0604);bx(g,len,.07,.045,m,len/2,.3,0);bx(g,len,.07,.045,m,len/2,.75,0);
 const np=Math.max(2,Math.round(len/1.6)+1);for(let i=0;i<np;i++)bx(g,.11,1.05,.11,m,len*i/(np-1),.52,0);
 const gap=pk?.17:.12,n=Math.floor(len/gap),im=new THREE.InstancedMesh(new THREE.BoxGeometry(thin?.025:.09,pk?.9:.95,.03),m,n),d=new THREE.Object3D();
 for(let i=0;i<n;i++){d.position.set(gap*(i+.5),.47,.04);d.updateMatrix();im.setMatrixAt(i,d.matrix)}im.frustumCulled=false;g.add(im);return g}
function mkTree(par,x,z,s,leaf){const m=LM(0x3a2a1e,0x080604);bx(par,.28*s,2*s,.28*s,m,x,s,z);
 const l=new THREE.Mesh(new THREE.SphereGeometry(1.2*s,8,6),LM(leaf||0x1f4a2a,0x050c06));l.position.set(x,2.5*s,z);l.scale.y=.85;par.add(l)}
function mkBush(par,x,z,s,col){const b=new THREE.Mesh(new THREE.SphereGeometry(.55*s,7,5),LM(col||0x24502c,0x050c06));b.position.set(x,.35*s,z);b.scale.y=.75;par.add(b)}
function pad(par,w,d,x,z,col){bx(par,w,.04,d,col||0x8a8d92,x,.04,z)}
function envHome(){
 if(HM)return HM;
 const sc=new THREE.Scene(),fogC=0x070b16;sc.background=new THREE.Color(fogC);sc.fog=new THREE.Fog(fogC,18,95);
 sc.add(new THREE.AmbientLight(0x3a4a78,.85));const mo=new THREE.DirectionalLight(0x93aee8,.7);mo.position.set(-8,20,22);sc.add(mo);
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(260,200),LM(0x1a2e1e,0x060c07));gr.rotation.x=-PI/2;sc.add(gr);
 // jalan, trotoar
 bx(sc,200,.04,5.2,0x25272c,0,.02,0);bx(sc,200,.08,2,0x74777e,0,.04,-3.6);bx(sc,200,.1,.15,0x8e9197,0,.05,-2.55);bx(sc,200,.08,2,0x74777e,0,.04,3.6);
 {const dm=new THREE.InstancedMesh(new THREE.BoxGeometry(2,.012,.12),new THREE.MeshBasicMaterial({color:0xd8d8c0}),40),d=new THREE.Object3D();for(let i=0;i<40;i++){d.position.set(-98+i*5,.045,0);d.updateMatrix();dm.setMatrixAt(i,d.matrix)}dm.frustumCulled=false;sc.add(dm)}
 const sk=new THREE.BufferGeometry(),r0=rng(21),sp=[];for(let i=0;i<200;i++){const a=r0()*PI*2,e=.2+r0()*1.1;sp.push(Math.cos(a)*Math.cos(e)*180,Math.sin(e)*150+10,Math.sin(a)*Math.cos(e)*180-60)}
 sk.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sc.add(new THREE.Points(sk,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false})));
 // ---- RUMAH WANDIH (batu + genteng oranye + kusen hijau) di (-6,0,-13), menghadap +z ----
 const H1=new THREE.Group();H1.position.set(-6,0,-13);sc.add(H1);
 const wall=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),rep(stoneTex(),w/1.6,h/1.6));m.position.set(x,y,z);H1.add(m);return m};
 const SW=rep(stoneTex(),3,2),TM=()=>rep(tileTex(),4,2,0x120804);
 wall(8,3.2,5.6,0,1.6,-2.9);gable(H1,0,3.2,-2.9,5.6,8,1.9,'x',TM(),SW);
 wall(3.4,3.2,2.6,2.3,1.6,.9);gable(H1,2.3,3.2,.9,3.4,2.6,1.6,'z',TM(),SW);   // sayap depan (atap silang)
 wall(2.4,2.2,3,-5.2,1.1,-1.2);                                                // tambahan kiri (atap miring)
 {const m=new THREE.Mesh(new THREE.BoxGeometry(2.9,.12,3.4),TM());m.position.set(-5.2,2.55,-1.2);m.rotation.z=.16;H1.add(m)}
 {const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,1.7),TM());m.position.set(-1.6,2.6,.8);m.rotation.x=.38;H1.add(m)}  // atap teras di atas pintu
 bx(H1,.12,2.2,.12,0x4f7a2a,-2.7,1.3,1.5);bx(H1,.12,2.2,.12,0x4f7a2a,-.5,1.3,1.5);
 for(const c of[[-1.2,4.6,-2.2],[2.5,4.4,-3.4]]){const m=new THREE.Mesh(new THREE.BoxGeometry(.8,1.5,.8),rep(stoneTex(),.6,1));m.position.set(c[0],c[1],c[2]);H1.add(m);bx(H1,.95,.1,.95,0x6a645a,c[0],c[1]+.78,c[2])}
 // pintu hijau + lampu teras
 bx(H1,1.05,2.2,.1,0x4f7a2a,-1.6,1.1,.04);bx(H1,.8,.8,.12,0x3f6420,-1.6,1.6,.05);bx(H1,.8,.8,.12,0x3f6420,-1.6,.65,.05);bx(H1,.08,.08,.14,0xc8a24a,-1.2,1.1,.1);
 bx(H1,.3,.18,.3,BM(0xffe0a0),-1.6,2.45,.95);bx(H1,1.5,.05,.9,0x7a6e60,-1.6,.05,.9);
 win(H1,1.1,1.8,.06,1.0,1.1,0);win(H1,-4.1,1.5,.5,.9,1.0,0);win(H1,3.5,1.6,2.22,.9,1.1,0);win(H1,2.3,1.6,.9+0,.01,.01,0).visible=false;
 win(H1,4.01,1.6,-1.8,.9,1.1,PI/2);win(H1,-6.41,1.2,-1.2,.9,.9,-PI/2);win(H1,1,1.5,-5.72,.9,1.1,PI);
 // halaman: rumput, jalur batu, pelataran parkir, bunga, semak, pohon
 bx(sc,13,.03,8.2,0x24402a,-5,.02,-8.7);
 for(let i=0;i<9;i++)bx(sc,1.1,.05,.55,0x8f8a80,-7.6,.05,-5.4-i*.85);
 pad(sc,2.2,3.4,-9.7,-8.3,0x7b7e84);pad(sc,2.6,1.6,-7.6,-12.2,0x7b7e84);
 for(let i=0;i<6;i++){bx(sc,.5,.18,.5,0x3a2a1e,-4.8+i*.6,.1,-11.9+(i%2)*.05);const f=new THREE.Mesh(new THREE.SphereGeometry(.16,6,5),LM([0xe04a6a,0xf0c040,0xd0d0ff][i%3],0x301010));f.position.set(-4.8+i*.6,.32,-11.9);sc.add(f)}
 mkBush(sc,-10.6,-5.9,1.2);mkBush(sc,-5.6,-5.8,1.1);mkBush(sc,-.9,-5.9,1.3,0x1d4a28);mkBush(sc,-10.7,-11.5,1.4);mkBush(sc,-.6,-11.2,1.2);mkTree(sc,-10.2,-10.2,1.1);
 // pagar kayu coklat (depan: ada celah gerbang di x=-7.6, samping kiri & kanan)
 fenceRun(sc,-11.5,-4.8,-8.7,-4.8,0x6b4423,1);fenceRun(sc,-6.5,-4.8,.5,-4.8,0x6b4423,1);fenceRun(sc,-11.5,-4.8,-11.5,-13,0x6b4423,1);fenceRun(sc,.5,-4.8,.5,-13,0x6b4423,1);
 bx(sc,.2,1.3,.2,0x5a3820,-8.75,.65,-4.8);bx(sc,.2,1.3,.2,0x5a3820,-6.45,.65,-4.8);
 {const g=new THREE.Group();g.position.set(-8.7,0,-4.8);g.rotation.y=-.9;sc.add(g);const m=LM(0x6b4423,0x0a0604);bx(g,1,.07,.04,m,.5,.3,0);bx(g,1,.07,.04,m,.5,.75,0);for(let i=0;i<6;i++)bx(g,.09,.9,.03,m,.08+i*.17,.47,.04)}
 bx(sc,.1,.9,.1,0x5a3820,-5.5,.45,-3.1);bx(sc,.32,.22,.22,0x2a3a6a,-5.5,.95,-3.1); // kotak pos
 // ---- RUMAH TETANGGA (modern 2 lantai, atap datar, tembok krem, pagar besi putih) di (8,0,-13) ----
 const H2=new THREE.Group();H2.position.set(8,0,-13);sc.add(H2);const CR=LM(0xe6e0d2,0x14120f),DK=LM(0x3a3f48,0x0a0b0d);
 bx(H2,7.4,3.2,5.6,CR,0,1.6,-2.8);bx(H2,5.2,2.9,5.6,CR,.8,4.65,-2.4);bx(H2,7.8,.22,6,DK,0,3.3,-2.8);bx(H2,5.6,.22,6,DK,.8,6.2,-2.4);
 bx(H2,2.6,2.3,.1,0x9a9ea6,-2.2,1.15,.04);for(let i=0;i<7;i++)bx(H2,2.6,.03,.12,0x6a6e76,-2.2,.3+i*.32,.05);
 bx(H2,3,.14,1.3,DK,2,3.0,.8);bx(H2,3,.7,.04,LM(0xcfd6e0,0x101214),2,3.45,1.42);                                     // balkon + pagar kaca
 bx(H2,2.2,2.1,.12,LM(0x4a4036,0x0a0806),2.4,1.05,.04);bx(H2,.08,.08,.14,0xd0d0d0,1.6,1.05,.1);
 const w2=(x,y,w,h,c)=>{bx(H2,w+.14,h+.14,.1,0x2a2e36,x,y,.04);bx(H2,w,h,.12,BM(c),x,y,.05)};
 w2(.8,4.7,1.6,1.5,0xffe7b0);w2(3,4.7,1.2,1.5,0x2a3a5a);w2(2.4,1.9,.01,.01,0);w2(-1.4,3.9,.01,.01,0);w2(.2,3.8,.01,.01,0);
 bx(H2,.14,2.1,.12,BM(0xffe7b0),-3.4,1.5,.03);
 fenceRun(sc,2.2,-4.8,15,-4.8,0xe8e8ec,0,1);fenceRun(sc,15,-4.8,15,-13,0xe8e8ec,0,1);fenceRun(sc,2.2,-4.8,2.2,-13,0xe8e8ec,0,1);
 pad(sc,4,6,6.8,-8,0x73767c);bx(sc,.9,.05,.5,0x8f8a80,8.8,.05,-6.6);
 mkBush(sc,3.3,-6,1.2,0x2f5a30);mkBush(sc,13.6,-6.2,1.1);mkTree(sc,13,-9,1.3,0x2b5a34);mkTree(sc,3.2,-10.5,.9,0x2b5a34);
 // pohon latar belakang
 for(let i=0;i<26;i++){const r=rng(40+i),x=-34+i*2.8+r()*2,z=-24-r()*14;mkTree(sc,x,z,1.5+r()*1.5,i%3?0x16341e:0x1e4228)}
 // lampu jalan (trotoar) + lampu teras
 const lamp=x=>{bx(sc,.14,5.2,.14,0x4a4e56,x,2.6,-2.9);bx(sc,1.1,.09,.09,0x4a4e56,x+.5,5.2,-2.9);bx(sc,.45,.1,.24,0x4a4e56,x+1,5.15,-2.9);bx(sc,.28,.08,.2,BM(0xffe6a8),x+1,5.08,-2.9)};
 lamp(-16);lamp(-2);lamp(16);
 const L1=new THREE.PointLight(0xffc070,1.15,17);L1.position.set(-15,4.9,-2.9);sc.add(L1);
 const L2=new THREE.PointLight(0xffc070,1.15,17);L2.position.set(-1,4.9,-2.9);sc.add(L2);
 const L3=new THREE.PointLight(0xffd8a0,.9,9);L3.position.set(-7.6,2.4,-11.6);sc.add(L3);
 HM={scene:sc,shots:{jalan:{p:[-17,1.6,4.6],l:[-12,.9,-1.3],f:46},lebar:{p:[1.8,4.4,9.5],l:[.5,2.2,-12],f:58},wandih:{p:[-6,1.7,-4.2],l:[-9.4,1.1,-8.5],f:44}}};
 return HM}
// lintasan: lurus -> belok kiri ke halaman -> gerbang -> S-curve ke pelataran parkir
function buildPath(){
 const pts=[],add=(x,z)=>pts.push([x,z]);
 for(let x=-26;x<-10.6;x+=.5)add(x,-1.3);
 for(let a=0;a<=90;a+=5){const r=a*PI/180;add(-10.6+3*Math.sin(r),-4.3+3*Math.cos(r))}
 for(let z=-4.8;z>-5.6;z-=.4)add(-7.6,z);
 const P0=[-7.6,-5.6],P1=[-7.6,-6.9],P2=[-9.7,-7.0],P3=[-9.7,-8.3];
 for(let i=1;i<=24;i++){const t=i/24,u=1-t,b0=u*u*u,b1=3*u*u*t,b2=3*u*t*t,b3=t*t*t;add(b0*P0[0]+b1*P1[0]+b2*P2[0]+b3*P3[0],b0*P0[1]+b1*P1[1]+b2*P2[1]+b3*P3[1])}
 const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 return{pts:pts,cum:cum,L:cum[cum.length-1],at:function(s){s=clamp(s,0,this.L);let i=1;while(i<cum.length-1&&cum[i]<s)i++;const k=(s-cum[i-1])/Math.max(1e-6,cum[i]-cum[i-1]),a=pts[i-1],b=pts[i],j=Math.min(pts.length-1,i+1),c=pts[Math.max(0,i-2)];
  const fx=pts[j][0]-c[0],fz=pts[j][1]-c[1];return{x:lerp(a[0],b[0],k),z:lerp(a[1],b[1],k),yaw:Math.atan2(-fx,-fz)}}}}
function stRumah(){
 sharedActors();const E=envHome();A.setScene(E.scene);E.scene.add(WANDIH.root);E.scene.add(VESPA.g);
 const PA=buildPath(),V=5.5,D=3.5,s1=PA.L-D,t1=s1/V,Tb=2*D/V,tEnd=t1+Tb,tDis=tEnd+.6,DIS=1.5,tWalk=tDis+DIS+.9;
 let off=false,yawPrev=null,roll=0,wheel=0,stSm=0;
 const park=PA.at(PA.L),stand=[[-10.3,-8.15],[-7.6,-9.6],[-7.6,-12.2]],walkLen=[Math.hypot(stand[1][0]-stand[0][0],stand[1][1]-stand[0][1]),Math.hypot(stand[2][0]-stand[1][0],stand[2][1]-stand[1][1])],WS=1.3;
 const shJ=E.shots.jalan,shL=E.shots.lebar,shW=E.shots.wandih;
 return{shots:E.shots,
  tick:function(t,dt){
   let s,v;if(t<t1){s=V*t;v=V}else if(t<tEnd){const k=t-t1;s=s1+V*k-V*k*k/(2*Tb);v=V*(1-k/Tb)}else{s=PA.L;v=0}
   const p=PA.at(s);VESPA.g.position.set(p.x,0,p.z);
   let dy=0;if(yawPrev!==null){dy=Math.atan2(Math.sin(p.yaw-yawPrev),Math.cos(p.yaw-yawPrev))/Math.max(dt,.001)}yawPrev=p.yaw;
   roll+=(clamp(dy*.1,-.2,.2)-roll)*Math.min(1,dt*6);stSm+=(clamp(dy*.16,-.4,.4)-stSm)*Math.min(1,dt*8);
   VESPA.g.rotation.set(0,p.yaw,roll);VESPA.steer.rotation.y=stSm;wheel+=v/.19*dt*.5;VESPA.fw.rotation.x=-wheel;VESPA.rw.rotation.x=-wheel;
   if(!off&&t>=tEnd){off=true;A.ambStop(MOTOR)}
   const so=seatedOpts(VESPA,t,v>.1);
   if(t<tDis){pose(WANDIH,so)}
   else{ // turun dari motor lalu berjalan ke pintu rumah
    const u=sstep((t-tDis)/DIS),yaw=p.yaw,sq=so.sq;
    const gpos=[wpt(VESPA,-.715,0,.12),wpt(VESPA,-.485,0,.12)],spos=wpt(VESPA,-.6,.7,.12);
    if(t<tDis+DIS){
     const pel=so.hip.clone().lerp(spos,u);pel.y+=.1*Math.sin(PI*u);
     pose(WANDIH,{pel:pel,q:sq.clone().multiply(qX(-.12*(1-u))),hx:.12*(1-u),hy:0,
      arm:[0,1].map(i=>sh=>({t:so.gr[i].clone().lerp(sh.clone().add(new V3(0,-.69,0)),u),p:so.dr(i?.7:-.7,-.9,.1)})),
      leg:[0,1].map(i=>hp=>({t:so.fo[i].clone().lerp(gpos[i],u).add(new V3(0,i?.28*Math.sin(PI*u):0,0)),p:so.dr(i?.25:-.25,.35,-1)}))})}
    else{
     const wt=Math.max(0,t-tWalk);let d=Math.min(wt*WS,walkLen[0]+walkLen[1]),px,pz,hd;
     if(d<walkLen[0]){const k=d/walkLen[0];px=lerp(stand[0][0],stand[1][0],k);pz=lerp(stand[0][1],stand[1][1],k);hd=Math.atan2(-(stand[1][0]-stand[0][0]),-(stand[1][1]-stand[0][1]))}
     else{const k=(d-walkLen[0])/walkLen[1];px=lerp(stand[1][0],stand[2][0],k);pz=lerp(stand[1][1],stand[2][1],k);hd=Math.atan2(-(stand[2][0]-stand[1][0]),-(stand[2][1]-stand[1][1]))}
     const mv=wt>0&&d<walkLen[0]+walkLen[1]-.01,ph=wt*WS*4.2,sw=mv?Math.sin(ph):0,yq=qYaw(hd+(mv?0:0));
     const sx0=wpt(VESPA,-.6,0,.12);const bx0=wt>0?px:sx0.x,bz0=wt>0?pz:sx0.z;
     const hdd=wt>0?hd:yaw,yq2=qYaw(hdd);
     pose(WANDIH,{pel:new V3(bx0,.7+Math.abs(sw)*.03,bz0),q:yq2,hx:0,hy:0,
      arm:[0,1].map(i=>()=>({q:yq2,a:(i?1:-1)*sw*.55,b:-.12*mv})),
      leg:[0,1].map(i=>()=>({q:yq2,a:(i?-1:1)*sw*.6,b:Math.max(0,(i?sw:-sw))*.7}))})}}
   // kamera
   const sx=VESPA.g.position.x,sz=VESPA.g.position.z;
   shJ.p[0]=sx-6.5;shJ.p[2]=4.6;shJ.l[0]=sx+.8;shJ.l[2]=sz;
   shW.l[0]=-9.4+(t>tWalk?Math.min(2,(t-tWalk)*.6):0);shW.l[2]=-8.5;
   shL.p[0]=1.8+Math.sin(t*.15)*.8},
  onScene:function(){}}}

// =====================================================================
// PANGGUNG 'tidur' - kamar malam, Wandih berbaring, selimut dinamis, Zzz
// =====================================================================
let BD=null;const BT=.44;
function blanketTexture(){
 const c=document.createElement('canvas');c.width=512;c.height=480;const g=c.getContext('2d');g.fillStyle='#3b5a9a';g.fillRect(0,0,512,480);
 g.fillStyle='rgba(255,255,255,.18)';for(let x=0;x<512;x+=64)g.fillRect(x,0,18,480);for(let y=0;y<480;y+=64)g.fillRect(0,y,512,18);
 g.strokeStyle='#d9a441';g.lineWidth=5;g.strokeRect(14,14,484,452);
 const t=new THREE.CanvasTexture(c);return t}
function bodyTop(x,z){ // tinggi permukaan tubuh (relatif ke permukaan kasur) untuk selimut: badan+kaki selebar .46, tinggi .23; jari kaki sedikit menonjol
 const dw=.2;let h=0;
 const part=(hx,z0,z1,ht)=>{const dx=Math.max(Math.abs(x)-hx,0),dz=Math.max(z0-z,z-z1,0),k=1-Math.hypot(dx,dz)/dw;if(k>0)h=Math.max(h,ht*sstep(k))};
 part(.23,-.95,.45,.23);part(.2,-.95,-.75,.27);return h}
function hang(a,edge,r){ // lengkung selimut yang menggantung di tepi kasur: a=jarak sepanjang kain, return {p:posisi, dy:turun}
 const a0=edge-r;if(a<=a0)return{p:a,dy:0};const q=PI*r/2;
 if(a<=a0+q){const th=(a-a0)/r;return{p:a0+r*Math.sin(th),dy:-r*(1-Math.cos(th))}}
 return{p:edge,dy:-r-(a-a0-q)}}
function buildBlanket(){
 const W=1.5,LZ=1.5,nx=70,nz=70,zTop=.15,bedHalf=.615,zEdge=zTop+1.115,pos=[],uv=[],idx=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const xp=(i/nx-.5)*W,zp=j/nz*LZ,sg=xp<0?-1:1,ax=Math.abs(xp),zn=zTop-zp,pr=bodyTop(xp,zn);
  const hx=hang(ax,bedHalf,.06),hz=hang(zp,zEdge-zTop,.06);
  const wr=(.010*Math.sin(zp*11+xp*4)+.006*Math.sin(xp*17-zp*5))*(.4+pr*3)+.014*Math.max(0,1-zp/.12);
  pos.push(sg*hx.p,pr+.014+wr+hx.dy+hz.dy,zTop-hz.p);uv.push(i/nx,1-j/nz)}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const tex=blanketTexture(),m=new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,emissive:0x0c0e14});
 if(BLANKET){new THREE.TextureLoader().load(BLANKET,t=>{t.anisotropy=4;m.map=t;m.needsUpdate=true},undefined,()=>{})}
 const mesh=new THREE.Mesh(g,m);mesh.position.y=BT;return mesh}
function zTex(){return cvTex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#dfe8ff';g.font='bold 54px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('Z',32,34)})}
function envBed(){
 if(BD)return BD;
 const sc=new THREE.Scene(),bgc=0x080b16;sc.background=new THREE.Color(bgc);
 sc.add(new THREE.AmbientLight(0x2c3a62,.8));
 const mo=new THREE.DirectionalLight(0x7f9be0,.6);mo.position.set(-10,6,0);sc.add(mo);
 const lamp=new THREE.PointLight(0xffb870,.9,6);lamp.position.set(.95,1.0,.8);sc.add(lamp);
 const fill=new THREE.PointLight(0x6a80c0,.55,8);fill.position.set(.3,2.3,-.2);sc.add(fill);
 const room=new THREE.Mesh(new THREE.BoxGeometry(5.6,2.8,4.6),new THREE.MeshLambertMaterial({color:0x2e3552,emissive:0x0a0c14,side:THREE.BackSide}));room.position.set(0,1.4,-.3);sc.add(room);
 bx(sc,5.6,.06,4.6,LM(0x4a3524,0x0c0804),0,.03,-.3);
 const WD=LM(0x5a3b22,0x0c0804);
 bx(sc,1.3,.28,2.34,WD,0,.14,0);bx(sc,1.2,.16,2.2,LM(0xd9dde8,0x14161c),0,.36,0);bx(sc,1.3,.95,.08,WD,0,.72,1.2);bx(sc,1.3,.5,.06,WD,0,.5,-1.17);
 bx(sc,.45,.5,.4,WD,.98,.25,.85);bx(sc,.1,.22,.1,0xd0d0d0,.98,.61,.85);const sh=new THREE.Mesh(new THREE.ConeGeometry(.16,.2,10,1,true),LM(0xffd9a0,0x806030));sh.material.side=THREE.DoubleSide;sh.position.set(.98,.78,.85);sc.add(sh);
 // jendela + bulan + tirai (dinding kiri)
 bx(sc,.06,1.2,1.4,0x2a1c10,-2.78,1.6,-.3);const wn=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.1),new THREE.MeshBasicMaterial({color:0x1e3270}));wn.rotation.y=PI/2;wn.position.set(-2.74,1.6,-.3);sc.add(wn);
 const mn=new THREE.Mesh(new THREE.CircleGeometry(.14,16),new THREE.MeshBasicMaterial({color:0xeaf0ff}));mn.rotation.y=PI/2;mn.position.set(-2.73,1.85,-.55);sc.add(mn);
 bx(sc,.05,1.3,.4,LM(0x6a2a3a,0x120608),-2.7,1.6,.55);bx(sc,.05,1.3,.4,LM(0x6a2a3a,0x120608),-2.7,1.6,-1.15);
 // bantal (elipsoid)
 const pil=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),LM(0xeceff8,0x1a1c22));pil.scale.set(.36,.08,.26);pil.position.set(0,BT,.7);sc.add(pil);
 const blanket=buildBlanket();sc.add(blanket);
 // efek Zzz
 const zs=[];for(let i=0;i<3;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:zTex(),transparent:true,depthWrite:false,fog:false}));sp.visible=false;sc.add(sp);zs.push(sp)}
 BD={scene:sc,blanket:blanket,zs:zs,shots:{samping:{p:[1.95,1.55,-.55],l:[0,.7,.2],f:46},kaki:{p:[-.7,1.35,-2.15],l:[0,.6,.35],f:46},atas:{p:[.55,2.5,-.3],l:[0,.5,.15],f:46}}};
 return BD}
function stTidur(){
 sharedActors();const E=envBed();A.setScene(E.scene);E.scene.add(WANDIH.root);
 WANDIH.neck.visible=true;const qLie=qX(PI/2),pel=new V3(0,BT+.115,-.25);
 return{shots:E.shots,
  tick:function(t,dt){
   const br=Math.sin(t*1.3),d=Math.sin(t*.9);
   pose(WANDIH,{pel:pel,q:qLie,hz:-.195,hx:0,hy:.12+Math.sin(t*.4)*.02,
    arm:[0,1].map(i=>()=>({t:new V3(i?.07:-.07,.78+.006*br,.25),p:new V3(i?.8:-.8,-.3,-.45)})),
    leg:[0,1].map(i=>()=>({q:qLie.clone().multiply(new Q().setFromAxisAngle(new V3(0,0,1),i?-.07:.07)),a:0,b:0}))});
   // Zzz melayang naik dari kepala
   E.zs.forEach((z,i)=>{const life=3.6,k=((t+i*life/3)%life)/life,a=Math.sin(PI*k);z.visible=true;z.material.opacity=a*.9;
    z.position.set(.05+k*.55,1.25+k*.75,.7+k*.35);const s=.14+k*.3;z.scale.set(s,s,1)});
   const sh=E.shots;sh.samping.p[2]=-.55+Math.sin(t*.25)*.25;sh.kaki.p[0]=-.7+Math.sin(t*.2)*.2;sh.atas.p[0]=.55+Math.sin(t*.22)*.25},
  onScene:function(){}}}

CUT3D.add('jalan',stJalan);CUT3D.add('rumah',stRumah);CUT3D.add('tidur',stTidur);
})();
