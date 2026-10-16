// MIDNIGHT LAB.. - logika game (Three.js). Dimuat setelah soal.js, cerita.js, aset.js
const $=id=>document.getElementById(id),tc=matchMedia('(pointer:coarse)').matches;
let yaw=0,pitch=0,started=false,over=false,au=0,stT=0,gsT=0;
const R=new THREE.WebGLRenderer({antialias:false});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);document.body.appendChild(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0x020205);S.fog=new THREE.FogExp2(0x020205,0.05);
const C=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.05,60);C.position.set(0,1.6,11.3);C.rotation.order='YXZ';S.add(C);
const spot=new THREE.SpotLight(0xfff2cc,3.5,24,Math.PI/7,0.4,1.5);spot.position.set(0.24,-0.2,-0.45);spot.visible=false;C.add(spot); // senter MATI saat pertama spawn
let flOn=false; // status senter pemain (dipulihkan setelah keluar lemari)
// Objek senter (silinder + kepala + lensa). Sumbu memanjang ke arah -Z; lensa menghadap -Z.
function mkTorch(){const g=new THREE.Group(),
 body=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.034,0.2,12),new THREE.MeshLambertMaterial({color:0x2b2f36,emissive:0x15171b})),
 head=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.052,0.07,14),new THREE.MeshLambertMaterial({color:0x8a9099,emissive:0x2a2d31})),
 lens=new THREE.Mesh(new THREE.CircleGeometry(0.046,14),new THREE.MeshBasicMaterial({color:0xfff6c8,fog:false})),
 ring=new THREE.Mesh(new THREE.CylinderGeometry(0.0325,0.0325,0.012,12),new THREE.MeshLambertMaterial({color:0xc23b3b,emissive:0x3a1010}));
 for(const m of[body,head,ring])m.rotation.x=Math.PI/2; // silinder tegak -> rebah ke arah Z
 body.position.z=0.02;head.position.z=-0.115;ring.position.z=0.03;lens.position.z=-0.1511;lens.rotation.y=Math.PI;g.add(body,head,ring,lens);return g}
const TVM=mkTorch();TVM.position.set(0.25,-0.23,-0.5);TVM.rotation.y=0.05;TVM.visible=false;C.add(TVM); // senter di tangan kanan (pandangan orang pertama)
const tg=new THREE.Object3D();tg.position.set(0,0,-1);C.add(tg);spot.target=tg;
S.add(new THREE.AmbientLight(0x334466,0.8));
const M=c=>new THREE.MeshLambertMaterial({color:c});
function box(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='number'?M(c):c);m.position.set(x,y,z);S.add(m);return m}
const WOOD=0xd2a45c,MET=0x888e92,W1=0xb3a33e,W2=0x61a2ab;
// Ruang pertama (spawn, z>1.4) dinding #b3a33e; ruang kedua (z<1.4, ada lemari) dinding #61a2ab
// Tinggi ruangan H=3.7 m (jarak atap pintu lipat 2,55 m ke plafon sekitar 1,15 m, seperti foto referensi)
const H=3.7,HALL=2.6;
box(11,0.1,30,0x8692a6,0,-0.05,0);box(11,0.1,30,0xdbdbdb,0,H+0.05,0);
// Plafon kotak-kotak (tile 0,55 m): garis rangka gelap tipis, 1 tile = 1 kali ulang tekstur
{const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');g.fillStyle='#d9d9d2';g.fillRect(0,0,128,128);
 g.fillStyle='#e4e4de';g.fillRect(6,6,116,116);g.strokeStyle='#7b7b74';g.lineWidth=6;g.strokeRect(0,0,128,128);
 const tx=new THREE.CanvasTexture(cv);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(20,54.5);tx.anisotropy=4;
 const cl=new THREE.Mesh(new THREE.PlaneGeometry(11,30),new THREE.MeshLambertMaterial({map:tx,emissive:0x15151a}));cl.rotation.x=Math.PI/2;cl.position.y=H-0.005;S.add(cl)}
for(const s of[-1,1]){box(0.1,H,16.4,W2,s*5.55,H/2,-6.8);box(0.1,H,13.6,W1,s*5.55,H/2,8.2)}
box(11,H,0.1,W2,0,H/2,-15.05);box(11,H,0.1,W1,0,H/2,15.05);
for(const[c,zz]of[[W2,1.35],[W1,1.45]]){box(1.5,H,0.1,c,-4.75,H/2,zz);box(1.5,H,0.1,c,4.75,H/2,zz);box(8,H-HALL,0.1,c,0,HALL+(H-HALL)/2,zz)}
// Meja komputer: slot=[x0,arah,z,tengah?,kubikel?]; 3 meja dinding + 3 meja tengah per baris dihapus di ruang pertama
// kubikel=1 -> meja kayu bersekat (gambar ke-2) khusus ruang kedua (biru) di dinding samping yang ada pintu keluar. Sisanya meja lebar terang (gambar ke-3).
const slots=[],dm=new THREE.Object3D();
for(const s of[-1,1]){for(let i=0;i<15;i++){slots.push([s*5.5,-s,-11.5+i*0.85,0,s<0?1:0]);if(i<12)slots.push([s*5.5,-s,2.5+i*0.85,0,0])}
 for(let i=0;i<12;i++){slots.push([0,s,-10.5+i*0.85,1,0]);if(i<9)slots.push([0,s,2.6+i*0.85,1,0])}}
const SLn=slots.filter(q=>!q[4]),SLk=slots.filter(q=>q[4]),SLw=SLn.filter(q=>!q[3]),SLc=SLn.filter(q=>q[3]);
function inst(w,h,d,c,y,dist,dz=0,rel=0,L=slots){if(!L.length)return;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(w,h,d),M(c),L.length);
L.forEach(([x0,dr,z],i)=>{dm.position.set(x0+dr*dist,y,z+(rel?-dr*dz:dz));dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});im.frustumCulled=false;S.add(im)}
// Meja biasa (gambar ke-3): alas krem terang, lis depan oranye-coklat, kaki ramping. Meja dinding: sekat belakang + 2 kaki depan. Meja tengah: 4 kaki (tanpa sekat)
const TOPL=0xe8dcb0,TRIM=0xb5712e,LEGL=0xcfb27a;
inst(0.7,0.045,0.84,TOPL,0.752,0.35,0,0,SLn);inst(0.04,0.72,0.84,0xc9a46a,0.36,0.05,0,0,SLw);
inst(0.03,0.08,0.84,TRIM,0.71,0.685,0,0,SLn);
for(const dz of[-0.39,0.39]){inst(0.05,0.72,0.05,LEGL,0.36,0.67,dz,0,SLn);inst(0.05,0.72,0.05,LEGL,0.36,0.04,dz,0,SLc)}
// Meja kubikel kayu (gambar ke-2): alas oranye, sekat samping tinggi, panel belakang + rak atas + kertas tempel (gambar bisa diganti: POSTER_URL di aset.js)
const ORG=0xc9782f,ORGD=0xa85f20;
inst(0.7,0.055,0.84,ORG,0.75,0.35,0,0,SLk);inst(0.04,1.5,0.84,ORGD,0.75,0.03,0,0,SLk);
inst(0.62,0.72,0.03,ORGD,1.11,0.34,0.425,0,SLk);inst(0.62,0.72,0.03,ORGD,1.11,0.34,-0.425,0,SLk);
inst(0.3,0.03,0.84,ORG,1.42,0.19,0,0,SLk);inst(0.4,0.04,0.84,ORGD,0.3,0.2,0,0,SLk);
inst(0.03,0.72,0.84,ORGD,0.36,0.68,0,0,SLk);
// Kertas tiap kubikel beda: kubikel ke-k (urut dari ujung belakang) memakai POSTER_URLS[k % jumlah daftar]; kalau file tidak ada, dipakai gambar bawaan bernomor
{const pgeo=new THREE.PlaneGeometry(0.4,0.2);pgeo.rotateY(Math.PI/2);const PL=typeof POSTER_URLS!=='undefined'?POSTER_URLS:[],cols=['#f3eedc','#e3eef3','#f1e3e3','#e6f1e0','#f1ecd2'];
 SLk.forEach(([x0,dr,z],k)=>{const pc=document.createElement('canvas');pc.width=800;pc.height=400;const pg=pc.getContext('2d');pg.fillStyle=cols[k%cols.length];pg.fillRect(0,0,800,400);pg.strokeStyle='#8a7a50';pg.lineWidth=10;pg.strokeRect(5,5,790,390);
  pg.fillStyle='#4a3a20';pg.font='bold 64px sans-serif';pg.textBaseline='top';pg.fillText('POSTER '+(k+1),40,40);pg.font='36px sans-serif';pg.fillText('ganti lewat POSTER_URLS (800 x 400 px)',40,150);for(let i=0;i<4;i++)pg.fillRect(40,230+i*36,720-(i%2)*160,12);
  const pmat=new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(pc),emissive:0x1a1a14}),pm=new THREE.Mesh(pgeo,pmat);pm.position.set(x0+dr*0.052,1.3,z);S.add(pm);
  const u=PL.length?PL[k%PL.length]:'';if(u)new THREE.TextureLoader().load(u,t=>{pmat.map=t;pmat.needsUpdate=true},undefined,()=>{})})}
