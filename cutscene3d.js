// =====================================================================
// CUTSCENE 3D - MIDNIGHT LAB..
// Adegan cerita dengan tokoh balok (Wandih, Guru, El Kalla, Oni) yang beranimasi,
// kamera sinematik, dan dialog antar tokoh. Dimuat SETELAH game.js.
//
// Panggung memakai ruang pertama (dinding kuning) lab komputer yang SAMA dengan yang dimainkan
// (scene game dirender dengan kamera cutscene), jadi bentuk ruangan, meja, kursi, dan lampu otomatis sama.
//
// Cara pakai di cerita.js: tambahkan field ke adegan:
//   stage : 'hukuman' (guru marah, di ruang pertama sore hari)
//           'lab'     (tengah malam, lampu berkedip, El Kalla & Oni)
//           'telepon' (Wandih menelpon di tempat pemain menyelesaikan soal)
//           'kantor'  (Guru di meja kerja memegang HP)
//   cam   : nama sudut kamera (lihat SHOTS tiap panggung di bawah)
//   who   : 'WANDIH' / 'GURU' (pembicara; kepalanya mengangguk saat teks diketik)
//   anim  : {GURU:'marah', WANDIH:'takut'}  (lihat daftar ANIM)
//   go    : {GURU:[[3.5,12],[5,12]]}  (jalan ke titik-titik x,z)
//   at    : {WANDIH:[-2.75,11.5]}  (langsung pindah ke titik x,z)
//   look  : {WANDIH:'GURU'} atau {WANDIH:[x,z]}  (arah hadap)
//   spd   : kecepatan jalan (m/s, bawaan 1.4)
//   pan   : true = kamera bergeser halus ke sudut baru (bawaan: potong langsung)
//   kalla : 'creep' = (panggung 'lab') tiap lampu padam muncul SATU hantu samar (opacity 30%),
//           bergantian El Kalla lalu Oni, makin dekat
//   keep  : true = hantu tidak diulang dari awal (lanjutan adegan 'creep' sebelumnya)
// Kalau terjadi error, adegan otomatis memakai sv/img seperti biasa.
// =====================================================================
(function(){
'use strict';
if(typeof THREE==='undefined'||typeof sVis!=='function'||typeof endS!=='function'||typeof S==='undefined'||typeof R==='undefined'||typeof C==='undefined'||typeof exitDoors==='undefined'||typeof ls==='undefined')return;
const origVis=sVis,origEnd=endS,$$=id=>document.getElementById(id);
const F=typeof SKIN_FULL!=='undefined'?SKIN_FULL:{};
const FACE=typeof FACE_URL!=='undefined'?FACE_URL:'',FACE2=typeof FACE_URL2!=='undefined'?FACE_URL2:'';
const PI=Math.PI,V3=THREE.Vector3;
const CUT={on:false,scene:null};
const CC=new THREE.PerspectiveCamera(50,16/9,.05,60);
let stage=null,stageName='',actors={},curShotName='',curSh=null,curSc=null,camRate=10,camF=50,shake=0,snapCam=true,T=0,shotT=0,last=0,worldOn=false,SAVE=null;
const camP=new V3(),camL=new V3(),tP=new V3(),tL=new V3();
const lerpAng=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;

// ---------- helper bahan & bentuk ----------
const LM=(c,e)=>new THREE.MeshLambertMaterial({color:c,emissive:e===undefined?0:e});
const BM=c=>new THREE.MeshBasicMaterial({color:c});
function bx(par,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='number'?LM(m):m);o.position.set(x,y,z);par.add(o);return o}
function cvTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,w,h);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}

// ---------- wajah ber-ekspresi (digambar lewat kode, gaya pixel) ----------
function faceTex(o,expr){return cvTex(64,64,g=>{
 g.fillStyle=o.skin;g.fillRect(0,0,64,64);
 g.fillStyle=o.hair;g.fillRect(0,0,64,14);g.fillRect(0,0,6,24);g.fillRect(58,0,6,24);
 [[14,30],[40,30]].forEach(p=>{g.fillStyle='#fff';g.fillRect(p[0],p[1],10,8);g.fillStyle='#1a1208';
  if(expr==='takut')g.fillRect(p[0]+3,p[1]+1,4,6);else g.fillRect(p[0]+3,p[1]+2,5,6)});
 g.fillStyle=o.hair;
 if(expr==='marah'){g.fillRect(12,22,5,3);g.fillRect(17,24,4,3);g.fillRect(21,26,4,3);g.fillRect(47,22,5,3);g.fillRect(43,24,4,3);g.fillRect(39,26,4,3)}
 else if(expr==='takut'){g.fillRect(14,20,10,2);g.fillRect(40,20,10,2)}
 else{g.fillRect(12,25,12,3);g.fillRect(40,25,12,3)}
 if(o.must){g.fillStyle=o.hair;g.fillRect(20,46,24,5)}
 g.fillStyle='#4a1010';
 if(expr==='marah'){g.fillRect(24,52,16,7);g.fillStyle='#fff';g.fillRect(26,52,12,2)}
 else if(expr==='takut'){g.fillRect(28,50,8,9)}
 else g.fillRect(26,54,12,2)})}
