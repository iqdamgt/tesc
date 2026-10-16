// MIDNIGHT LAB.. - fitur tambahan (dimuat setelah mp.js):
// pengaturan, spectator, tanda cepat (ping), main lagi, menyambung kembali.
// ===== Pengaturan =====
const CFG=Object.assign({mus:1,sfx:1,sens:1,scare:true},(()=>{try{return JSON.parse(localStorage.getItem('mlab_cfg')||'{}')}catch(e){return{}}})());
for(const k of['mus','sfx','sens'])if(!(CFG[k]>=0))CFG[k]=1;CFG.scare=CFG.scare!==false;
const saveCfg=()=>{try{localStorage.setItem('mlab_cfg',JSON.stringify(CFG))}catch(e){}};
// Volume musik & efek dipisah: semua objek Audio ditandai kategorinya, volume akhir = volume asli x pengaturan
(function(){const A0=window.Audio,vd=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume'),tr=[],
 mus=[SND.menu,SND.malam,SND.ending,SND.cerita,SND.telepon].filter(Boolean),gain=a=>a._m?CFG.mus:CFG.sfx;
 window.Audio=function(src){const a=arguments.length?new A0(src):new A0();let v=1;a._m=mus.includes(src);
  Object.defineProperty(a,'volume',{get(){return v},set(x){v=x;vd.set.call(a,Math.max(0,Math.min(1,x*gain(a))))},configurable:true});a.volume=1;tr.push(a);if(tr.length>200)tr.shift();return a};
 window.Audio.prototype=A0.prototype;window.applyVol=()=>tr.forEach(a=>{a.volume=a.volume})})();
{const _look=look;look=(dx,dy)=>_look(dx*CFG.sens,dy*CFG.sens);
 const _caught=caught;caught=function(){_caught();if(!CFG.scare){stopSnd('jumpscare');scT=13.01;scG=1}}}
function cfgUi(){for(const[k,l]of[['mus','c_mv'],['sfx','c_sv2']]){$('c_'+k).value=CFG[k];$(l).textContent=Math.round(CFG[k]*100)+'%'}$('c_sens').value=CFG.sens;$('c_sv').textContent=CFG.sens.toFixed(1)+'x';$('c_scare').checked=CFG.scare}
for(const k of['mus','sfx','sens'])$('c_'+k).oninput=e=>{CFG[k]=+e.target.value;saveCfg();cfgUi();applyVol()};
$('c_scare').onchange=e=>{CFG.scare=e.target.checked;saveCfg()};
$('cfg').addEventListener('keydown',e=>e.stopPropagation());$('cfg').addEventListener('keyup',e=>e.stopPropagation());
$('cfgb').onclick=()=>{cfgUi();$('cfg').style.display='flex'};
$('c_ok').onclick=()=>{$('cfg').style.display='none';if(MP&&started&&!tc&&!chatOn)R.domElement.requestPointerLock()};
cfgUi();
{const _co=chatOpen;chatOpen=o=>{if(o){for(const c in k)k[c]=0;mv.x=mv.y=0}_co(o)}}
$('cfgb').addEventListener('click',()=>{for(const c in k)k[c]=0});
// ===== Spectator =====
let specP=0,specGT=0;
const specList=()=>roster.filter(r=>r.id!==myId&&!gone[r.id]&&st[r.id]&&rem[r.id]).map(r=>r.id);
const specLabel=()=>{$('spn').textContent='👁 '+nameOf(spec)};
window.startSpec=function(){const l=specList();if(!l.length)return false;spec=l[0];specP=st[spec].p||0;spot.visible=false;faceMat.emissive.setHex(0);
 $('hd').style.display='none';$('spb').style.display='flex';$('mpc').style.display='flex';specLabel();return true};