inst(0.04,0.32,0.5,0x050505,1.0,0.3);inst(0.1,0.1,0.1,0x111111,0.83,0.3);
inst(0.15,0.02,0.42,0x222222,0.79,0.55);inst(0.4,0.4,0.18,0x1a1a1a,0.22,0.35,-0.3,1);inst(0.1,0.025,0.06,0x111111,0.79,0.56,0.3,1);
// Kursi sekolah: dudukan+sandaran kayu, rangka besi abu-abu. Kursi kubikel: kayu oranye + rangka putih
function chair(L,seat,fr){inst(0.4,0.04,0.4,seat,0.45,1.25,0,0,L);inst(0.03,0.22,0.38,seat,0.78,1.45,0,0,L);
 for(const dz of[-0.17,0.17]){inst(0.03,0.85,0.03,fr,0.425,1.45,dz,0,L);inst(0.03,0.45,0.03,fr,0.225,1.07,dz,0,L);inst(0.4,0.03,0.03,fr,0.05,1.25,dz,0,L)}}
chair(SLn,WOOD,MET);chair(SLk,ORG,0xece8dc);
// Sekat pertama (ujung baris kubikel) yang tidak punya tetangga
{const q=SLk[0];if(q)box(0.62,0.72,0.03,ORGD,q[0]+q[1]*0.34,1.11,q[2]-0.425)}
// Meja guru (pendek, sesuai set komputer): sz=-1 depan, sz=1 belakang (ruang spawn)
function teacher(sz){const f=z=>sz*z;
 box(1.8,0.06,0.8,0x4a3320,0,0.78,f(13.3));box(1.7,0.75,0.05,0x4a3320,0,0.38,f(12.88));
 box(0.05,0.75,0.75,0x4a3320,-0.87,0.38,f(13.3));box(0.05,0.75,0.75,0x4a3320,0.87,0.38,f(13.3));
 box(0.6,0.38,0.04,0x050505,0,1.05,f(13.1));box(0.1,0.1,0.1,0x111111,0,0.86,f(13.1));
 box(0.45,0.02,0.15,0x222222,0,0.82,f(13.55));box(0.2,0.42,0.35,0x1a1a1a,-sz*0.62,1.0,f(13.4));box(0.06,0.025,0.1,0x111111,sz*0.42,0.825,f(13.62));
 box(0.45,0.04,0.45,WOOD,0,0.45,f(14.25));box(0.43,0.22,0.04,WOOD,0,0.78,f(14.5));
 for(const d of[-0.17,0.17]){box(0.03,0.85,0.03,MET,d,0.425,f(14.5));box(0.03,0.45,0.03,MET,d,0.225,f(14.05))}}
teacher(-1);teacher(1);
function board(sz,t1,t2){const cv=document.createElement('canvas');cv.width=1024;cv.height=320;const g=cv.getContext('2d');
 g.fillStyle='#d8dcd8';g.fillRect(0,0,1024,320);g.fillStyle='#1a2a6a';g.textBaseline='top';
 if(t1){let f=120;do{g.font='bold '+f+'px sans-serif';f-=4}while(g.measureText(t1).width>940&&f>30);g.fillText(t1,40,25)}if(t2){g.font='bold 56px sans-serif';g.fillText(t2,40,200)}
 box(5.2,1.8,0.04,0x444444,0,1.7,sz*14.97);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(5,1.6),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(cv)}));
 m.position.set(0,1.7,sz*14.94);if(sz>0)m.rotation.y=Math.PI;S.add(m)}
board(-1,'MIDNIGHT LAB..','Created by an RPL Student');board(1);
// Dua pintu exit di dinding samping kiri: dekat lemari kiri (ruang kedua) & dekat pojok belakang (ruang spawn)
const exitM=new THREE.MeshBasicMaterial({color:0x0a5a2a});
// Pintu exit: z=+-EZ (digeser dari pojok supaya pintu lemari yang terbuka tidak menabraknya). Desain seperti foto: pintu kayu dua daun warna merah marun,
// tiap daun 2 panel timbul (bawah tinggi, atas pendek), kusen marun lebih gelap, gagang + kunci hitam di tengah. exitDoors[i]=[pivot daun belakang, pivot daun depan]
const EZ=13.0,exitDoors=[],frM=M(0x4f1a1a),knM=new THREE.MeshLambertMaterial({color:0x111111}),dvM=M(0x8f3434),pnM=M(0xa14242),brM=new THREE.MeshLambertMaterial({color:0xc8a24a});
function mkLeaf(z,side){const pv=new THREE.Group(),c=-side*0.3,add=(w,h,d,m,x,y,zz)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,zz);pv.add(q);return q};
 pv.position.set(-5.46,0,z+side*0.6);S.add(pv);
 add(0.08,2.4,0.6,dvM,0,1.2,c);add(0.02,1.0,0.4,pnM,0.05,0.8,c);add(0.02,0.8,0.4,pnM,0.05,1.85,c);
 add(0.04,0.24,0.05,knM,0.06,1.0,-side*0.54);add(0.05,0.05,0.05,brM,0.09,1.0,-side*0.54);
 if(side<0)add(0.05,0.12,0.1,knM,0.06,1.2,-side*0.5); // kotak kunci hitam di daun pertama
 return pv}
for(const z of[-EZ,EZ]){exitDoors.push([mkLeaf(z,-1),mkLeaf(z,1)]);
 box(0.12,2.46,0.08,frM,-5.44,1.23,z-0.64);box(0.12,2.46,0.08,frM,-5.44,1.23,z+0.64);box(0.12,0.08,1.36,frM,-5.44,2.44,z)}
// Jendela + ventilasi menyatu dalam satu bingkai tebal (seperti foto): kaca di bawah, jalusi vertikal "I" di atas. Pakai InstancedMesh.
// Sisi kiri (yang ada pintu): kotak 4:3. Sisi kanan: kotak 2:3 (tinggi), diturunkan sedikit (wy) sampai jendela terakhir ruang biru.
// dw = lebar jendela yang diinginkan (m), r = tinggi/lebar, wy = tinggi tengah jendela. VH = tinggi ventilasi, BT/BD = tebal/dalam bingkai.
const acM=M(0xe6e6e6),glass=new THREE.MeshLambertMaterial({color:0xe6f2ff,emissive:0x04080c,transparent:true,opacity:0.17});
const BORD=0x4d3c0f,BT=0.07,BD=0.07,VH=0.46,WBANDS=[[-11.92,0.82],[2.08,12.27]],WSPEC={'-1':{dw:0.75,r:0.75,wy:1.9},'1':{dw:0.6,r:1.5,wy:1.65}};
const gL=[],dV=[],rL=[],bK=[],sL=[];
for(const s of[-1,1])for(const[z0,z1]of WBANDS){const sp=WSPEC[s],WY=sp.wy,L=z1-z0,n=Math.round(L/sp.dw),w=L/n,h=w*sp.r,zc=(z0+z1)/2,wt=WY+h/2,wb=WY-h/2,vt=wt+VH,vc=wt+VH/2,cy=(wb+vt)/2;
 for(let i=0;i<n;i++)gL.push([s,z0+w*(i+0.5),WY,0.02,h-BT,w-BT]);
 for(let i=0;i<=n;i++)dV.push([s,z0+w*i,cy,BD,vt-wb+BT,BT]);
 rL.push([s,zc,wb,BD,BT,L+BT],[s,zc,wt,BD,BT,L+BT],[s,zc,vt,BD,BT,L+BT]);bK.push([s,zc,WY,0.01,h,L],[s,zc,vc,0.01,VH,L]);
 for(let i=0;i<n;i++){const m=Math.max(4,Math.round((w-BT)/0.075)),sw=(w-BT)/m;for(let k=0;k<m;k++)sL.push([s,z0+w*i+BT/2+sw*(k+0.5),vc])}}
function uI(L,mat,dx){const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,L.length);
 L.forEach(([s,z,y,sx,sy,sz],i)=>{dm.position.set(s*(5.5-dx),y,z);dm.scale.set(sx,sy,sz);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});dm.scale.set(1,1,1);im.frustumCulled=false;S.add(im)}
uI(bK,new THREE.MeshBasicMaterial({color:0x070d18}),0.012);uI(gL,glass,0.03);uI(dV,M(BORD),0.035);uI(rL,M(BORD),0.035);
{const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xa88b52,emissive:0x1a1408}),sL.length),q=new THREE.Euler();
 sL.forEach(([s,z,y],i)=>{dm.position.set(s*(5.5-0.04),y,z);q.set(0,0.85,0);dm.quaternion.setFromEuler(q);dm.scale.set(0.012,VH-BT,0.12);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});
 dm.quaternion.identity();dm.scale.set(1,1,1);im.frustumCulled=false;S.add(im)}