function headSet(o){
 const cache={},mk=e=>cache[e]||(cache[e]=faceTex(o,e));
 const side=cvTex(8,8,g=>{g.fillStyle=o.skin;g.fillRect(0,0,8,8);g.fillStyle=o.hair;g.fillRect(0,0,8,3)});
 const sM=new THREE.MeshLambertMaterial({map:side,emissive:0x151515});
 const top=new THREE.MeshLambertMaterial({color:new THREE.Color(o.hair),emissive:0x0a0a0a});
 const bot=new THREE.MeshLambertMaterial({color:new THREE.Color(o.skin),emissive:0x151515});
 const front=new THREE.MeshLambertMaterial({map:mk('normal'),emissive:0x202020});
 return{mH:[sM,sM,top,bot,top,front],setExpr:e=>{front.map=mk(e);front.needsUpdate=true}}}

// ---------- rangka tokoh (kotak ala Minecraft; depan = -Z) ----------
function mkRig(o){
 const root=new THREE.Group();root.rotation.order='YXZ';const rig={root};
 const torso=new THREE.Mesh(o.gT||new THREE.BoxGeometry(.46,.7,.23),o.mT);torso.position.y=1.05;root.add(torso);
 const limb=(x,y,g,m,hand)=>{const p=new THREE.Group();p.position.set(x,y,0);const q=new THREE.Mesh(g||new THREE.BoxGeometry(.23,.7,.23),m);q.position.y=-.35;p.add(q);
  if(hand){const h=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.2),hand);h.position.y=-.64;p.add(h)}root.add(p);return p};
 rig.armL=limb(-.345,1.4,o.gAL,o.mAL,o.hand);rig.armR=limb(.345,1.4,o.gAR,o.mAR,o.hand);
 rig.legL=limb(-.115,.7,o.gLL,o.mLL);rig.legR=limb(.115,.7,o.gLR,o.mLR);
 const hp=new THREE.Group();hp.position.y=1.4;root.add(hp);
 const h=new THREE.Mesh(o.gH||new THREE.BoxGeometry(.46,.46,.46),o.mH);h.position.y=.23;hp.add(h);
 rig.head=hp;rig.headMesh=h;rig.setExpr=o.setExpr||function(){};
 // HP yang menempel di sisi kepala kanan (hanya tampil saat animasi telepon)
 const ph=new THREE.Group();ph.position.set(.26,.22,-.02);
 ph.add(new THREE.Mesh(new THREE.BoxGeometry(.03,.15,.07),LM(0x3a3f4a,0x14161a)));
 const lens=new THREE.Mesh(new THREE.BoxGeometry(.008,.022,.022),BM(0x0a0a0a));lens.position.set(.018,.05,-.02);ph.add(lens);
 ph.visible=false;hp.add(ph);rig.phone=ph;
 return rig}
function rigWandih(){ // pakai skin pemain (aset.js: SKIN_FULL) bila ada
 const hasS=typeof skinM==='function',hasB=typeof bg==='function';
 const sm=(u,c)=>hasS?skinM(u||'',c):LM(c,0x1c1c1c);
 const gg=(w,h,d,u,a,b,c)=>hasB?bg(w,h,d,u,a,b,c):new THREE.BoxGeometry(w,h,d);
 const o={gT:gg(.46,.7,.23,F.badan,8,12,4),mT:sm(F.badan,0xe4e8ee),
  gAL:gg(.23,.7,.23,F.tanganKiri,4,12,4),mAL:sm(F.tanganKiri,0xe0b48c),gAR:gg(.23,.7,.23,F.tanganKanan,4,12,4),mAR:sm(F.tanganKanan,0xe0b48c),
  gLL:gg(.23,.7,.23,F.kakiKiri,4,12,4),mLL:sm(F.kakiKiri,0x3d4452),gLR:gg(.23,.7,.23,F.kakiKanan,4,12,4),mLR:sm(F.kakiKanan,0x3d4452)};
 if(F.kepala){o.gH=gg(.46,.46,.46,F.kepala,8,8,8);o.mH=sm(F.kepala,0xe0b48c)}
 else{const hs=headSet({skin:'#e0b48c',hair:'#14100c'});o.mH=hs.mH;o.setExpr=hs.setExpr}
 return mkRig(o)}
function rigGuru(){const hs=headSet({skin:'#c69a6b',hair:'#1a1410',must:true}),shirt=LM(0xb8a070,0x1a1608),pants=LM(0x1c1c26,0x050508);
 return mkRig({mT:shirt,mAL:shirt,mAR:shirt,mLL:pants,mLR:pants,hand:LM(0xc69a6b,0x181008),mH:hs.mH,setExpr:hs.setExpr})}