window.stopSpec=function(){spec=null;$('spb').style.display='none';specQ='';pn.style.display='none';pn.style.pointerEvents='';TVM.visible=false};
function specNext(d){const l=specList();if(!l.length)return;spec=l[(Math.max(0,l.indexOf(spec))+d+l.length)%l.length];specP=st[spec].p||0;specQ="";specLabel()}
window.specTick=function(dt){if(!spec)return;
 const dd=!!(gone[spec]&&rem[spec]&&st[spec]&&rem[spec].dead);specGT=dd?specGT+dt:0; // pemain yang ditonton diculik: tahan kamera 2 dtk supaya penculikan terlihat, baru pindah
 if(dd?specGT>2:(gone[spec]||!rem[spec]||!st[spec])){specGT=0;const l=specList();if(!l.length){stopSpec();if(endMsg)showEnd();else panel('SEMUA TEMANMU SUDAH SELESAI','Menunggu hasil akhir permainan...',0);return}spec=l[0];specP=st[spec].p||0;specQ="";specLabel()}
 const s=st[spec],c=rem[spec].cur||s;specP+=((s.p||0)-specP)*Math.min(1,dt*10);
 C.position.set(c.x,s.h?1.5:1.6,c.z);yaw=c.y;pitch=specP;C.rotation.y=yaw;C.rotation.x=pitch;
 TVM.visible=!!s.f&&!s.h&&!gone[spec]; // senter di tangan pemain yang ditonton, sama seperti POV-nya
 specPaper(s)};
// Soal yang sedang dikerjakan pemain yang ditonton: tampil sama, hanya bisa dilihat (tidak bisa diklik)
let specQ='';
function specPaper(s){let key='';if(s.q!==undefined&&s.o){key=s.q+'|'+s.o.join()+'|'+s.k}
 if(key===specQ)return;specQ=key;
 if(!key){pn.style.display='none';return}
 const p=allP.find(x=>x.i===s.q),sl=p&&SOAL[p.q];if(!sl){pn.style.display='none';return}
 pn.innerHTML='<div style="font-size:12px;opacity:.65;margin-bottom:8px;text-align:left">👁 '+String(nameOf(spec)).replace(/[<>&]/g,'')+' sedang mengerjakan soal (hanya melihat)</div>'+qHtml(sl,s.o);
 pn.style.pointerEvents='none';pn.style.display='block';
 if(s.k>=0){const b=pn.querySelectorAll('button[data-i]')[s.k];if(b){const ok=s.o[s.k]===sl.b;b.style.background=ok?'#2e9e45':'#d33';b.style.color='#fff'}}}
$('spl').onclick=()=>specNext(-1);$('spr').onclick=()=>specNext(1);
addEventListener('keydown',e=>{if(spec&&!chatOn){if(e.code==='ArrowLeft')specNext(-1);if(e.code==='ArrowRight')specNext(1)}});
// ===== Tanda cepat (ping) =====
const PGK=[{t:'Soal di sini!',c:'#ffd24a',e:'📄'},{t:'Kunci di sini!',c:'#66ccff',e:'🔑'},{t:'HANTU!',c:'#ff4444',e:'👻'}];
let pings=[],pgLast=0;
function sendPing(k){if(!MP||!started||myCaught||myEsc||chatOn||reading||hid)return;const now=performance.now();if(now-pgLast<1200)return;pgLast=now;
 let x=C.position.x-Math.sin(yaw)*1.5,z=C.position.z-Math.cos(yaw)*1.5;if(k===2&&GS.op>0.01){x=GS.x;z=GS.z}
 mpSend({t:'pg',k,x,z});$('pgm').classList.remove('open')}
window.addPing=function(m){const K=PGK[m.k];if(!K)return;addChat('',m.n+': '+K.e+' '+K.t,1);play('kertas',0.6);
 pings=pings.filter(p=>{if(p.id===m.id&&p.k===m.k){S.remove(p.sp);return false}return true});
 const cv=document.createElement('canvas');cv.width=512;cv.height=144;const g=cv.getContext('2d');g.fillStyle='rgba(0,0,0,.65)';g.fillRect(0,0,512,144);g.strokeStyle=K.c;g.lineWidth=6;g.strokeRect(3,3,506,138);
 g.textAlign='center';g.fillStyle=K.c;g.font='bold 54px sans-serif';g.fillText(K.e+' '+K.t,256,70);g.fillStyle='#fff';g.font='36px sans-serif';g.fillText(String(m.n).replace(/[<>]/g,'').slice(0,14),256,118);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false,fog:false}));sp.renderOrder=999;sp.scale.set(2.4,0.675,1);sp.position.set(m.x,m.k===2?2.5:2.1,m.z);S.add(sp);pings.push({id:m.id,k:m.k,sp,t:0})};