// Ventilasi menyatu dengan kusen atas pintu exit (ruang pertama & kedua): satu bingkai marun, jalusi vertikal "I", lebar sama dengan kusen pintu (papan EXIT dihapus)
{const W=1.36,vy=2.48+VH/2,B=[],R=[],V=[],SL=[];
 for(const z of[-EZ,EZ]){B.push([-1,z,vy,0.01,VH,W]);R.push([-1,z,vy+VH/2,BD,BT,W+BT]);for(const k of[0])V.push([-1,z+k*W/2,vy,BD,VH,BT]);
  const n=Math.round(W/0.075);for(let i=0;i<n;i++)SL.push([-1,z-W/2+W/n*(i+0.5),vy])}
 uI(B,new THREE.MeshBasicMaterial({color:0x070d18}),0.012);uI(V,frM,0.035);uI(R,frM,0.035);
 const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xa88b52,emissive:0x1a1408}),SL.length),q=new THREE.Euler();
 SL.forEach(([s,z,y],i)=>{dm.position.set(s*(5.5-0.04),y,z);q.set(0,0.85,0);dm.quaternion.setFromEuler(q);dm.scale.set(0.012,VH-BT,0.12);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});
 dm.quaternion.identity();dm.scale.set(1,1,1);im.frustumCulled=false;S.add(im)}
// AC mati: di dinding kanan saja, tinggi sama (di atas ventilasi, jarak aman ke ventilasi dan plafon), 2 unit per ruang: tengah dinding + dekat pojok/lemari
for(const z of[-13.6,-5.55,7.18,13.6]){box(0.25,0.3,0.9,acM,5.38,3.2,z);box(0.26,0.03,0.7,0x333333,5.37,3.1,z)}
// Pintu lipat garasi (kisi besi hitam + badan #4a1515) terbuka lebar: dua tumpukan lipatan menempel di sisi kanan & kiri lubang hall (di dalam kusen lubang), terpisah
{const cv=document.createElement('canvas');cv.width=64;cv.height=470;const g=cv.getContext('2d');g.fillStyle='#4a1515';g.fillRect(0,0,64,470);g.strokeStyle='#050505';g.fillStyle='#050505';g.lineWidth=7;
 for(let y=-64;y<470;y+=64){g.beginPath();g.moveTo(0,y);g.lineTo(64,y+64);g.moveTo(64,y);g.lineTo(0,y+64);g.stroke()}
 g.fillRect(0,0,64,22);g.fillRect(0,448,64,22);g.fillRect(0,224,64,12);g.fillRect(0,0,6,470);g.fillRect(58,0,6,470);
 const tx=new THREE.CanvasTexture(cv),gm=new THREE.MeshLambertMaterial({map:tx,emissive:0x0e0404,side:THREE.DoubleSide}),N=10,sw=0.3,W=0.25,px=W/N,pz=Math.sqrt(sw*sw-px*px),GH_=2.55,zc=1.4-pz/2;
 for(const s of[-1,1]){const V=[];for(let i=0;i<=N;i++)V.push([s*(4.0-i*px),zc+(i%2)*pz]);
  for(let i=0;i<N;i++){const[ax,az]=V[i],[bx,bz]=V[i+1],m=new THREE.Mesh(new THREE.PlaneGeometry(sw,GH_),gm);m.position.set((ax+bx)/2,GH_/2,(az+bz)/2);m.rotation.y=-Math.atan2(bz-az,bx-ax);S.add(m)}
  box(W+0.02,0.06,pz+0.04,0x050505,s*(4.0-W/2),GH_+0.03,1.4);box(W+0.02,0.04,pz+0.04,0x050505,s*(4.0-W/2),0.02,1.4)}}
// Lemari persembunyian
const cabs=[];
// Tiap lemari punya 2 daun pintu dengan engsel di sisi luar (pivot). a=0 tertutup, a=1 terbuka; c.tgt = target animasi
// 4 lemari pojok + 2 lemari tambahan tepat di samping lemari pojok kiri (ruang pertama & ruang kedua depan, dekat meja guru)
for(const[sz,cx]of[[-1,-5.05],[-1,5.05],[1,-5.05],[1,5.05],[1,-4.05],[-1,-4.05]]){const cz=sz*14.7,f=-sz;box(0.9,2.1,0.6,0x3a2a1c,cx,1.05,cz);
 const dmat=new THREE.MeshLambertMaterial({color:0x4a3624}),hmat=new THREE.MeshLambertMaterial({color:0x999999}),hs=[],hnd=[];
 for(const side of[-1,1]){const g2=new THREE.Group();g2.position.set(cx+side*0.43,1.05,cz+f*0.31);S.add(g2);
  const dr=new THREE.Mesh(new THREE.BoxGeometry(0.42,1.9,0.03),dmat);dr.position.x=-side*0.21;g2.add(dr);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.2,0.04),hmat);hd.position.set(-side*0.38,0,f*0.03);g2.add(hd);hnd.push(hd);hs.push({g:g2,side})}
 cabs.push({pos:new THREE.Vector3(cx,1.0,cz+f*0.3),f,hs,hnd,mat:dmat,a:0,tgt:0})}
// Lampu neon berkedip
const ls=[];for(const z of[-10,-3,6,12]){box(0.2,0.05,2,new THREE.MeshBasicMaterial({color:0x2a2a3a}),0,H-0.05,z);
 const l=new THREE.PointLight(0x99aaff,0.4,13);l.position.set(0,H-0.3,z);S.add(l);ls.push(l)}