// Hantu (El Kalla / Oni): badan hitam + wajah dari gambar. Semua bahan transparan supaya bisa dibuat samar (opacity 30%).
function rigGhost(url){
 const k=LM(0x0b0b10,0x050508),b=LM(0x000000,0x020203),fm=new THREE.MeshBasicMaterial({color:0x888888});
 if(url)new THREE.TextureLoader().load(url,t=>{fm.map=t;fm.color.set(0xffffff);fm.needsUpdate=true},undefined,()=>{});
 const mats=[k,b,fm];mats.forEach(m=>{m.transparent=true;m.opacity=0});
 const r=mkRig({mT:k,mAL:k,mAR:k,mLL:k,mLR:k,mH:[b,b,b,b,b,fm]});r.root.scale.setScalar(1.12);r.mats=mats;return r}
const ghostOp=(r,o)=>r.mats.forEach(m=>{m.opacity=o});

// ---------- aktor & animasi ----------
const KEYS=['hx','hy','hz','alx','alz','arx','arz','llx','lrx','lean','by','sx','ars'];
// hx: + = kepala menengadah; hy: + = menoleh ke kiri tokoh; lean: + = condong ke depan; alx/arx: + = lengan ke depan; ars: skala panjang lengan kanan (-0.57 = lengan pendek untuk HP di telinga)
const ANIM={
 diam:t=>({by:Math.sin(t*1.5)*.005,hx:Math.sin(t*1.1)*.02,alz:-.05,arz:.05}),
 tunduk:t=>({hx:-.6,lean:.1,alz:-.04,arz:.04,by:Math.sin(t*1.3)*.004}),
 takut:t=>({hx:.1,lean:-.1,alx:.9,arx:.9,alz:-.25,arz:.25,sx:Math.sin(t*40)*.012,hy:Math.sin(t*3)*.15}),
 kaget:t=>({hx:.3,lean:-.2,alx:.5,arx:.5,alz:-.9,arz:.9,sx:Math.sin(t*55)*.01,by:Math.max(0,.12-t*.3)}),
 marah:t=>({hx:Math.sin(t*13)*.05,hy:Math.sin(t*8)*.14,lean:.17,arx:1.15+Math.sin(t*12)*.14,arz:.3,alx:.35,alz:-.4,by:Math.abs(Math.sin(t*6.5))*.02}),
 tunjuk:t=>({hx:.05,lean:.1,arx:1.57+Math.sin(t*3)*.04,alx:.3,alz:-.2,by:Math.sin(t*2)*.004}),
 bicara:t=>({hx:Math.sin(t*5)*.05,hy:Math.sin(t*3.1)*.12,arx:.5+Math.sin(t*5.5)*.28,arz:.18,alx:.35+Math.sin(t*4.7+1)*.2,alz:-.15}),
 jalan:t=>{const s=Math.sin(t*8);return{llx:s*.6,lrx:-s*.6,alx:-s*.45,arx:s*.45,by:Math.abs(s)*.03}},
 dorong:t=>{const j=Math.max(0,Math.sin(t*4.5)),jj=j*j*j;return{alx:1.45,arx:1.45,alz:-.08,arz:.08,lean:-.14*jj,sx:Math.sin(t*70)*.008*jj,hx:-.12}},
 melayang:t=>({by:.08+Math.sin(t*1.8)*.05,alx:.18+Math.sin(t*1.4)*.05,arx:.18+Math.sin(t*1.4+1)*.05,hy:Math.sin(t*.7)*.12,hx:-.1+Math.sin(t*.9)*.04}),
 // berdiri menelpon: tangan kanan memegang HP di telinga
 telp:t=>({arx:2.85,arz:-.14,ars:-.57,alx:.04,alz:-.05,hz:-.08,hy:-.12,hx:.02+Math.sin(t*.9)*.02,by:Math.sin(t*1.4)*.004}),
 // duduk di kursi sambil menelpon (kaki lurus ke depan di bawah meja)
 dudukTelp:t=>({by:-.25,llx:1.45,lrx:1.45,arx:2.85,arz:-.14,ars:-.57,alx:.95,alz:-.1,hz:-.08,hy:.1+Math.sin(t*.8)*.05,hx:.02+Math.sin(t*.9)*.02})
};
const EXPR={marah:'marah',tunjuk:'marah',takut:'takut',kaget:'takut'};
function addActor(name,rig,x,z,look){const a={name:name,rig:rig,x:x,z:z,yaw:0,anim:'diam',t0:T,path:[],cur:{},expr:'normal',speed:1.4,vis:true,lookAt:look||null,speaker:false,fresh:true};rig.root.visible=true;actors[name]=a;return a}
function lookVec(a){const L=a.lookAt;if(!L)return null;if(typeof L==='string'){const b=actors[L];return b?[b.x,b.z]:null}return L}
function snapYaw(a){const L=lookVec(a);if(L)a.yaw=Math.atan2(-(L[0]-a.x),-(L[1]-a.z))}
function updActor(a,dt,talking){
 let mv=false;
 if(a.path.length){const p=a.path[0],dx=p[0]-a.x,dz=p[1]-a.z,d=Math.hypot(dx,dz);
  if(d<.06)a.path.shift();
  else{const s=Math.min(d,a.speed*dt);a.x+=dx/d*s;a.z+=dz/d*s;mv=true;a.yaw=lerpAng(a.yaw,Math.atan2(-dx,-dz),Math.min(1,dt*9))}}
 if(!mv){const L=lookVec(a);if(L)a.yaw=lerpAng(a.yaw,Math.atan2(-(L[0]-a.x),-(L[1]-a.z)),Math.min(1,dt*4))}
 const fn=mv?ANIM.jalan:(ANIM[a.anim]||ANIM.diam),tp=fn(mv?T:T-a.t0);
 if(talking&&a.speaker){tp.hx=(tp.hx||0)+Math.sin(T*19)*.05;tp.by=(tp.by||0)+Math.abs(Math.sin(T*9))*.01}
 for(let i=0;i<KEYS.length;i++){const k=KEYS[i],c=a.cur[k]||0;a.cur[k]=c+((tp[k]||0)-c)*Math.min(1,dt*(k==='sx'?40:9))}
 const c=a.cur,r=a.rig;
 r.head.rotation.set(c.hx,c.hy,c.hz);r.armL.rotation.set(c.alx,0,c.alz);r.armR.rotation.set(c.arx,0,c.arz);r.armR.scale.y=1+c.ars;
 r.legL.rotation.x=c.llx;r.legR.rotation.x=c.lrx;
 r.root.position.set(a.x+c.sx,c.by,a.z);r.root.rotation.set(-c.lean,a.yaw,0);r.root.visible=a.vis}