window.pgTick=function(dt){for(const p of pings){p.t+=dt;p.sp.material.opacity=p.t<6?1:Math.max(0,1-(p.t-6)/2);p.sp.position.y+=Math.sin(p.t*3)*0.0015}
 pings=pings.filter(p=>{if(p.t>8){S.remove(p.sp);return false}return true})};
addEventListener('keydown',e=>{if(!MP||chatOn||e.repeat)return;if(e.code==='KeyZ')sendPing(0);else if(e.code==='KeyX')sendPing(1);else if(e.code==='KeyC')sendPing(2)});
$('pgb').onclick=()=>$('pgm').classList.toggle('open');$('pgm').querySelectorAll('button').forEach(b=>b.onclick=()=>sendPing(+b.dataset.k));
// ===== Main lagi (room yang sama) & menyambung kembali =====
// Dua-duanya memuat ulang halaman lalu masuk lagi otomatis: kode room dan nama dipertahankan.
window.rematchGo=function(host,mode){try{sessionStorage.removeItem('mlab_sess');sessionStorage.setItem('mlab_rm',JSON.stringify({code,host,n:nameOf(myId),mode,t:Date.now()}))}catch(e){}location.hash='menu';location.reload()};
$('rzr').onclick=()=>{$('rzr').disabled=true;bc({t:'RM',m:mmode});setTimeout(()=>rematchGo(true,mmode),600)};
(function resume(){let s=null,r=null;try{s=JSON.parse(sessionStorage.getItem('mlab_sess')||'null');r=JSON.parse(sessionStorage.getItem('mlab_rm')||'null');sessionStorage.removeItem('mlab_rm')}catch(e){}
 if(r&&Date.now()-r.t<90000&&r.code){$('ov').style.display='none';dlg('Main lagi','Menyiapkan room '+r.code+'...','Batal',backMenu);mmode=r.mode||'sedang';
  if(r.host){isHost=true;myId='p0';roster=[{id:'p0',n:clean(r.n)}];openRoom(0,r.code)}else joinRoom(r.code,{name:r.n,tries:8})}
 else if(s&&s.code&&Date.now()-s.t<20*60e3&&(s.n||0)<2){$('ov').style.display='none';dlg('Menyambung kembali','Masuk lagi ke permainan di room '+s.code+'...','Batal',backMenu);joinRoom(s.code,{rj:s.id,tries:3})}
 else if(s||r)try{sessionStorage.removeItem('mlab_sess')}catch(e){}})();
// Cegah blok teks / menu "Cari di Google" saat menekan atau menahan tombol di layar (kecuali kolom ketik)
{const ok=e=>e.target&&e.target.closest&&e.target.closest('input,textarea');
for(const ev of['contextmenu','selectstart','dragstart'])document.addEventListener(ev,e=>{if(!ok(e))e.preventDefault()});
document.addEventListener('dblclick',e=>{if(!ok(e))e.preventDefault()})}

// ===== Shortcut keyboard tambahan (PC): Q tutup kertas, P jeda/lanjut (Single Player), M bisukan suara =====
(function(){let stash=null;
 addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||chatOn)return;
  const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;
  if(e.code==='KeyQ'){if(reading&&!reading.userData.lock)closePaper()}
  else if(e.code==='KeyP'){if($('ps').style.display==='flex')$('rs').click();else if(!MP&&!tc&&started&&!over&&!ended&&document.pointerLockElement)document.exitPointerLock()}
  else if(e.code==='KeyM'){if(stash){CFG.mus=stash.mus;CFG.sfx=stash.sfx;stash=null}else{stash={mus:CFG.mus,sfx:CFG.sfx};CFG.mus=CFG.sfx=0}
   applyVol();cfgUi();if(started&&!over)banner(stash?'Suara dimatikan (tekan M untuk menyalakan)':'Suara dinyalakan',1500)}})})();