const AU={};
function play(n,v=1){const s=SND[n]||(n==='kunci'?SND.kertas:'');if(!s)return;try{let a=AU[n];if(!a)a=AU[n]=new Audio(s);a.volume=Math.max(0,Math.min(1,v));a.currentTime=0;a.play().catch(()=>{})}catch(e){}}
// Dua hantu (El Kalla & Oni), badan sama, wajah dan suara beda. Isi FACE_URL / FACE_URL2 (data: URI) untuk gambar wajah.
const GHN=['El Kalla','Oni'];
const GH=new THREE.Group(),faceMat=new THREE.MeshLambertMaterial({color:0x9a9a9a}),skin=M(0x000000),cloth=M(0x0c0c10);
function gb(w,h,d,m,x,y,z){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);GH.add(b)}
gb(0.22,0.7,0.22,cloth,-0.13,0.35,0);gb(0.22,0.7,0.22,cloth,0.13,0.35,0);gb(0.5,0.75,0.25,cloth,0,1.075,0);
gb(0.2,0.7,0.2,cloth,-0.35,1.1,0);gb(0.2,0.7,0.2,cloth,0.35,1.1,0);
const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),[skin,skin,skin,skin,faceMat,skin]);head.position.y=1.7;GH.add(head);
const gl=new THREE.PointLight(0xff2020,1,8);gl.position.y=1.5;GH.add(gl);GH.visible=false;S.add(GH);
const faceTex=[null,null];let faceCur=0;
function setGhost(i){i=i?1:0;faceCur=i;const t=faceTex[i];faceMat.map=t;faceMat.color.set(t?0xffffff:(i?0xaa3030:0x9a9a9a));faceMat.needsUpdate=true}
[FACE_URL,typeof FACE_URL2!=='undefined'?FACE_URL2:''].forEach((u,i)=>{if(u)new THREE.TextureLoader().load(u,t=>{faceTex[i]=t;if(faceCur===i)setGhost(i)})});
// Mode permainan: total soal, detik hantu pertama muncul setelah spawn (delay), durasi hilang (gone). Durasi muncul tetap AMB_ACT.
const DIFF={mudah:{n:'MUDAH',total:15,delay:55,lv:1,col:'#4caf50'},sedang:{n:'SEDANG',total:10,delay:40,lv:2,col:'#e0a030'},sulit:{n:'SULIT',total:5,delay:30,lv:3,col:'#e53935'}};
let AMB_ACT=25,AMB_DELAY=40,curD='sedang',MP=false;let amb=false,tm=0,bt;
const hudEl=$('hud'),pr=$('pr'),pn=$('pn'),bn=$('bn'),ov=$('ov');
function banner(t,ms){bn.innerHTML=t;bn.style.display='block';clearTimeout(bt);bt=setTimeout(()=>bn.style.display='none',ms)}
[skin,cloth,faceMat].forEach(m=>m.transparent=true);
function ghVis(v){GH.visible=v>0.01;[skin,cloth,faceMat].forEach(m=>m.opacity=v);gl.intensity=v} // tampilan saja (jumpscare), tidak mengubah status hantu
function ghOp(v){GS.op=v;ghVis(v)}
// Patroli hantu (El Kalla & Oni, rute sama, bergantian tiap putaran): graf titik di lorong (x=+-2.7) + depan 4 lemari. idle -> in(diam 3dtk fade in di tengah) -> go(patroli/kejar) <-> chk(periksa lemari 5dtk) -> out(fade out 1dtk)
const GN={H:[0,1.4]};for(const x of[-1,1]){GN['B'+x]=[x*2.7,1.4];GN['A'+x]=[x*2.7,11.5];GN['C'+x]=[x*2.7,-11.5];for(const z of[-1,1]){GN['Q'+x+z]=[x*2.7,z*13.4];GN['K'+x+z]=[x*5.05,z*13.4]}}
const GE={};const ge=(a,b)=>{(GE[a]=GE[a]||[]).push(b);(GE[b]=GE[b]||[]).push(a)};
for(const x of[-1,1]){ge('H','B'+x);ge('B'+x,'A'+x);ge('B'+x,'C'+x);for(const z of[-1,1]){ge(z>0?'A'+x:'C'+x,'Q'+x+z);ge('Q'+x+z,'K'+x+z)}}ge('A-1','A1');ge('C-1','C1');
function gpath(a,b){const q=[[a]],seen={[a]:1};while(q.length){const p=q.shift(),n=p[p.length-1];if(n===b)return p;for(const m of GE[n]||[])if(!seen[m]){seen[m]=1;q.push([...p,m])}}return[b]}
function gnear(x,z){let b='H',bd=1e9;for(const n in GN){const d=Math.hypot(GN[n][0]-x,GN[n][1]-z);if(d<bd){bd=d;b=n}}return b}
const GS={st:'idle',cd:55,t:0,x:0,z:0,ry:0,op:0,path:[],wait:0,todo:[],spd:2.09,act:20,delay:55,lv:1,cab:-1,onApp:null,gid:0,nx:0};
// Giliran hantu: putaran 1 El Kalla, putaran 2 Oni, putaran 3 El Kalla, dst. Tiap kemunculan memanggil gPick().
function gPick(){GS.gid=GS.nx;GS.nx^=1;setGhost(GS.gid);return GS.gid}
function gCfg(delay,act,lv){GS.delay=delay;GS.act=act;GS.lv=lv;GS.spd=1.9*(1+0.1*lv);GS.nx=0;GS.gid=0;setGhost(0);gReset()}
function gReset(){GS.st='idle';GS.cd=GS.delay;ghOp(0);amb=false}
function gPlan(){const cur=gnear(GS.x,GS.z);let n=GS.todo.shift();if(!n){GS.todo=['K-1-1','K11','K1-1','K-11'].sort(()=>Math.random()-.5);n=GS.todo.shift()}GS.path=gpath(cur,n);GS.arrive=0;GS.st='go'}
// tg=[{id,x,z,h}] pemain yang bisa diculik. Mengembalikan id yang tertangkap.
function gTick(dt,tg){const g=GS,hit=[];
 if(g.st==='idle'){ghOp(0);g.cd-=dt;if(g.cd<=0){g.st='in';g.t=0;g.x=0;g.z=1.4;g.todo=[];gPick();ghOp(0);GH.position.set(0,0,1.4);amb=true;if(g.onApp)g.onApp()}return hit}
 if(g.st==='rush0')return hit; // menunggu pemain yang gagal menoleh (dijalankan di mp.js)
 if(g.st==='rush'){const p=tg.find(q=>q.id===g.rid);
  if(p){const dx=p.x-g.x,dz=p.z-g.z,d=Math.hypot(dx,dz);g.ry=Math.atan2(dx,dz);if(d>1.0){g.x+=dx/d*FAIL_GH_SPD*dt;g.z+=dz/d*FAIL_GH_SPD*dt}else{if(!p.h)hit.push(p.id);g.st='go';g.t=g.act-10;g.path=[];g.arrive=0}}
  else{g.st='go';g.t=g.act-10;g.path=[];g.arrive=0}
  GH.position.set(g.x,0,g.z);GH.rotation.y=g.ry;return hit}
 g.t+=dt;
 if(g.st==='in'){ghOp(Math.min(1,g.t/3));if(g.t>=3)gPlan()}
 else if(g.st==='out'){ghOp(Math.max(0,1-(g.t-g.o)/1));if(g.t-g.o>=1)gReset()}
 else if(g.t>=g.act-1){g.st='out';g.o=g.t}
 else{let ch=null,bd=14;for(const p of tg){if(p.h)continue;const d=Math.hypot(p.x-g.x,p.z-g.z);if(d<bd&&((p.z>1.4)===(g.z>1.4)||Math.abs(g.z-1.4)<2)){bd=d;ch=p}}
  const mv=(tx,tz,v)=>{const dx=tx-g.x,dz=tz-g.z,d=Math.hypot(dx,dz);if(d>0.05){g.x+=dx/d*v*dt;g.z+=dz/d*v*dt;g.ry=Math.atan2(dx,dz)}return d};
  if(ch){g.st='go';g.path=[];g.arrive=0;mv(ch.x,ch.z,g.spd*1.45)} // melihat pemain yang tidak bersembunyi: +45% kecepatan
  else if(g.st==='chk'||g.st==='pz'){g.wait-=dt;if(g.wait<=0)gPlan()}
  else{const n=g.path[0];if(!n){if(g.arrive){g.arrive=0;g.st='chk';g.wait=5}else gPlan()}else if(mv(GN[n][0],GN[n][1],g.spd)<0.15){g.path.shift();if(!g.path.length)g.arrive=1}}
  for(const p of tg)if(!p.h&&Math.hypot(p.x-g.x,p.z-g.z)<1.0){hit.push(p.id);g.t=Math.min(g.t,g.act-10)}}
 GH.position.set(g.x,0,g.z);GH.rotation.y=g.ry;return hit}
function spawnGhost(){}
let scT=-1,scBase=null,scG=0;function stopSnd(n){const a=AU[n];if(a){a.pause();a.currentTime=0}}const fxEl=$('fx');
function caught(){over=true;started=false;stopMalam();ghStop();if(document.pointerLockElement)document.exitPointerLock();
 [pr,pn,bn,hudEl,$('hd'),$('fl'),$('ex')].forEach(e=>e.style.display='none');
 const P=C.position;scBase=P.clone();
 const dx=GH.position.x-P.x,dz=GH.position.z-P.z,d=Math.hypot(dx,dz)||1;
 GH.position.set(P.x+dx/d*0.55,P.y-1.7,P.z+dz/d*0.55);GH.rotation.y=Math.atan2(-dx,-dz);GH.scale.setScalar(1);ghVis(1); // hantu selalu terlihat penuh saat jumpscare (sebelumnya bisa transparan/hilang)
 yaw=Math.atan2(-dx,-dz);pitch=0;faceMat.emissive.setHex(0x555555);gl.intensity=3;spot.visible=true;
 scT=0;play('jumpscare')}
// Badan pemain (kotak ala Minecraft), terlihat saat menunduk. Gambar: SKIN.badan/tangan/kaki (lihat aset.js); kalau file tidak ada dipakai warna seragam.
// Kaki kanan maju => tangan kiri maju (dan sebaliknya). Badan ikut berputar mengikuti arah pandang, kepala boleh menoleh +-46 derajat dulu.
const BODY=new THREE.Group();BODY.visible=false;S.add(BODY);let walkN=0,bodyYaw=0,wph=0,wamp=0;
function skinM(url,col){const m=new THREE.MeshLambertMaterial({color:col,emissive:0x1c1c1c});if(url)new THREE.TextureLoader().load(url,t=>{t.magFilter=THREE.NearestFilter;m.map=t;m.color.set(0xffffff);m.needsUpdate=true},undefined,()=>{});return m}
// Atlas full body: susunan salib (atas, bawah / kanan, depan, kiri, belakang). Ukuran dalam satuan blok (w,h,d) sama dgn balok, resolusi gambar bebas asal rasionya sama.
function atlasUV(geo,w,h,d){const W=2*d+2*w,H=d+h,R=[[0,d,d,h],[d+w,d,d,h],[d,0,w,d],[d+w,0,w,d],[2*d+w,d,w,h],[d,d,w,h]],uv=geo.attributes.uv; // urutan sisi three: +x(kanan),-x(kiri),+y(atas),-y(bawah),+z(belakang),-z(depan)
 R.forEach(([x,y,rw,rh],k)=>{const u0=x/W,u1=(x+rw)/W,vT=1-y/H,vB=1-(y+rh)/H;let p=[[u0,vT],[u1,vT],[u0,vB],[u1,vB]];if(k===2)p=[[u1,vB],[u0,vB],[u1,vT],[u0,vT]];p.forEach((q,i)=>uv.setXY(k*4+i,q[0],q[1]))});uv.needsUpdate=true}