// ---------- benda tambahan di scene game (disembunyikan di luar cutscene) ----------
const AMB=S.children.find(o=>o.isAmbientLight)||null;
const CL1=new THREE.PointLight(0xffffff,0,10),CL2=new THREE.PointLight(0xffffff,0,8); // jumlah lampu tetap (intensitas 0) supaya tidak ada lag kompilasi shader saat cutscene mulai
S.add(CL1);S.add(CL2);
const RIG={W:rigWandih(),G:rigGuru(),K:rigGhost(FACE),O:rigGhost(FACE2),GO:rigGuru()};
[RIG.W,RIG.G,RIG.K,RIG.O].forEach(r=>{r.root.visible=false;r.root.userData.cutRoot=true;S.add(r.root)});
// (Papan tulis hijau "REMEDIAL" dihapus: papan tulis asli di dalam game, polos, yang tampil)
// Bidang hitam di balik pintu exit belakang (ruang pertama) saat pintu terbuka
const BLACK=(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.02,2.4,1.2),BM(0x000000));m.position.set(-5.485,1.2,13);m.visible=false;m.userData.cutRoot=true;S.add(m);return m})();
function setDoor(a){const d=exitDoors[1];if(!d)return;d[0].rotation.y=a;d[1].rotation.y=-a}

function worldEnter(){
 CUT.scene=S;worldOn=true;
 SAVE={ac:AMB?AMB.color.getHex():0,ai:AMB?AMB.intensity:0,gh:GH.visible};
 GH.visible=false}
function worldLeave(){
 if(!worldOn)return;worldOn=false;
 if(AMB&&SAVE){AMB.color.setHex(SAVE.ac);AMB.intensity=SAVE.ai}
 if(SAVE)GH.visible=SAVE.gh;
 CL1.intensity=0;CL2.intensity=0;BLACK.visible=false;setDoor(0);
 ghostOp(RIG.K,0);ghostOp(RIG.O,0);SAVE=null}

// ---------- kamera yang menghindari benda (untuk adegan di tempat pemain) ----------
const RC=new THREE.Raycaster();
function occluders(){const L=[];S.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!m||Array.isArray(m)||m.transparent)return;
 for(let p=o;p;p=p.parent){if(!p.visible||(p.userData&&p.userData.cutRoot))return}L.push(o)});return L}
function pickCam(tx,ty,tz,cands,f){
 const occ=occluders(),o=new V3(tx,ty,tz);let best=null,bestD=-1;
 for(const c of cands){const p=new V3(c[0],c[1],c[2]),d=p.clone().sub(o),len=d.length();d.normalize();RC.set(o,d);RC.far=len+.2;
  const h=RC.intersectObjects(occ,false),free=h.length?h[0].distance:len+.2;
  if(free>=len+.15)return{p:[p.x,p.y,p.z],l:[tx,ty,tz],f:f};
  if(free>bestD){bestD=free;best=d.clone().multiplyScalar(Math.max(.5,free-.2)).add(o)}}
 return{p:[best.x,best.y,best.z],l:[tx,ty,tz],f:f}}
function relCands(a,list){const s=Math.sin(a.yaw),c=Math.cos(a.yaw);return list.map(q=>[a.x+q[0]*c-q[2]*s,1.6+q[1],a.z-q[0]*s-q[2]*c])}