const FULL=typeof SKIN_FULL!=='undefined'?SKIN_FULL:{};
function bg(w,h,d,url,bw,bh,bd){const g=new THREE.BoxGeometry(w,h,d);if(url)atlasUV(g,bw,bh,bd);return g}
const torso=new THREE.Mesh(bg(0.46,0.7,0.23,FULL.badan,8,12,4),skinM(FULL.badan||SKIN.badan,0xe4e8ee));torso.position.set(0,1.05,0.16);BODY.add(torso);
function limb(x,y,mat,full){const g=new THREE.Group();g.position.set(x,y,0.16);const m=new THREE.Mesh(bg(0.23,0.7,0.23,full,4,12,4),mat);m.position.y=-0.35;g.add(m);BODY.add(g);return g}
const mArmL=skinM(FULL.tanganKiri||SKIN.tangan,0xe0b48c),mArmR=skinM(FULL.tanganKanan||SKIN.tangan,0xe0b48c),mLegL=skinM(FULL.kakiKiri||SKIN.kaki,0x3d4452),mLegR=skinM(FULL.kakiKanan||SKIN.kaki,0x3d4452),
armL=limb(-0.345,1.4,mArmL,FULL.tanganKiri),armR=limb(0.345,1.4,mArmR,FULL.tanganKanan),legL=limb(-0.115,0.7,mLegL,FULL.kakiKiri),legR=limb(0.115,0.7,mLegR,FULL.kakiKanan);
// Lengan kanan orang pertama yang memegang senter (ikut tampil/hilang bersama senter). Tekstur sama dengan tangan kanan badan.
{const L=0.7*0.45,dir=new THREE.Vector3(-0.2,0.3,-0.93).normalize(),grip=new THREE.Vector3(0,0,0.02),gp=new THREE.Group(),m=new THREE.Mesh(bg(0.23,0.7,0.23,FULL.tanganKanan,4,12,4),mArmR);
 m.position.y=-0.35;gp.add(m);gp.scale.setScalar(0.45);gp.position.copy(grip).addScaledVector(dir,-L);gp.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir);TVM.add(gp)}
function bodyUpd(dt){const on=started&&!hid&&!ended&&!fl2;BODY.visible=on;TVM.visible=on&&spot.visible;armR.visible=!TVM.visible;if(!on){bodyYaw=yaw;return}
 const d=Math.atan2(Math.sin(yaw-bodyYaw),Math.cos(yaw-bodyYaw));
 if(walkN)bodyYaw+=d*Math.min(1,dt*8);
 else{bodyYaw+=d*Math.min(1,dt*1.8);const d2=Math.atan2(Math.sin(yaw-bodyYaw),Math.cos(yaw-bodyYaw));if(Math.abs(d2)>0.8)bodyYaw+=(d2-Math.sign(d2)*0.8)*Math.min(1,dt*10)} // diam: badan pelan-pelan menyusul arah pandang
 BODY.position.set(C.position.x,0,C.position.z);BODY.rotation.y=bodyYaw;
 wamp+=((walkN?1:0)-wamp)*Math.min(1,dt*6);if(walkN)wph+=dt*(k.ShiftLeft?8:5)*walkN;
 const s=Math.sin(wph)*wamp;legR.rotation.x=s*0.55;legL.rotation.x=-s*0.55;armL.rotation.x=s*0.45;armR.rotation.x=-s*0.45}
// Kertas soal: 20 lembar total, 5 lembar acak per gelombang (minimal 2 di meja tengah)
let TOTAL=20,FAIL_AT=10;const PER=5;let wrong=0,locked=false,fl2=null,sTim=0,failWrong=false,phase=0,hasKey=false,keyObj=null,nearKey=false;
let qq=[];const nextQ=()=>qq.pop();
const paperMat=new THREE.MeshLambertMaterial({color:0xeeeecc,emissive:0x2a2a1c});
pr.onclick=()=>interact();
let papers=[],found=0,reading=null,near=null,hid=false,nearCab=null,saved=null,hidCab=null,nearDoor=-1,ended=false;
const dpos=[new THREE.Vector3(-5.4,1.2,-EZ),new THREE.Vector3(-5.4,1.2,EZ)];
function upd(){if(MP&&window.mpHud)return mpHud();hudEl.textContent='Kertas: '+found+'/'+TOTAL+'   Salah: '+wrong+'/'+FAIL_AT}
function spawnPapers(){
 const all=slots.map((_,i)=>i).sort(()=>Math.random()-.5),np=Math.min(PER,qq.length);
 const isl=all.filter(i=>slots[i][3]).slice(0,2),rest=all.filter(i=>!isl.includes(i)).slice(0,np-2);
 [...isl,...rest].slice(0,np).forEach(si=>{const[x0,dr,z]=slots[si];
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.01,0.16),paperMat);
  m.position.set(x0+dr*0.45,0.78,z-0.32);m.rotation.y=(Math.random()-0.5)*1.2;
  m.userData.soal=nextQ();S.add(m);papers.push(m)});upd()}
function applyDiff(d){const c=DIFF[d];if(!c)return;curD=d;TOTAL=Math.min(c.total,SOAL.length);FAIL_AT=Math.ceil(TOTAL*0.5);AMB_ACT=25;gCfg(c.delay,25,c.lv);
 papers.forEach(p=>S.remove(p));papers=[];found=0;wrong=0;qq=[...SOAL].sort(()=>Math.random()-.5).slice(0,TOTAL);spawnPapers();
 $('gt').textContent=TOTAL;$('gf').textContent=FAIL_AT}
applyDiff('sedang');
function unlock(){if(!fl2&&!ended&&!over)locked=false}
let hiding=false;
function hide(c){if(hid||hiding)return;hiding=true;play('lemariBuka');setTimeout(()=>play('lemariTutup'),700);locked=true;hidCab=c;c.tgt=1;
 setTimeout(()=>{hiding=false;if(over||ended)return;saved=C.position.clone();C.position.set(c.pos.x,1.5,c.pos.z-c.f*0.15);yaw=c.f>0?Math.PI:0;pitch=0;hid=true;spot.visible=false;$('hd').style.display='block';$('ex').style.display='block';if(window.mpOnHide)mpOnHide(c);
  setTimeout(()=>{c.tgt=0;unlock()},120)},350)}
// Keluar lemari: pintu terbuka, pemain keluar, lalu pintu menutup lagi
function unhide(){if(MP&&window.mpOnUnhide)mpOnUnhide(hidCab);play('lemariBuka');setTimeout(()=>play('lemariTutup'),700);const c=hidCab;locked=true;c.tgt=1;
 setTimeout(()=>{if(over||ended)return;C.position.copy(saved);hid=false;spot.visible=flOn;$('hd').style.display='none';$('ex').style.display='none';
  setTimeout(()=>{c.tgt=0;unlock()},400)},250)}
const fw=new THREE.Vector3(),tv=new THREE.Vector3();
function checkPaper(){
 if(reading||!started||locked){pr.style.display='none';return}
 if(hid){pr.style.display='none';return}
 C.getWorldDirection(fw);near=null;nearCab=null;nearKey=false;let best=2.3;
 if(keyObj){tv.copy(keyObj.position).sub(C.position);if(tv.length()<2.6&&tv.normalize().dot(fw)>0.6)nearKey=true}
 for(const p of papers){tv.copy(p.position).sub(C.position);const d=tv.length();if(d<best&&tv.normalize().dot(fw)>0.8){best=d;near=p}}
 if(!near){let bc=2.4;for(const c of cabs){tv.copy(c.pos).sub(C.position);tv.y=0;const d=tv.length();if(d<bc&&tv.normalize().dot(fw)>0.6){bc=d;nearCab=c}}}
 nearDoor=-1;if(!near&&!nearKey&&!nearCab){dpos.forEach((d,i)=>{tv.copy(d).sub(C.position);tv.y=0;if(tv.length()<2.2&&tv.normalize().dot(fw)>0.6)nearDoor=i})}
 pr.textContent=(MP&&window.mpDoorOpen&&mpDoorOpen()&&nearDoor===0&&!near)?'[E] Keluar lewat pintu':near?(tc?'Ketuk untuk membaca kertas':'[E] Baca kertas'):nearKey?(tc?'Ketuk untuk mengambil kunci':'[E] Ambil kunci'):nearCab?(MP&&window.mpOcc&&mpOcc(nearCab)?'Lemari sudah terisi':tc?'Ketuk untuk bersembunyi':'[E] Sembunyi'):(hasKey&&nearDoor===0?(tc?'Ketuk untuk membuka pintu':'[E] Buka pintu'):(tc?'Pintu terkunci':'[E] Pintu terkunci'));
 pr.style.display=(near||nearKey||nearCab||nearDoor>=0)?'block':'none'}