// ---------- PANGGUNG 1: HUKUMAN (ruang pertama, guru marah) ----------
function stHukuman(){
 worldEnter();
 if(AMB){AMB.color.setHex(0x5a2a2a);AMB.intensity=.9}
 CL1.color.setHex(0xff8a5c);CL1.distance=9;CL1.intensity=1.5;CL1.position.set(0,2.9,12);
 CL2.color.setHex(0x6a86ff);CL2.distance=8;CL2.intensity=.5;CL2.position.set(-3.4,2.4,11);
 addActor('WANDIH',RIG.W,-1.2,12.4,'GURU');addActor('GURU',RIG.G,1.2,12.4,'WANDIH');
 let dr=0,wasOpen=false,doorSnd=false,doorT0=0;
 return{
  shots:{
   tegang:{p:[.1,1.5,10.25],l:[0,1.25,12.6],f:54,d:[0,.03,.5]},
   guru:{p:[-2.2,1.6,11.7],l:[1.2,1.62,12.4],f:34,d:[.2,0,0]},
   wandih:{p:[-.1,1.6,11.55],l:[-1.2,1.62,12.4],f:34,d:[-.1,0,.05]},
   pintu:{p:[1.5,1.4,10.4],l:[-4.2,1.2,12.9],f:48,d:[.2,0,0]}},
  tick:function(t,dt){
   ls.forEach(l=>{l.intensity=.25});
   const sw=Math.sin(t*1.25)*.45;CL1.position.x=sw;CL1.intensity=1.45+Math.sin(t*31)*.05;
   const g=actors.GURU;let tgt=0;
   // Waktu pintu dicocokkan dengan audio pintu-guru (mix 2,06 dtk): buka 0-0,7 dtk, tutup/banting ~0,8-0,95 dtk, kunci ~1,15-1,7 dtk
   if(!doorSnd&&g.x<-4.4&&g.x>-5.75){doorSnd=true;doorT0=t;playDoor()}
   if(doorSnd&&t-doorT0<.8)tgt=1.4;
   if(g.x<-5.75)g.vis=false;
   const sp=tgt===0?9:2;dr+=Math.sign(tgt-dr)*Math.min(Math.abs(tgt-dr),sp*dt);setDoor(dr);BLACK.visible=dr>.05;
   if(dr>.5)wasOpen=true;
   if(wasOpen&&dr<.03&&tgt===0){shake=.6;wasOpen=false}},
  onScene:function(){}}}

// ---------- PANGGUNG 2: LAB (tengah malam, lampu berkedip, hantu bergantian) ----------
function stLab(){
 worldEnter();
 if(AMB){AMB.color.setHex(0x1a2a3a);AMB.intensity=.5}
 CL1.color.setHex(0xbcd0ff);CL1.distance=6;CL1.intensity=.4;CL1.position.set(-3,2.7,12);
 CL2.color.setHex(0xff2020);CL2.distance=6;CL2.intensity=0;
 addActor('WANDIH',RIG.W,-4.7,13,[-9,13]);
 const gh=[addActor('KALLA',RIG.K,-2.75,8.8,[-2.75,30]),addActor('ONI',RIG.O,-2.75,8.8,[-2.75,30])];
 gh.forEach(g=>{g.vis=false;g.anim='melayang'});
 let gi=-1,kz=8.8,wasOff=false;const fade=[0,0];
 return{
  shots:{
   belakang:{p:[-2.9,1.68,12.15],l:[-5.3,1.35,13],f:50,d:[-.3,0,.15]},
   lorong:{p:[-2.35,1.95,12.75],l:[-2.75,1.3,4],f:54,d:[0,0,-.15]}},
  tick:function(t,dt){
   const p=t%3.2,off=(p>1&&p<1.25)||(p>1.45&&p<1.9)||(p>2.1&&p<2.2),creep=!!(curSc&&curSc.kalla==='creep');
   ls.forEach(l=>{l.intensity=off?.01:.45});
   if(AMB)AMB.intensity=off?.12:.5;
   CL1.intensity=off?0:.4;
   // pintu bergetar saat Wandih mendorong
   const w=actors.WANDIH;
   if(w&&w.anim==='dorong'){const j=Math.max(0,Math.sin((t-w.t0)*4.5));setDoor(Math.abs(Math.sin(t*70))*.02*j*j*j)}else setDoor(0);
   // hantu muncul satu per satu, bergantian El Kalla lalu Oni, hanya samar (opacity 30%)
   if(creep&&off&&!wasOff){gi++;kz=Math.max(5.6,kz-.8)}
   wasOff=off;
   let gl=0;
   gh.forEach((g,i)=>{const on=creep&&off&&gi>=0&&(gi%2)===i;
    fade[i]+=((on?1:0)-fade[i])*Math.min(1,dt*(on?18:22));
    const o=.3*fade[i];ghostOp(RIG[i?'O':'K'],o);g.vis=o>.01;
    g.x=-2.75+(i?.3:-.3);g.z=kz+Math.sin(t*.9+i)*.15;
    if(g.vis)gl=Math.max(gl,fade[i])});
   const gg=gh[gi%2===1?1:0];
   CL2.position.set(gg.x,1.4,gg.z+.7);CL2.intensity=.5*gl},
  onScene:function(s){if(s.kalla==='creep'&&!s.keep){kz=8.8;wasOff=false;gi=-1;fade[0]=fade[1]=0}}}}

// ---------- PANGGUNG 3: TELEPON (Wandih menelpon di tempat pemain menyelesaikan soal) ----------
function stTelepon(){
 worldEnter();
 CL1.color.setHex(0xcfdcff);CL1.distance=4.5;CL1.intensity=.7;CL2.intensity=0;
 const a=addActor('WANDIH',RIG.W,C.position.x,C.position.z,null);a.yaw=yaw;
 CL1.position.set(a.x-Math.sin(a.yaw)*.9,2.4,a.z-Math.cos(a.yaw)*.9);
 return{
  shots:{
   wdepan:function(){return pickCam(a.x,1.62,a.z,relCands(a,[[.5,.05,1.2],[-.5,.05,1.2],[.9,.05,.85],[-.9,.05,.85],[1,.1,.35],[-1,.1,.35]]),36)},
   wsamping:function(){return pickCam(a.x,1.6,a.z,relCands(a,[[1.25,.1,.2],[-1.25,.1,.2],[.9,.15,-.9],[-.9,.15,-.9],[0,.2,-1.3]]),40)}},
  tick:function(){},
  onScene:function(){}}}

// ---------- PANGGUNG 4: KANTOR (Guru duduk di meja kerja sambil menelpon) ----------
const OFC=new THREE.Scene();
(function buildOffice(){
 OFC.background=new THREE.Color(0x07060c);
 OFC.add(new THREE.AmbientLight(0x2a2438,.9));
 const lamp=new THREE.PointLight(0xffc27a,1.4,8);lamp.position.set(.55,1.3,-.8);OFC.add(lamp);OFC.userData.lamp=lamp;
 const win=new THREE.PointLight(0x5a7aff,.55,7);win.position.set(-1.6,1.8,-1.9);OFC.add(win);
 const lap=new THREE.PointLight(0x8ab4ff,.35,3);lap.position.set(-.4,1.1,-.95);OFC.add(lap);
 const fill=new THREE.PointLight(0x8a6a5a,.35,6);fill.position.set(0,2.6,1);OFC.add(fill);
 bx(OFC,7,.1,7,0x2b2018,0,-.05,0);bx(OFC,7,.1,7,0x14100e,0,3.2,0);
 bx(OFC,7,3.2,.1,0x3a3030,0,1.6,-2.4);bx(OFC,.1,3.2,7,0x342a2a,-3.5,1.6,0);bx(OFC,.1,3.2,7,0x342a2a,3.5,1.6,0);
 // jendela malam + bulan
 bx(OFC,1.6,1.3,.06,0x1a1208,-1.6,1.7,-2.34);
 const wn=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.1),BM(0x20356e));wn.position.set(-1.6,1.7,-2.3);OFC.add(wn);
 const mn=new THREE.Mesh(new THREE.CircleGeometry(.13,16),BM(0xe4ecff));mn.position.set(-1.25,2.0,-2.29);OFC.add(mn);
 // rak buku
 bx(OFC,1.6,2.1,.35,0x3a2616,1.9,1.05,-2.2);
 const bc=[0x8a2a2a,0x2a4a8a,0x2a6a3a,0xb8963a,0x5a2a6a,0x3a3a3a];
 for(let r=0;r<4;r++)for(let i=0;i<9;i++)bx(OFC,.12,.34,.22,bc[(i+r)%bc.length],1.25+i*.15,.35+r*.5,-2.0);
 // meja kerja + kursi
 const WD=0x4a3320;
 bx(OFC,1.9,.06,.85,WD,0,.75,-.7);bx(OFC,.06,.72,.8,0x3a2814,-.9,.36,-.7);bx(OFC,.06,.72,.8,0x3a2814,.9,.36,-.7);bx(OFC,1.76,.62,.04,0x3a2814,0,.4,-.32);
 bx(OFC,.5,.05,.5,0x1c1c22,0,.45,-1.5);bx(OFC,.5,.8,.05,0x1c1c22,0,.87,-1.76);bx(OFC,.05,.45,.05,0x555a62,0,.22,-1.5);bx(OFC,.5,.04,.04,0x555a62,0,.04,-1.5);
 // laptop (membelakangi kamera, layar menyala menghadap guru)
 bx(OFC,.36,.02,.26,0x2a2d33,-.45,.79,-.7);
 const sc=bx(OFC,.36,.24,.015,0x2a2d33,-.45,.92,-.82);sc.rotation.x=.25;
 const lpS=new THREE.Mesh(new THREE.PlaneGeometry(.33,.21),BM(0x3a6ac8));lpS.position.set(-.45,.92,-.835);lpS.rotation.x=.25;lpS.rotation.y=PI;OFC.add(lpS);
 // lampu meja
 bx(OFC,.14,.03,.14,0x222222,.6,.8,-.85);bx(OFC,.02,.4,.02,0x222222,.6,1.0,-.85);bx(OFC,.2,.1,.2,LM(0xffd9a0,0x6a5a30),.6,1.22,-.85);
 // tumpukan kertas, buku, gelas
 for(let i=0;i<6;i++)bx(OFC,.26,.012,.34,i%2?0xe8e4d4:0xd8d4c4,.1+(i%2)*.01,.783+i*.012,-.55);
 bx(OFC,.07,.09,.07,0x8a2a2a,.4,.82,-.45);bx(OFC,.22,.03,.3,0x2a4a8a,-.1,.795,-.5);
 bx(OFC,.3,.01,.07,0xb8963a,-.25,.78,-.42);
 const gu=RIG.GO;gu.root.userData.cutRoot=true;OFC.add(gu.root);gu.root.visible=false})();