function qHtml(s,ord){const esc=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),ql=s.q.split('\n');
 return '<div style="font-size:17px;margin-bottom:10px;text-align:left">'+esc(ql[0])+'</div>'+(ql.length>1?'<pre style="text-align:left;background:#222;color:#eee;padding:10px;border-radius:6px;font-size:13px;overflow:auto;margin:0 0 10px;white-space:pre-wrap">'+esc(ql.slice(1).join('\n'))+'</pre>':'')+ord.map((oi,i)=>{const t=s.o[oi];return '<button data-i="'+i+'" style="text-align:left;white-space:pre-wrap'+(/[\n;]/.test(t)?';font-family:ui-monospace,monospace;font-size:13px':'')+'">'+(tc?'':'<b style="opacity:.45">'+(i+1)+'</b>&nbsp; ')+esc(t)+'</button>'}).join('')}
function interact(){
 if(reading||locked)return;
 if(hid){unhide();return}
 if(!near&&nearKey){takeKey();return}
 if(!near&&nearCab){if(MP)mpCab(nearCab);else hide(nearCab);return}
 if(!near&&nearDoor>=0){doorUse(nearDoor);return}
 if(!near)return;play('kertas');reading=near;const s=near.userData.soal;
 // Jawaban diacak tiap kertas dibuka; urutan baru selalu beda dari sebelumnya (jadi setelah salah, posisi bertukar)
 const prev=near.userData.ord;let ord;do{ord=s.o.map((_,i)=>i);for(let i=ord.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[ord[i],ord[j]]=[ord[j],ord[i]]}}while(prev&&ord.every((v,i)=>v===prev[i])&&ord.length>1);
 near.userData.ord=ord;near.userData.pick=-1;
 pn.innerHTML=qHtml(s,ord);
 pn.style.display='block';pr.style.display='none';
 pn.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>answer(+b.dataset.i))}
function answer(i){
 if(!reading||reading.userData.lock)return;const rd=reading,sl=rd.userData.soal;if(i>=sl.o.length)return;
 const ok=rd.userData.ord[i]===sl.b,bs=pn.querySelectorAll('button[data-i]');rd.userData.lock=true;rd.userData.pick=i;
 if(ok){bs[i].style.background='#2e9e45';bs[i].style.color='#fff';rd.userData.done=true}else{bs[i].style.background='#d33';bs[i].style.color='#fff';wrong++;upd();if(MP&&window.mpWrong)mpWrong()}
 play(ok?'berhasil':'gagal');setTimeout(()=>{if(reading===rd)closePaper()},1500)}
function closePaper(){
 const r=reading;reading=null;pn.style.display='none';if(r)r.userData.lock=false;
 if(MP){if(r&&r.userData.done)mpSolve(r.userData.id);else if(wrong>=FAIL_AT)mpFail();return}
 if(r&&r.userData.done){S.remove(r);papers=papers.filter(p=>p!==r);found++;upd();
  if(found>=TOTAL){play('selesai');setTimeout(callScene,800);return}
  if(!papers.length){spawnPapers();banner('Gelombang '+(found/PER+1)+'/'+Math.ceil(TOTAL/PER)+'<br>'+Math.min(PER,TOTAL-found)+' lembar soal baru muncul di meja!',4000)}}
 else if(wrong>=FAIL_AT)failSeq()}
function blk(x,z){return(Math.abs(x)<1.75&&((z>-11.0&&z<-0.65)||(z>2.1&&z<10.1)))||(Math.abs(x)<1.3&&Math.abs(z)>12.55)}
// Kontrol
const k={},mv={x:0,y:0};
function toggleFl(){if(!hid&&started&&!over&&!ended){flOn=!flOn;spot.visible=flOn;play('senter')}}
addEventListener('keydown',e=>{k[e.code]=1;if(e.code==='KeyF')toggleFl();if(e.code==='KeyE'&&started)interact();if(reading&&e.key>='1'&&e.key<='4')answer(+e.key-1)});
addEventListener('keyup',e=>k[e.code]=0);
addEventListener('blur',()=>{for(const c in k)k[c]=0;mv.x=mv.y=0}); // tombol tidak 'nyangkut' saat pindah jendela/tab
// PC: kursor terkunci saat main, jadi tombol KELUAR tidak bisa diklik. Saat di dalam lemari, klik kiri di layar = keluar
document.addEventListener('mousedown',e=>{if(hid&&!locked&&e.button===0&&e.target===R.domElement)interact()});
function look(dx,dy){if(locked)return;yaw-=dx*0.003;pitch=Math.max(-1.35,Math.min(1.2,pitch-dy*0.003))}
document.addEventListener('mousemove',e=>{if(document.pointerLockElement)look(e.movementX,e.movementY)});
function audio(){try{const a=new(window.AudioContext||webkitAudioContext)(),o=a.createOscillator(),f=a.createBiquadFilter(),v=a.createGain();
o.type='sawtooth';o.frequency.value=48;f.frequency.value=120;v.gain.value=0.03;o.connect(f);f.connect(v);v.connect(a.destination);o.start()}catch(e){}}
// Backsound halaman utama (isi SND.menu dengan data URI)
let bgm=null;
let ghA=null;
let ghAi=-1;
function ghUpd(v){const i=GS.gid?1:0,src=(i&&SND.hantu2)?SND.hantu2:SND.hantu;if(!src)return;if(ghA&&ghAi!==i){ghA.pause();ghA=null}if(!ghA){ghA=new Audio(src);ghA.loop=true;ghAi=i}ghA.volume=Math.max(0,Math.min(1,v));if(ghA.paused)ghA.play().catch(()=>{})}
function ghStop(){if(ghA){ghA.pause();ghA.currentTime=0}}
let nightA=null;
function playMalam(){if(!SND.malam)return;if(!nightA){nightA=new Audio(SND.malam);nightA.loop=true;nightA.volume=0.5}nightA.play().catch(()=>{})}
function stopMalam(){if(nightA)nightA.pause()}
function playBGM(){if(!SND.menu)return;if(!bgm){bgm=new Audio(SND.menu);bgm.loop=true;bgm.volume=0.6}bgm.play().catch(()=>{addEventListener('pointerdown',()=>{if(bgm&&ov.style.display!=='none')bgm.play().catch(()=>{})},{once:true})})}
function stopBGM(){if(bgm){bgm.pause();bgm.currentTime=0}}
// Cerita pembuka & ending
// Sound adegan cerita: musik latar per cerita (cerita/telepon/ending), suara mengetik, suara lanjut
let sA=null,kA=null;
function sMus(k){if(sA){sA.pause();sA=null}if(!k||!SND[k])return;sA=new Audio(SND[k]);sA.loop=(k!=='telepon'&&k!=='ending');sA.volume=0.6;sA.play().catch(()=>{})}
function typeOn(){if(!SND.ketik)return;if(!kA){kA=new Audio(SND.ketik);kA.loop=true;kA.volume=0.5}kA.play().catch(()=>{})}
function typeOff(){if(kA)kA.pause()}
// Kecepatan hantu (El Kalla/Oni) menyerbu pemain yang gagal (Multi Player): jalan biasa 2.2 x 1.75
const FAIL_GH_SPD=2.2*1.75;
let sc=[],sI=0,sT='',sP=0,sTm=null,sDn=null;
let sceneA=null;
function sceneStop(){if(sceneA){sceneA.pause();sceneA=null}}
function sceneSnd(s){sceneStop();if(!s.snd)return;try{const a=AU['s:'+s.snd]||(AU['s:'+s.snd]=new Audio(s.snd));a.currentTime=0;a.volume=1;a.play().catch(()=>{});sceneA=a}catch(e){}}
function story(a,d,mk){sc=a;sI=0;sDn=d;sMus(mk);$('st').style.display='flex';sShow()}
// Visual adegan: s.img = file gambar (16:9), s.sv = nama scene di SCN (cadangan / tanpa gambar), s.who = pembicara (WANDIH/GURU), s.fx = 'shake'/'flash'
function sVis(s){const st=$('st'),v=$('sv');v.innerHTML='';
 if(s.sv&&SCN[s.sv]){v.innerHTML=SCN[s.sv];st.classList.add('v')}else st.classList.remove('v');
 if(s.img){const im=new Image();im.alt='';im.onload=()=>{if(sc[sI]===s){v.innerHTML='';v.appendChild(im);st.classList.add('v')}};im.src=s.img}
 st.dataset.who=s.who||'';st.classList.remove('fx-shake','fx-flash');if(s.fx){void st.offsetWidth;st.classList.add('fx-'+s.fx)}}