function stKantor(){
 CUT.scene=OFC;
 addActor('GURU',RIG.GO,0,-1.35,[0,9]);
 return{
  shots:{
   meja:{p:[.55,1.5,1.9],l:[0,1.2,-1.1],f:44,d:[-.15,0,-.3]},
   dekat:{p:[.2,1.5,.55],l:[0,1.45,-1.35],f:36,d:[0,0,-.15]}},
  tick:function(t){const l=OFC.userData.lamp;l.intensity=1.4+Math.sin(t*23)*.03},
  onScene:function(){}}}
setTimeout(()=>{try{R.compile(OFC,CC)}catch(e){}},4000); // kompilasi shader kantor lebih awal

const STAGES={hukuman:stHukuman,lab:stLab,telepon:stTelepon,kantor:stKantor};

// ---------- siklus hidup panggung ----------
function leaveStage(){
 stopDoor();
 if(stage&&stage.leave)stage.leave();
 [RIG.W,RIG.G,RIG.K,RIG.O,RIG.GO].forEach(r=>{r.root.visible=false;r.phone.visible=false});
 worldLeave();
 stage=null;stageName='';actors={};curShotName='';curSh=null;curSc=null;CUT.scene=null}
function halt(){CUT.on=false;leaveStage();const st=$$('st');if(st)st.classList.remove('s3')}
function enter(name){
 leaveStage();T=0;stage=STAGES[name]();stageName=name;
 for(const k in actors)snapYaw(actors[k]);
 snapCam=true;shake=0}
function applyScene(s){
 curSc=s;
 for(const n in actors){const a=actors[n],an=s.anim&&s.anim[n];
  a.speaker=(n===s.who);
  if(an){a.anim=an;a.t0=T}
  if(a.fresh){a.fresh=false;const f0=ANIM[a.anim];if(f0)a.cur=Object.assign({},f0(0))} // tokoh baru muncul: langsung di pose awal (tangan telepon tidak turun dulu)
  else if(a.anim==='bicara'&&!a.speaker){a.anim='diam';a.t0=T}
  else if(a.speaker&&a.anim==='diam'){a.anim='bicara';a.t0=T}
  const ex=(s.expr&&s.expr[n])||EXPR[a.anim]||'normal';
  if(ex!==a.expr){a.expr=ex;a.rig.setExpr(ex)}
  a.rig.phone.visible=(a.anim==='telp'||a.anim==='dudukTelp');
  a.speed=s.spd||1.4;
  if(s.at&&s.at[n]){a.x=s.at[n][0];a.z=s.at[n][1];a.path=[]}
  if(s.go&&s.go[n]){const g=s.go[n];a.path=(typeof g[0]==='number'?[g]:g).map(q=>q.slice())}
  if(s.look&&s.look[n]!==undefined)a.lookAt=s.look[n]}
 if(s.at)for(const n in s.at)if(actors[n]&&s.look&&s.look[n]!==undefined)snapYaw(actors[n]);
 const nm=s.cam||curShotName;
 if(nm!==curShotName||!curSh){const raw=stage.shots[nm];
  if(raw){curSh=typeof raw==='function'?raw():raw;curShotName=nm;snapCam=!s.pan;shotT=0;camRate=s.pan?2.2:10}}
 if(s.fx==='shake')shake=.55;
 if(stage.onScene)stage.onScene(s)}