function sShow(){const s=sc[sI];sceneSnd(s);sVis(s);$('st').style.background='radial-gradient(circle at 50% 35%,'+s.bg[0]+','+s.bg[1]+' 75%)';$('se').textContent=s.e;$('stt').textContent=s.t;sT=s.x;sP=0;$('sx').textContent='';$('sn').style.opacity=0;$('so').style.display='none';clearInterval(sTm);typeOn();sTm=setInterval(()=>{sP+=2;sFin()},28)}
function sFin(full){if(full)sP=sT.length;$('sx').textContent=sT.slice(0,sP);if(sP>=sT.length){clearInterval(sTm);typeOff();if(sc[sI].ok)$('so').style.display='inline-block';else $('sn').style.opacity=.7}}
function nextS(){if(sP<sT.length){sFin(true);return}if(sc[sI].ok)return;play('lanjut');sI++;if(sI>=sc.length)endS();else sShow()}
function endS(){clearInterval(sTm);typeOff();sMus(null);sceneStop();$('st').style.display='none';if(sDn)sDn()}
$('so').onclick=e=>{e.stopPropagation();play('lanjut');endS()};$('st').onclick=nextS;$('sk').onclick=e=>{e.stopPropagation();endS()};
addEventListener('keydown',e=>{if($('st').style.display==='flex'&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();nextS()}});
function startGame(){started=true;hudEl.style.display='block';playMalam();
 if(!au){au=1;audio();for(const n in SND)if(SND[n]&&n!=='menu'&&n!=='malam'&&n!=='cerita'&&n!=='ketik'&&n!=='telepon'&&n!=='ending'){const a=AU[n]=new Audio(SND[n]);a.muted=true;a.play().then(()=>{a.pause();a.muted=false}).catch(()=>{a.muted=false})}}
 if(!tc)R.domElement.requestPointerLock()}
function failSeq(){if(fl2||over)return;locked=true;failWrong=true;gReset();ghStop();gPick();banner('Kamu telah mencapai batas maksimal menjawab soal dengan salah!',1500);fl2={t:0,y0:yaw,p0:pitch,g:0};failGhost()}
// Hantu giliran berikutnya sudah berdiri tepat di belakang pemain (arah yang akan dilihat setelah menoleh) sejak pemain gagal
function failGhost(){const fy=fl2.y0+Math.PI,P=C.position;GH.position.set(P.x-Math.sin(fy)*1.9,0,P.z-Math.cos(fy)*1.9);GH.rotation.y=Math.atan2(P.x-GH.position.x,P.z-GH.position.z);GH.scale.setScalar(1);ghOp(1);ghUpd(1)}
// Multiplayer: pemain yang gagal terkunci, pesan 1,5 dtk, menoleh ke belakang sendiri, lalu menunggu hantu (digerakkan host) datang dari kejauhan
function mpFailSeq(){if(fl2||over||ended)return;locked=true;banner('Kamu telah mencapai batas maksimal menjawab soal dengan salah!',1500);fl2={t:0,y0:yaw,p0:pitch,g:0,mp:true}}
function showGuide(){$('gd').style.display='flex'}
// Single Player: setelah MULAI di cara bermain -> pilih mata pelajaran -> soal dibuat ulang sesuai mapel -> game dimulai (Multiplayer menimpa $('gs').onclick di mp.js)
$('gs').onclick=()=>{$('gd').style.display='none';$('mpk').style.display='flex'};
for(const k in MAPEL){const b=document.createElement('button');b.textContent=MAPEL[k];b.onclick=()=>{setMapel(k);applyDiff(curD);$('mpk').style.display='none';startGame()};$('mpkc').appendChild(b)}
function stopPlay(){started=false;stopMalam();ghStop();if(document.pointerLockElement)document.exitPointerLock();[pr,pn,bn,hudEl,$('fl'),$('hd'),$('ex')].forEach(e=>e.style.display='none');gReset()}
function setObj(t){hudEl.textContent='Tujuan: '+t}
// Ending berhasil: telepon guru -> ambil kunci di meja guru (ruang kedua/biru) -> buka pintu -> fade out -> narasi -> OK -> halaman utama
function callScene(){if(phase)return;phase=1;stopPlay();story(CALL,resumeKey,'telepon')}
function resumeKey(){started=true;hudEl.style.display='block';playMalam();$('fl').style.display=tc?'block':'none';spawnKey();setObj('Ambil kunci di meja komputer depan (ruang biru)');banner('Ambil kunci di meja komputer depan (ruang biru),<br>lalu buka pintu di ruangan itu!',6000);if(!tc)R.domElement.requestPointerLock()}
function spawnKey(kx=-0.62,ky=0.83,kz=-13.3){const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0xffd24a});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(0.035,0.01,6,12),m);ring.rotation.x=Math.PI/2;g.add(ring);
 const sh=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.012,0.012),m);sh.position.x=0.085;g.add(sh);
 const tt=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.012,0.03),m);tt.position.set(0.12,0,0.015);g.add(tt);
 const l=new THREE.PointLight(0xffd24a,0.8,3);l.position.y=0.15;g.add(l);
 g.position.set(kx,ky,kz);S.add(g);keyObj=g}
function takeKey(){if(MP){mpSend({t:'kt'});return}S.remove(keyObj);keyObj=null;hasKey=true;nearKey=false;play('kunci');setObj('Buka pintu di ruangan ini (ruang biru)');banner('Kunci didapat!<br>Buka pintu di dinding samping dekat lemari.',5000)}
function doorUse(i){
 if(MP&&i===0){mpDoor();return}
 if(i===0&&hasKey){openDoor();return}
 if(i===0)banner(phase?'Pintu terkunci.<br>Ambil kunci di meja komputer depan (ruang biru).':'Pintu terkunci!<br>Selesaikan semua soal ('+found+'/'+TOTAL+')',2500);
 else banner('Pintu ini terkunci.',2000)}
let doorA=null;
// Buka pintu dengan kunci: pintu bergetar sebentar (kunci diputar) lalu mengayun ke dalam dengan engsel di sisi belakang, di baliknya gelap total (tengah malam), baru fade out
function animDoor(){play('pintuBuka');const[pa,pb]=exitDoors[0];
 box(0.02,2.4,1.2,new THREE.MeshBasicMaterial({color:0x000000}),-5.485,1.2,-EZ);doorA={pa,pb,t:0}}
function openDoor(){if(ended)return;ended=true;locked=true;animDoor();banner('Kunci diputar...<br>Pintu terbuka!',2500);
 setTimeout(()=>{const fo=$('fo');fo.style.display='block';requestAnimationFrame(()=>requestAnimationFrame(()=>{fo.style.opacity=1}))},1600);
 setTimeout(()=>{stopPlay();story(MONO,()=>story(END,()=>{location.hash='menu';location.reload()},'ending'),null);const fo=$('fo');fo.style.display='none';fo.style.opacity=0},3300)}
const LOAD_MSG=['Menyalakan lampu lab...','Menyusun komputer...','Menyebar lembar soal...','Mengunci pintu...','Membangunkan El Kalla dan Oni...'];
function runBar(ms,onP,done){const t0=performance.now();(function tk(){const p=Math.min(1,(performance.now()-t0)/ms);onP(p);if(p<1)requestAnimationFrame(tk);else done()})()}
// MULAI -> pilih tingkat kesulitan -> loading membangun map 10 detik -> cerita pembuka
$('pdb').onclick=()=>{ov.style.display='none';$('pd').style.display='flex'};$('pdx').onclick=()=>{$('pd').style.display='none';ov.style.display='flex'};
$('go').onclick=()=>{ov.style.display='none';$('sm').style.display='flex'};
$('sg').onclick=()=>{$('sm').style.display='none';$('md').style.display='flex'};$('sb').onclick=()=>{$('sm').style.display='none';ov.style.display='flex'};
$('mb').onclick=()=>{$('md').style.display='none';$('sm').style.display='flex'};
for(const d in DIFF){const c=DIFF[d],b=document.createElement('button');b.style.setProperty('--c',c.col);
 b.innerHTML='<b>'+c.n+'</b><span>'+c.total+' soal \u2022 batas salah '+Math.ceil(c.total*0.5)+'<br>'+Math.ceil(c.total/PER)+' gelombang \u2022 Hantu muncul '+c.delay+' dtk setelah mulai/bersembunyi \u2022 hadir 25 dtk \u2022 kecepatan +'+c.lv*10+'%</span>';
 b.onclick=()=>pickMode(d);$('mc').appendChild(b)}
function pickMode(d){applyDiff(d);$('md').style.display='none';stopBGM();const bl=$('bl');bl.style.display='flex';
 runBar(10000,p=>{$('lf2').style.width=p*100+'%';$('lp2').textContent=LOAD_MSG[Math.min(LOAD_MSG.length-1,p*LOAD_MSG.length|0)]+' '+(p*100|0)+'%'},()=>{bl.style.display='none';story(OPEN,showGuide,'cerita')})}