function updCam(dt){
 const sh=curSh;if(!sh)return;
 const k=Math.min(shotT,14)/14,d=sh.d||[0,0,0];
 tP.set(sh.p[0]+d[0]*k,sh.p[1]+d[1]*k,sh.p[2]+d[2]*k);tL.set(sh.l[0],sh.l[1],sh.l[2]);
 const r=1-Math.exp(-dt*camRate);
 if(snapCam){camP.copy(tP);camL.copy(tL);camF=sh.f||50;snapCam=false}
 else{camP.lerp(tP,r);camL.lerp(tL,r);camF+=((sh.f||50)-camF)*r}
 shake*=Math.exp(-dt*4);const n=.006+shake*.12;
 CC.position.set(camP.x+Math.sin(T*1.7)*n+(Math.random()-.5)*shake*.1,camP.y+Math.sin(T*2.3)*n*.8,camP.z+Math.sin(T*1.1)*n*.5);
 CC.lookAt(camL);
 const asp=innerWidth/innerHeight;let f=camF;
 if(asp>16/9)f=2*Math.atan(Math.tan(camF*PI/360)*(16/9)/asp)*180/PI; // layar lebih lebar dari 16:9: lebar pandang tetap, tinggi dipotong
 else if(asp<1.2)f=Math.min(100,camF*Math.pow(1.2/asp,.75));
 CC.aspect=asp;CC.fov=f;CC.updateProjectionMatrix()}
function frame(){
 const now=performance.now(),dt=Math.min(.05,Math.max(.001,(now-last)/1000||.016));last=now;
 T+=dt;shotT+=dt;
 const talking=typeof sP==='number'&&typeof sT==='string'&&sP<sT.length;
 if(stage.tick)stage.tick(T,dt);
 for(const n in actors)updActor(actors[n],dt,talking);
 updCam(dt)}
function fail(e){
 console.warn('cutscene3d:',e);halt();
 try{if(typeof sc!=='undefined'&&sc[sI])origVis(sc[sI])}catch(_){}}

// Render game (loop di game.js memanggil R.render(S,C)): selama cutscene 3D aktif, pakai kamera + scene cutscene
const _render=R.render.bind(R);
R.render=function(scn,cam){
 if(CUT.on&&scn===S&&stage&&CUT.scene){
  try{frame();return _render(CUT.scene,CC)}catch(e){fail(e)}
 }
 return _render(scn,cam)};

function show(s){
 if(stageName!==s.stage)enter(s.stage);
 const st=$$('st');st.classList.add('v','s3');
 if(!CUT.on){CUT.on=true;last=performance.now()}
 applyScene(s)}


// ---------- suara tambahan: pintu guru, ambient (night/motor), suara guru (TTS cadangan) ----------
let doorA=null;
function sfxTry(f,fb){try{const a=new Audio(f||fb);a.onerror=()=>{if(fb&&a.src.indexOf(fb)<0){try{const b=new Audio(fb);b.play().catch(()=>{});doorA=b}catch(e){}}};a.play().catch(()=>{if(fb&&f){try{const b=new Audio(fb);b.play().catch(()=>{});doorA=b}catch(e){}}});return a}catch(e){return null}}
function playDoor(){stopDoor();doorA=sfxTry((typeof CUT_SND!=='undefined'&&CUT_SND.pintuGuru)||'','bukapintu.mp3')} // 1 audio: buka + tutup + kunci, mulai saat guru mulai membuka pintu
function stopDoor(){if(doorA){try{doorA.pause()}catch(e){}doorA=null}}
const amb={};let ambT=null;
const ambVol=f=>/motor/i.test(f)?.6:.35;
function ambStop(f){const a=amb[f];if(a){try{a.pause()}catch(e){}delete amb[f]}}
function ambAll(){for(const f in amb)ambStop(f)}
function ambSet(list){clearTimeout(ambT);list=list||[];for(const f in amb)if(list.indexOf(f)<0)ambStop(f);
 list.forEach(f=>{if(!f||amb[f])return;try{const a=new Audio(f);a.loop=true;a.volume=ambVol(f);a.play().catch(()=>{});amb[f]=a}catch(e){}})}
function say(s){try{if(!window.speechSynthesis)return;speechSynthesis.cancel();if(s&&s.say&&!s.snd){const u=new SpeechSynthesisUtterance(s.say);u.lang='id-ID';u.pitch=.6;u.rate=.95;speechSynthesis.speak(u)}}catch(e){}}

// ---------- sambungkan ke sistem cerita yang sudah ada ----------
window.sVis=function(s){
 ambSet(s&&s.amb);say(s);
 if(s&&s.stage&&STAGES[s.stage]){
  origVis(Object.assign({},s,{img:'',sv:''}));
  try{show(s)}catch(e){fail(e);origVis(s)}
 }else{halt();origVis(s)}};
window.endS=function(){halt();stopDoor();clearTimeout(ambT);ambT=setTimeout(ambAll,500);try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}return origEnd.apply(this,arguments)};
window.CUT3D={halt:halt,stages:Object.keys(STAGES),add:function(n,f){STAGES[n]=f},
 api:{setScene:sc=>{CUT.scene=sc;CC.far=220},T:()=>T,sc:()=>curSc,ambStop:ambStop,shake:v=>{shake=v},LM:LM,BM:BM,bx:bx,cvTex:cvTex,rigWandih:rigWandih,F:F}};
})();