document.addEventListener('pointerlockchange',()=>{if(!MP&&!tc&&!document.pointerLockElement&&started&&!over&&!ended){started=false;stopMalam();ghStop();$('ps').style.display='flex'}});
$('rs').onclick=()=>{$('ps').style.display='none';started=true;playMalam();if(!tc)R.domElement.requestPointerLock()};
const T={},jy=$('jy'),jk=$('jk'),fl=$('fl'),cl=(v,a)=>Math.max(-a,Math.min(a,v));
if(tc)fl.style.display='block';fl.onclick=toggleFl;
addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(!started||t.target.tagName==='BUTTON')continue;
 const m=t.clientX<innerWidth/2;T[t.identifier]={x:t.clientX,y:t.clientY,px:t.clientX,py:t.clientY,m};
 if(m){jy.style.left=t.clientX+'px';jy.style.top=t.clientY+'px';jk.style.transform='none';jy.style.display='block'}}});
addEventListener('touchmove',e=>{if(!(e.target.closest&&e.target.closest('#pd')))e.preventDefault();for(const t of e.changedTouches){const o=T[t.identifier];if(!o)continue;
 if(o.m){const dx=t.clientX-o.x,dy=t.clientY-o.y;mv.x=cl(dx/50,1);mv.y=cl(dy/50,1);jk.style.transform='translate('+cl(dx,35)+'px,'+cl(dy,35)+'px)'}
 else{look((t.clientX-o.px)*1.5,(t.clientY-o.py)*1.5);o.px=t.clientX;o.py=t.clientY}}},{passive:false});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(T[t.identifier]&&T[t.identifier].m){mv.x=mv.y=0;jy.style.display='none'}delete T[t.identifier]}});
addEventListener('touchcancel',e=>{for(const t of e.changedTouches){if(T[t.identifier]&&T[t.identifier].m){mv.x=mv.y=0;jy.style.display='none'}delete T[t.identifier]}});
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()});
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),0.05),t=clock.elapsedTime;
if(!MP&&started&&!over&&!fl2){tm+=dt;GS.onApp=()=>{if(reading&&!reading.userData.lock)closePaper();banner(GHN[GS.gid].toUpperCase()+' MUNCUL!<br>Segera sembunyi di lemari!',5000)};
 const h=gTick(dt,[{id:0,x:C.position.x,z:C.position.z,h:hid}]);if(GS.op>0.01){ghUpd(1-Math.hypot(GS.x-C.position.x,GS.z-C.position.z)/14)}else ghStop();if(h.length&&!hid)caught()}
if(fl2&&!over){fl2.t+=dt; // gagal: pesan 1,5 dtk -> menoleh ke belakang sendiri (0,8 dtk) -> hantu datang dari kejauhan menuju pemain -> jumpscare wajah
 if(fl2.t<1.5){}
 else if(fl2.t<2.3){const k2=(fl2.t-1.5)/0.8,e2=k2*k2*(3-2*k2);yaw=fl2.y0+Math.PI*e2;pitch=fl2.p0*(1-e2)}
 else if(fl2.mp){yaw=fl2.y0+Math.PI;pitch=0;if(fl2.t>15){fl2=null;locked=false}} // MP: hantu digerakkan host, jumpscare saat host mengirim CT
 else{yaw=fl2.y0+Math.PI;pitch=0;fl2=null;caught()}} // setelah menoleh: hantu sudah ada di belakang -> langsung jumpscare
if(scT>=0){scT+=dt;
 if(scT<5){const a=0.05+scT*0.012;C.position.set(scBase.x+(Math.random()-.5)*a*2,scBase.y+(Math.random()-.5)*a,scBase.z+(Math.random()-.5)*a*2);GH.scale.setScalar(1+Math.random()*0.12)}
 else if(scT<13){if(!scG){scG=1;stopSnd('jumpscare');play('glitch')}GH.scale.setScalar(1);C.position.copy(scBase);if(Math.random()<0.6){const cs=R.domElement.style;cs.transform='translate('+((Math.random()-.5)*40)+'px,'+((Math.random()-.5)*10)+'px) scale('+(1+Math.random()*.08)+')';cs.filter='hue-rotate('+(Math.random()*360|0)+'deg) saturate('+(1+Math.random()*3)+') contrast('+(1+Math.random())+')';const a=Math.random()*90|0,b=Math.random()*90|0;fxEl.style.display='block';fxEl.style.background='linear-gradient(transparent '+a+'%,rgba(255,0,0,.4) '+a+'%,rgba(255,0,0,.4) '+(a+6)+'%,transparent '+(a+6)+'%),linear-gradient(transparent '+b+'%,rgba(0,255,255,.35) '+b+'%,rgba(0,255,255,.35) '+(b+4)+'%,transparent '+(b+4)+'%)'}}
 else if(scT<90){scT=100;if(MP){R.domElement.style.transform=R.domElement.style.filter='';fxEl.style.display='none';stopSnd('glitch');mpAfterScare();}else{stopSnd('glitch');R.domElement.style.transform=R.domElement.style.filter='';fxEl.style.display='none';C.position.copy(scBase);
  ov.innerHTML=(failWrong?'<h1>GAGAL!</h1><div>Kamu menjawab sebagian soal dengan salah, kamu gagal!<br>Kamu harus memulai dari awal game.':'<h1>KAMU DICULIK!</h1><div>'+GHN[GS.gid]+' menculikmu.<br>Kamu harus memulai dari awal game.')+'<br>Soal benar: '+found+'/'+TOTAL+'</div><button onclick="location.hash=\'menu\';location.reload()">MULAI DARI AWAL</button>';ov.style.display='flex'}}}
walkN=0;
if(started&&!reading&&!hid&&!locked){const fx=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)-mv.y,sx=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+mv.x;
 const sp=(k.ShiftLeft?4:2.2)*dt,p=C.position,ox=p.x,oz=p.z;walkN=(fx||sx)?(fx<0?-1:1):0;
 p.x+=(-Math.sin(yaw)*fx+Math.cos(yaw)*sx)*sp;p.z+=(-Math.cos(yaw)*fx-Math.sin(yaw)*sx)*sp;
 const mx=Math.abs(p.z)>12.4?5.0:3.7;p.x=Math.max(-mx,Math.min(mx,p.x));p.z=Math.max(-14.2,Math.min(14.2,p.z));
 if(blk(p.x,p.z)){if(!blk(p.x,oz))p.z=oz;else if(!blk(ox,p.z))p.x=ox;else{p.x=ox;p.z=oz}}
 if(fx||sx){stT+=dt;if(stT>(k.ShiftLeft?0.32:0.5)){stT=0;play('langkah',0.7)}}else stT=0.3;
 p.y=1.6+((fx||sx)?Math.sin(t*9)*0.02:0)}
C.rotation.y=yaw;C.rotation.x=pitch;
for(const c of cabs){if(c.a!==c.tgt){const d=c.tgt-c.a,st=dt*3;c.a=Math.abs(d)<=st?c.tgt:c.a+Math.sign(d)*st;const e=c.a*c.a*(3-2*c.a)*1.9;c.hs.forEach(h=>h.g.rotation.y=h.side*c.f*e)}
 const op=(hid&&hidCab===c&&c.a<0.05)?0.15:1;if(c.mat.opacity!==op){c.mat.opacity=op;c.mat.transparent=op<1;c.mat.needsUpdate=true;c.hnd.forEach(h=>h.visible=op===1)}}
if(doorA){doorA.t+=dt;const t=doorA.t;let a=0;if(t<0.45)a=Math.abs(Math.sin(t*45))*0.03*Math.min(1,t*6);else{const k=Math.min(1,(t-0.45)/1.3);a=k*k*(3-2*k)*1.75}
 doorA.pa.rotation.y=a;doorA.pb.rotation.y=-a}
ls.forEach(l=>{l.intensity+=((Math.random()<0.03?0.02:0.4)-l.intensity)*0.4});
if(keyObj)keyObj.rotation.y+=dt*1.5;bodyUpd(dt);checkPaper();if(MP&&window.mpTick)mpTick(dt,t);R.render(S,C)}
// Loading awal (hanya bar + persen, kredit di bawahnya) -> disclaimer (fade in/out) -> halaman utama. Dengan #menu langsung ke halaman utama
const LOAD_AWAL_DETIK=5;
(function(){const ld=$('ld'),dc=$('dc');
 if(location.hash==='#menu'||(()=>{try{return sessionStorage.getItem('mlab_sess')||sessionStorage.getItem('mlab_rm')}catch(e){return 0}})()){history.replaceState(null,'',location.pathname+location.search);ld.style.display='none';setTimeout(playBGM,300);return}
 function disc(){dc.style.display='flex';requestAnimationFrame(()=>requestAnimationFrame(()=>{dc.style.opacity=1}));
  setTimeout(()=>{dc.style.opacity=0;setTimeout(()=>{dc.style.display='none';playBGM()},1300)},8500)}
 runBar(LOAD_AWAL_DETIK*1000,p=>{$('lf').style.width=p*100+'%';$('lp').textContent=(p*100|0)+'%'},()=>{ld.style.display='none';disc()})})();
loop();
