// MIDNIGHT LAB.. - multiplayer (PeerJS, pemilik room = host). Dimuat setelah game.js
const MDF={mudah:{n:'MUDAH',total:20,delay:55,lv:1,col:'#4caf50'},sedang:{n:'SEDANG',total:15,delay:40,lv:2,col:'#e0a030'},sulit:{n:'SULIT',total:10,delay:25,lv:3,col:'#e53935'}};
const SPX=[-1.5,-0.5,0.5,1.5],CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let hist=[],gtm={},score={},spec=null,QI=0;
let peer=null,conns={},isHost=false,myId='',code='',roster=[],mmode='sedang',msub='rpl',conn=null,go2=false,nid=1,st={},rem={},E={},gone={},keySpot=null,keyTaken=null,doorOp=false,myCaught=false,myEsc=false,endMsg=null,endSent=false,occ={},wave=0,allP=[],failSent=false,failMode=false,gT=null,sendT=0,scPos=null,scRy=0,mpObj='',chatOn=false;
const eid=i=>E[i]||(E[i]={}),nameOf=i=>(roster.find(r=>r.id===i)||{n:'?'}).n,clean=n=>String(n||'').replace(/[<>]/g,'').trim().slice(0,12)||'Pemain';
function dlg(t,m,b,cb){$('dt').textContent=t;$('dm').textContent=m;$('db').textContent=b||'OK';$('dlg').style.display='flex';$('db').onclick=()=>{$('dlg').style.display='none';cb&&cb()}}
const backMenu=()=>{try{sessionStorage.removeItem('mlab_sess');sessionStorage.removeItem('mlab_rm')}catch(e){}location.hash='menu';location.reload()};
const HK={G:1,SV:1,KY:1,KT:1,DO:1,CT:1,EX:1,LV:1,F:1},sco=i=>score[i]||(score[i]={b:0,s:0});
function bc(m){for(const i in conns)if(conns[i].open)conns[i].send(m)}
function all(m){if(isHost&&HK[m.t])hist.push(m);bc(m);apply(m)}
function mpSend(m){if(isHost)hostMsg('p0',m);else if(conn&&conn.open)conn.send(m)}
// ===== Menu & lobby =====
$('sm2').onclick=()=>{$('sm').style.display='none';$('mm').style.display='flex'};
$('mm0').onclick=()=>{$('mm').style.display='none';$('sm').style.display='flex'};
$('mjb').onclick=()=>{$('mjr').style.display='flex'};
$('mjg').onclick=()=>{const c=$('mjc').value.trim().toUpperCase();if(c.length<4)return dlg('Kode room','Masukkan kode room dengan benar.');joinRoom(c)};
$('mcr').onclick=()=>{isHost=true;myId='p0';roster=[{id:'p0',n:'Pemain 1'}];openRoom(0)};
function openRoom(n,cd){code=cd||'';if(!cd)for(let i=0;i<5;i++)code+=CH[Math.random()*CH.length|0];if(peer)try{peer.destroy()}catch(e){}peer=new Peer('mlab-'+code);roster[0].pid='mlab-'+code;
 peer.on('open',showLobby);peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
 peer.on('error',e=>{if(e.type==='unavailable-id'&&n<(cd?12:5))setTimeout(()=>openRoom(n+1,cd),cd?1500:0);else if(!go2)dlg('Gagal membuat room','Tidak bisa terhubung ke server. Periksa internet lalu coba lagi.','Kembali',backMenu)});
 peer.on('connection',c=>{c.on('data',m=>onHost(c,m));c.on('close',()=>onLeave(c))})}
// o = {name, rj (id untuk menyambung kembali), tries (sisa percobaan ulang)}
function joinRoom(cd,o){o=o||{};code=cd;let ok=0,done=0,to=0;
 const fail=m=>{if(done)return;done=1;clearTimeout(to);if(o.rj){try{sessionStorage.removeItem('mlab_sess')}catch(e){}m='Gagal menyambung kembali ke permainan. Pemilik room mungkin sudah keluar.'}dlg('Gagal masuk room',m,'Kembali',backMenu)},
 retry=()=>{if(done||!(o.tries>0))return false;done=1;clearTimeout(to);try{peer.destroy()}catch(e){}setTimeout(()=>joinRoom(cd,Object.assign({},o,{tries:o.tries-1})),2000);return true};
 peer=new Peer();
 to=setTimeout(()=>{if(!ok&&!retry())fail('Room tidak ditemukan atau koneksi terlalu lambat.')},12000);
 peer.on('open',()=>{conn=peer.connect('mlab-'+code,{reliable:true,serialization:'json'});conn.on('open',()=>conn.send(o.rj?{t:'rj',id:o.rj}:{t:'j',n:o.name}));conn.on('data',m=>{ok=1;clearTimeout(to);apply(m)});
  conn.on('close',onHostGone)});
 peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
 peer.on('error',e=>{if(done)return;if(e.type==='peer-unavailable'){if(!retry())fail('Kode room tidak ditemukan.')}else if(!ok&&!retry())fail('Tidak bisa terhubung ke server.')})}
function onHostGone(){if(endSent)return;
 if(go2&&!myEsc&&!myCaught){let sv=null;try{sv=JSON.parse(sessionStorage.getItem('mlab_sess')||'null')}catch(e){}
  if(sv){dlg('Koneksi terputus','Mencoba menyambung kembali ke permainan...','Batal',backMenu);setTimeout(()=>{try{sv.n=(sv.n||0)+1;sv.t=Date.now();sessionStorage.setItem('mlab_sess',JSON.stringify(sv))}catch(e){}location.hash='menu';location.reload()},1200);return}}
 if(!myEsc||spec)dlg('Room ditutup','Pemilik room keluar, koneksi terputus.','Kembali',backMenu)}
function onHost(c,m){
 if(m.t==='rj'){const r=roster.find(x=>x.id===m.id),e=r&&E[r.id];
  if(!go2||!r||(e&&(e.c||e.x))){c.send({t:'no',r:'Tidak bisa menyambung kembali: sesi permainan sudah berakhir untukmu.'});setTimeout(()=>c.close(),400);return}
  const old=conns[r.id];if(old&&old!==c){old._id=null;try{old.close()}catch(x){}}
  clearTimeout(gtm[r.id]);delete gtm[r.id];c._id=r.id;conns[r.id]=c;r.pid=c.peer;eid(r.id).l=0;E[r.id].r=0;delete st[r.id];
  hist=hist.filter(h=>!(h.t==='LV'&&h.id===r.id));c.send({t:'RJ',id:r.id,h:hist,o:occ});all({t:'RJN',id:r.id,n:r.n,pid:c.peer});return}
 if(m.t==='j'){if(go2||roster.length>=4){c.send({t:'no',r:go2?'Permainan sudah dimulai.':'Room penuh (maksimal 4 pemain).'});setTimeout(()=>c.close(),400);return}
 const id='p'+nid++;c._id=id;conns[id]=c;roster.push({id,n:m.n?clean(m.n):'Pemain '+(roster.length+1),pid:c.peer});c.send({t:'W',id});lob();return}
 if(c._id)hostMsg(c._id,m)}
function onLeave(c){const id=c._id;if(!id||conns[id]!==c)return;delete conns[id];if(!go2){roster=roster.filter(r=>r.id!==id);lob();return}
 const e=E[id];if(e&&(e.c||e.x))return markLeft(id);
 all({t:'DC',id,n:nameOf(id)});gtm[id]=setTimeout(()=>markLeft(id),15000)}
function markLeft(id){delete gtm[id];if(conns[id])return;eid(id).l=1;all({t:'LV',id,n:nameOf(id)});chkEnd()}
const lob=()=>all({t:'L',r:roster,m:mmode,s:msub});
function showLobby(){$('dlg').style.display='none';$('mm').style.display='none';$('lby').style.display='flex';renderLobby()}
function renderLobby(){$('m_code').textContent=code;$('m_list').innerHTML='';roster.forEach(r=>{const d=document.createElement('div');d.textContent=(r.id==='p0'?'👑 ':'👤 ')+r.n+(r.id===myId?' (kamu)':'');$('m_list').appendChild(d)});
 const c=MDF[mmode];$('m_stat').textContent='Pemain: '+roster.length+'/4 • Mode: '+c.n+' • Mapel: '+MAPEL[msub]+' • '+Math.min(c.total,BANK[msub].length)+' soal • hantu (El Kalla & Oni) muncul '+c.delay+' dtk';
 [...$('m_modes').children].forEach(b=>{b.classList.toggle('on',b.dataset.m===mmode);b.disabled=!isHost});
 [...$('m_subs').children].forEach(b=>{b.classList.toggle('on',b.dataset.s===msub);b.disabled=!isHost});
 $('m_start').style.display=isHost?'inline-block':'none';$('m_start').disabled=roster.length<2;$('m_wait').textContent=isHost?(roster.length<2?'Menunggu minimal 1 teman bergabung...':''):'Menunggu pemilik room memulai permainan...'}
for(const d in MDF){const b=document.createElement('button');b.dataset.m=d;b.textContent=MDF[d].n;b.style.setProperty('--c',MDF[d].col);b.onclick=()=>{if(isHost){mmode=d;lob()}};$('m_modes').appendChild(b)}
for(const k in MAPEL){const b=document.createElement('button');b.dataset.s=k;b.textContent=MAPEL[k];b.onclick=()=>{if(isHost){msub=k;lob()}};$('m_subs').appendChild(b)}
$('m_ok').onclick=()=>{const n=clean($('m_name').value);mpSend({t:'nm',n})};
$('m_cp').onclick=()=>{try{navigator.clipboard.writeText(code)}catch(e){}$('m_cp').textContent='Tersalin ✓'};
$('m_out').onclick=backMenu;$('m_start').onclick=()=>{if(roster.length>=2)hostGo()};
for(const i of['m_name','mjc','m_in','mpci'])$(i).addEventListener('keydown',e=>e.stopPropagation()),$(i).addEventListener('keyup',e=>e.stopPropagation());
// ===== Chat =====
function addChat(n,m,sys){for(const id of['m_log','mpcl']){const l=$(id),d=document.createElement('div');if(sys)d.className='sys';else{const b=document.createElement('b');b.textContent=n+': ';d.appendChild(b)}d.appendChild(document.createTextNode(m));l.appendChild(d);while(l.children.length>40)l.removeChild(l.firstChild);l.scrollTop=1e5;if(id==='mpcl')setTimeout(()=>d.classList.add('old'),12000)}}
const sendChat=i=>{const v=$(i).value.trim();$(i).value='';if(v)mpSend({t:'c',m:v})};
$('m_in').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')sendChat('m_in')};
function chatOpen(o){chatOn=o;$('mpc').classList.toggle('open',o);$('mpci').style.display=o?'block':'none';if(o){if(document.pointerLockElement)document.exitPointerLock();$('mpci').focus()}else{$('mpci').blur();if(!tc&&started)R.domElement.requestPointerLock()}}
$('mpci').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){sendChat('mpci');chatOpen(false)}if(e.key==='Escape')chatOpen(false)};
$('mpcb').onclick=()=>chatOpen(!chatOn);
addEventListener('keydown',e=>{if(MP&&e.code==='Enter'&&!chatOn){e.preventDefault();chatOpen(true)}});
// ===== Host: logika =====
function hostMsg(id,m){switch(m.t){
 case'nm':{const r=roster.find(x=>x.id===id);if(r){r.n=clean(m.n);lob()}break}
 case'c':all({t:'C',n:nameOf(id),m:String(m.m).slice(0,120)});break;
 case's':st[id]=m;break;
 case'rd':eid(id).r=1;break;
 case'wa':sco(id).s++;break;
 case'pg':{const e=eid(id),now=Date.now(),k=m.k|0;if(k<0||k>2||e.c||e.x||e.l||now-(e.pg||0)<1000)break;e.pg=now;const cl=(v,a)=>Math.max(-a,Math.min(a,+v||0));all({t:'PG',id,n:nameOf(id),k,x:cl(m.x,6),z:cl(m.z,16)});break}
 case'sv':if(papers.some(p=>p.userData.id===m.id)&&!eid(id).c){sco(id).b++;all({t:'SV',id:m.id,by:nameOf(id),f:found+1});if(found>=TOTAL)all({t:'KY',s:keySpot})}break;
 case'kt':if(!keyTaken&&keySpot&&found>=TOTAL&&!eid(id).c)all({t:'KT',by:id,n:nameOf(id)});break;
 case'do':if(keyTaken===id&&!doorOp)all({t:'DO',by:id});break;
 case'cb':all({t:'CB',id,i:m.i,ok:(!occ[m.i]||occ[m.i]===id)&&!eid(id).c?1:0});break;
 case'cu':if(occ[m.i]===id)all({t:'CU',i:m.i});break;
 case'fail':{const e=eid(id);if(e.c||e.x||e.l||GS.st==='rush0'||GS.st==='rush')break;gPick();all({t:'F',id,n:nameOf(id),g:GS.gid});const sx=id==='p0'?{x:C.position.x,z:C.position.z,y:yaw}:st[id],D=FAIL_GH_SPD*2.4; // muncul di belakang pemain gagal, tiba tepat saat ia selesai menoleh (2,4 dtk)
 GS.x=sx?sx.x+Math.sin(sx.y)*D:0;GS.z=sx?sx.z+Math.cos(sx.y)*D:0;GS.st='rush';GS.rid=id;GS.t=0;GS.todo=[];GS.path=[];amb=true;ghOp(1);GH.position.set(GS.x,0,GS.z);break}
 case'ex':eid(id).x=1;all({t:'EX',id,n:nameOf(id)});chkEnd();break}}
function genKey(){const r=Math.random(),sg=()=>Math.random()<.5?-1:1,s=slots[Math.random()*slots.length|0];
 if(r<1/3)return{x:s[0]+s[1]*1.25,y:0.52,z:s[2]}; // di atas kursi
 if(r<2/3)return Math.random()<.25?{x:sg()*0.55,y:0.83,z:sg()*13.3}:{x:s[0]+s[1]*0.4,y:0.81,z:s[2]+0.3}; // di atas meja (guru / komputer)
 return{x:sg()*(2.2+Math.random()*1.2),y:0.06,z:-10+Math.random()*20}} // di lantai
function hostGo(){const bk=BANK[msub]||BANK.rpl,tot=Math.min(MDF[mmode].total,bk.length),q=[...bk.keys()].sort(()=>Math.random()-.5),a=[],b=[];
 slots.forEach((s,i)=>(s[2]>1.4?a:b).push(i));a.sort(()=>Math.random()-.5);b.sort(()=>Math.random()-.5);
 const P=[];for(let i=0;i<tot;i++)P.push({i,s:i%2?b.pop():a.pop(),q:q[i]});go2=true;hist=[];all({t:'G',m:mmode,s:msub,P,K:genKey(),R:roster.map((r,i)=>({id:r.id,n:r.n,i,pid:r.pid}))})}
function chkEnd(){if(endSent)return;const al=roster.filter(r=>!(E[r.id]&&(E[r.id].c||E[r.id].x||E[r.id].l)));if(al.length)return;
 all({t:'EN',w:roster.filter(r=>E[r.id]&&E[r.id].x).map(r=>r.n),c:roster.filter(r=>E[r.id]&&E[r.id].c).map(r=>r.n),s:roster.map(r=>({n:r.n,b:sco(r.id).b,s:sco(r.id).s,x:E[r.id]&&E[r.id].x?1:E[r.id]&&E[r.id].c?2:3}))})}
// ===== Semua klien: terapkan pesan =====
function apply(m){if(m.q&&!QI){QI=1;const b=banner,p=play,a=addChat;banner=play=addChat=()=>{};try{apply(m)}finally{banner=b;play=p;addChat=a;QI=0}return}
switch(m.t){
 case'no':try{sessionStorage.removeItem('mlab_sess')}catch(e){}dlg('Tidak bisa masuk',m.r,'Kembali',backMenu);break;
 case'W':myId=m.id;showLobby();break;
 case'RJ':$('dlg').style.display='none';myId=m.id;go2=true;for(const h of m.h)apply(Object.assign({q:1},h));if(m.o)for(const i in m.o)if(m.o[i]!==myId)occ[i]=m.o[i];break;
 case'RJN':delete gone[m.id];{const r=roster.find(x=>x.id===m.id);if(r&&m.pid)r.pid=m.pid}if(m.id!==myId)addChat('',m.n+' tersambung kembali.',1);upd();break;
 case'DC':if(m.id!==myId)addChat('',m.n+' terputus. Menunggu tersambung kembali (15 dtk)...',1);break;
 case'PG':if(window.addPing)addPing(m);break;
 case'RM':if(window.rematchGo)rematchGo(false,m.m);break;
 case'L':roster=m.r;mmode=m.m;if(m.s&&BANK[m.s])msub=m.s;renderLobby();break;
 case'C':addChat(m.n,m.m);break;
 case'G':if(!isHost)try{sessionStorage.setItem('mlab_sess',JSON.stringify({code,id:myId,t:Date.now(),n:0}))}catch(e){}mpStart(m);break;
 case'S':for(const i in m.p)if(i!==myId&&!isHost)st[i]=m.p[i];if(!isHost)gT=m.g;break;
 case'GA':if(reading&&!reading.userData.lock)closePaper();banner(GHN[m.g|0].toUpperCase()+' MUNCUL!<br>Segera sembunyi di lemari!',5000);addChat('',GHN[m.g|0]+' muncul di lab!',1);break;
 case'CB':if(m.ok){occ[m.i]=m.id;if(m.id===myId)hide(cabs[m.i]);else cabAnim(m.i,470)}else if(m.id===myId)banner('Lemari ini sudah ditempati temanmu!<br>Cari lemari lain.',2500);break;
 case'CU':if(occ[m.i]&&occ[m.i]!==myId)cabAnim(m.i,650);delete occ[m.i];break;
 case'F':if(m.id!==myId&&!myCaught&&!myEsc&&!gone[myId])banner('\u26A0 '+m.n+' mencapai batas maksimal menjawab soal dengan salah!<br>'+GHN[m.g|0]+' datang! SEGERA sembunyi di lemari terdekat!',6000);addChat('',m.n+' terlalu banyak salah menjawab. '+GHN[m.g|0]+' datang!',1);break;
 case'SV':{const p=papers.find(x=>x.userData.id===m.id);found=m.f;if(p){if(reading===p){reading=null;pn.style.display='none'}S.remove(p);papers=papers.filter(x=>x!==p)}banner(m.by+' menjawab soal!<br>'+found+'/'+TOTAL,2500);
  if(!papers.length&&found<TOTAL){wave++;mkWave();banner('Gelombang '+(wave+1)+'/'+Math.ceil(TOTAL/PER)+'<br>'+papers.length+' lembar soal baru muncul di meja!',4500)}upd();break}
 case'KY':keySpot=m.s;if(keySpot.cab===undefined)spawnKey(keySpot.x,keySpot.y,keySpot.z);play('selesai');mpObj='Cari kunci pintu ruang biru';upd();
  banner('SEMUA SOAL SELESAI!<br>Cari kunci pintu ruang kedua: bisa di atas kursi, di atas meja, atau di lantai!',8000);break;
 case'KT':keyTaken=m.by;if(keyObj){S.remove(keyObj);keyObj=null}nearKey=false;if(m.by===myId){hasKey=true;play('kunci')}mpObj='Buka pintu di ruang biru (dinding kiri)';upd();banner(m.n+' mendapat kunci!<br>Buka pintu di ruang kedua (ruang biru).',6000);break;
 case'DO':doorOp=true;animDoor();mpObj='Keluar lewat pintu!';upd();banner('PINTU TERBUKA!<br>Semua segera keluar lewat pintu!',5000);if(m.by===myId)setTimeout(exitSeq,1600);break;
 case'CT':gone[m.id]=1;{const a=rem[m.id];if(a){a.dead=1;a.fT=0;a.g.traverse(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(0xaa0000)})}}
  if(m.id===myId){fl2=null;myCaught=true;caught();scPos=GH.position.clone();scRy=GH.rotation.y}else if(!myEsc)banner('\u26A0 '+nameOf(m.id)+' diculik '+GHN[m.g|0]+'!<br>SEGERA SEMBUNYI di lemari!',6000);for(const i in occ)if(occ[i]===m.id)delete occ[i];addChat('',nameOf(m.id)+' diculik '+GHN[m.g|0]+'!',1);upd();break;
 case'EX':gone[m.id]=1;for(const i in occ)if(occ[i]===m.id)delete occ[i];if(m.id!==myId)banner(m.n+' berhasil keluar!',3500);addChat('',m.n+' berhasil keluar dari lab.',1);upd();break;
 case'LV':gone[m.id]=1;for(const i in occ)if(occ[i]===m.id)delete occ[i];addChat('',m.n+' keluar dari permainan.',1);upd();break;
 case'EN':endSent=true;endMsg=m;try{sessionStorage.removeItem('mlab_sess')}catch(e){}if(!(scT>=0&&scT<95))showEnd();break}}
// ===== Mulai game =====
function mkWave(){allP.filter(p=>Math.floor(p.i/PER)===wave).forEach(p=>{const[x0,dr,z]=slots[p.s],m=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.01,0.16),paperMat);m.position.set(x0+dr*0.45,0.78,z-0.32);m.rotation.y=(p.s%7-3)*0.17;m.userData.soal=SOAL[p.q];m.userData.id=p.i;S.add(m);papers.push(m)})}
const mpFail=()=>{if(!failSent){failSent=true;mpSend({t:'fail'});mpFailSeq()}};
window.mpOcc=c=>{const o=occ[cabs.indexOf(c)];return !!o&&o!==myId};
window.mpCab=c=>{if(mpOcc(c)){banner('Lemari ini sudah ditempati temanmu!<br>Cari lemari lain.',2500);return}mpSend({t:'cb',i:cabs.indexOf(c)})};window.mpOnUnhide=c=>mpSend({t:'cu',i:cabs.indexOf(c)});
function mpStart(g){MP=true;spec=null;document.body.classList.add('mp');go2=true;mmode=g.m;if(g.s&&BANK[g.s])msub=g.s;setMapel(msub);roster=g.R;const c=MDF[g.m];TOTAL=g.P.length;FAIL_AT=Math.ceil(TOTAL*0.6);papers.forEach(p=>S.remove(p));papers=[];found=0;wrong=0;
 allP=g.P;wave=0;mkWave();
 keySpot=g.K;AMB_ACT=25;gCfg(c.delay,25,c.lv);const me=g.R.find(r=>r.id===myId);C.position.set(SPX[me?me.i:0],1.6,11.3);yaw=0;pitch=0;
 g.R.forEach(r=>{if(r.id!==myId)mkRem(r)});document.body.classList.add('pl');$('lby').style.display='none';stopBGM();$('mpc').style.display='flex';
 const bl=$('bl');bl.style.display='flex';runBar(7000,p=>{$('lf2').style.width=p*100+'%';$('lp2').textContent=LOAD_MSG[Math.min(LOAD_MSG.length-1,p*LOAD_MSG.length|0)]+' '+(p*100|0)+'%'},()=>{bl.style.display='none';
  $('gd').querySelector('.gb').innerHTML='<b>MULTIPLAYER - '+c.n+' \u2022 '+MAPEL[msub]+'</b> ('+g.R.length+' pemain)<br><br><b>Kontrol</b><br>PC: WASD jalan, Shift lari, mouse melihat, E interaksi, F senter, Enter chat, Z/X/C tanda cepat (soal/kunci/hantu).<br>HP: geser kiri untuk jalan, geser kanan melihat, ketuk tulisan interaksi, tombol 💬 chat, 📍 tanda cepat.<br><br><b>Tujuan tim</b><br>&bull; Soal tersebar di meja komputer di KEDUA ruang lab ('+TOTAL+' lembar). Siapa pun boleh menjawab; jawaban benar dihitung untuk seluruh tim.<br>&bull; Setelah semua soal selesai, cari <b>kunci</b> pintu ruang kedua. Posisinya acak: di atas kursi, di atas meja, atau di lantai.<br>&bull; Pemegang kunci membuka pintu di dinding kiri ruang kedua (ruang biru), lalu semua pemain keluar lewat pintu itu.<br><br><b>Bahaya</b><br>&bull; Ada dua hantu, <b>El Kalla</b> dan <b>Oni</b>, yang muncul bergantian (putaran 1 El Kalla, putaran 2 Oni, putaran 3 El Kalla, dst.). Satu hantu muncul '+c.delay+' detik setelah mulai/bersembunyi dan berkeliling 25 detik, memeriksa tiap lemari 5 detik. Sembunyi di lemari (E), satu lemari hanya muat satu pemain! Kalau ia melihatmu dari jauh saat tidak bersembunyi, ia berlari 45% lebih cepat.<br>&bull; Yang disentuh El Kalla atau Oni diculik dan tidak bisa bermain lagi; teman lain diperingatkan agar segera bersembunyi. Jika semua diculik, tim gagal.<br>&bull; Soal muncul bertahap dalam '+Math.ceil(TOTAL/PER)+' gelombang (5 lembar per gelombang).<br>&bull; Jika salah satu pemain menjawab salah '+FAIL_AT+' kali (60% dari '+TOTAL+' soal), SEMUA pemain diculik hantu.';
  $('gs').onclick=()=>{$('gd').style.display='none';startGame();mpSend({t:'rd'});upd()};$('gd').style.display='flex'})}
const mpHud=()=>{hudEl.textContent=(mpObj?'Tujuan: '+mpObj:'Soal: '+found+'/'+TOTAL+' (Gel. '+(wave+1)+'/'+Math.ceil(TOTAL/PER)+')  Salahmu: '+wrong+'/'+FAIL_AT)+'   Hidup: '+roster.filter(r=>!gone[r.id]).length+'/'+roster.length};
window.mpHud=mpHud;window.mpDoorOpen=()=>doorOp;
const mpSolve=id=>mpSend({t:'sv',id});
window.mpOnHide=c=>{if(MP&&keySpot&&keySpot.cab===cabs.indexOf(c)&&!keyTaken&&found>=TOTAL)mpSend({t:'kt'})};
function mpDoor(){if(doorOp)exitSeq();else if(hasKey)mpSend({t:'do'});else banner(found>=TOTAL?'Pintu terkunci!<br>'+(keyTaken?'Kunci dipegang temanmu.':'Cari kuncinya dulu.'):'Pintu terkunci!<br>Selesaikan semua soal ('+found+'/'+TOTAL+')',2500)}
function exitSeq(){if(ended||myCaught)return;ended=true;locked=true;const fo=$('fo');fo.style.display='block';requestAnimationFrame(()=>requestAnimationFrame(()=>fo.style.opacity=1));
 setTimeout(()=>{stopPlay();myEsc=true;mpSend({t:'ex'});fo.style.display='none';fo.style.opacity=0;if(endMsg)showEnd();else if(!(window.startSpec&&startSpec()))panel('KAMU BERHASIL KELUAR!','Menunggu teman-temanmu yang masih di dalam lab...',0)},1800)}
function panel(h,t,btn){stopMalam();ghStop();[pr,pn,bn,hudEl,$('fl'),$('hd'),$('ex')].forEach(e=>e.style.display='none');$('rzh').textContent=h;$('rzt').innerHTML=t;$('rzb').style.display=btn?'inline-block':'none';$('rzr').style.display=(btn&&isHost)?'inline-block':'none';$('rz').style.display='flex'}
function mpAfterScare(){if(endMsg)showEnd();else if(!(window.startSpec&&startSpec()))panel('KAMU DICULIK!',GHN[GS.gid]+' membawamu ke Dunia Gaib.<br>Temanmu masih berjuang...<br>Kamu tidak bisa ikut bermain lagi, tapi chat tetap bisa dipakai.',1)}
function scoreHtml(m){if(!m.s||!m.s.length)return'';const e=x=>String(x).replace(/[<>&]/g,''),top=Math.max(...m.s.map(r=>r.b)),ST=['','Keluar 🏆','Diculik','Terputus'];
 return '<table><tr><th>Pemain</th><th>Benar</th><th>Salah</th><th>Status</th></tr>'+[...m.s].sort((a,b)=>b.b-a.b||a.s-b.s).map(r=>'<tr><td>'+(top>0&&r.b===top?'🥇 ':'')+e(r.n)+'</td><td>'+r.b+'</td><td>'+r.s+'</td><td>'+ST[r.x]+'</td></tr>').join('')+'</table>'}
function showEnd(){if(window.stopSpec)stopSpec();const m=endMsg;if(!m.w.length){panel('GAME OVER','Kelompokmu telah diculik hantu (El Kalla dan Oni) dan dibawa ke Dunia Gaib',1)}
 else{panel('BERHASIL KELUAR!','Pemain yang berhasil keluar dari lab:<br><b>'+m.w.map(n=>'🏆 '+n.replace(/[<>&]/g,'')).join('<br>')+'</b>'+(m.c.length?'<br><br>Diculik: '+m.c.map(n=>n.replace(/[<>&]/g,'')).join(', '):''),1);
  if(SND.ending){const a=new Audio(SND.ending);a.play().catch(()=>{})}}
 $('rzs').innerHTML='<b>PAPAN SKOR</b>'+scoreHtml(m)+(isHost?'':'<div style="margin-top:10px;opacity:.8;font-size:14px">Pemilik room bisa mengajak main lagi di room yang sama.</div>')}
$('rzb').onclick=backMenu;
// Tombol KELUAR (di dalam lemari): pointerdown+click+touchend, dengan jeda supaya tidak terpanggil dua kali
{const ex=$('ex');ex.textContent=tc?'KELUAR':'KELUAR (E / klik)';let lt=0;const go=e=>{if(e.cancelable)e.preventDefault();const n=performance.now();if(n-lt<300)return;lt=n;interact()};ex.addEventListener('pointerdown',go);ex.addEventListener('click',go);ex.addEventListener('touchend',go)}
document.addEventListener('pointerlockchange',()=>{$('mpl').style.display=(MP&&started&&!tc&&!document.pointerLockElement&&!chatOn)?'block':'none'});$('mpl').onclick=()=>R.domElement.requestPointerLock();
// ===== Avatar pemain lain =====
function mkAv(){const g=new THREE.Group(),F=FULL;g.rotation.order='YXZ';const t=new THREE.Mesh(bg(0.46,0.7,0.23,F.badan,8,12,4),skinM(F.badan||SKIN.badan,0xe4e8ee));t.position.y=1.05;g.add(t);
 const lm=(x,y,u,col)=>{const p=new THREE.Group();p.position.set(x,y,0);const m=new THREE.Mesh(bg(0.23,0.7,0.23,u,4,12,4),skinM(u,col));m.position.y=-0.35;p.add(m);g.add(p);return p};
 const hp=new THREE.Group();hp.position.y=1.4;g.add(hp);const h=new THREE.Mesh(bg(0.46,0.46,0.46,F.kepala,8,8,8),skinM(F.kepala,0xe0b48c));h.position.y=0.23;hp.add(h);
 const aR=lm(0.345,1.4,F.tanganKanan,0xe0b48c),tr=mkTorch();tr.rotation.x=-Math.PI/2;tr.position.set(0,-0.62,0);tr.visible=false;aR.add(tr);
 return{g,hp,aL:lm(-0.345,1.4,F.tanganKiri,0xe0b48c),aR,tr,lL:lm(-0.115,0.7,F.kakiKiri,0x3d4452),lR:lm(0.115,0.7,F.kakiKanan,0x3d4452),amp:0,ph:0,sT:0.3,cur:null,dead:0,fT:0,...mkFl()}}
let GLT=null;const UPN=new THREE.Vector3(0,-1,0);
function mkFl(){if(!GLT){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,245,210,1)');gr.addColorStop(0.25,'rgba(255,235,170,.55)');gr.addColorStop(1,'rgba(255,230,150,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);GLT=new THREE.CanvasTexture(c)}
 const sp=new THREE.SpotLight(0xfff2cc,0,24,Math.PI/7,0.4,1.5),spt=new THREE.Object3D();S.add(sp);S.add(spt);sp.target=spt;
 const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:0}));gl.scale.set(0.8,0.8,1);gl.visible=false;S.add(gl);
 const cg=new THREE.ConeGeometry(2.1,5,16,1,true);cg.translate(0,-2.5,0);const cone=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xfff2cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));cone.visible=false;S.add(cone);
 return{sp,spt,gl,cone,fi:0,dv:new THREE.Vector3()}}
// Senter pemain lain: cahaya + titik terang + berkas tipis, terlihat dari jauh di tengah gelap
function remLight(a,s,id,dt,hd){const c=a.cur,on=!!s.f&&!hd&&!gone[id]&&!a.dead;a.fi+=((on?1:0)-a.fi)*Math.min(1,dt*12);
 const cp=Math.cos(s.p),dx=-Math.sin(c.y)*cp,dy=Math.sin(s.p),dz=-Math.cos(c.y)*cp;
 const show=a.fi>0.02&&id!==spec;a.gl.visible=a.cone.visible=show;a.tr.visible=show;
 // Titik cahaya = lensa senter (ujung depan senter di tangan kanan), bukan wajah
 a.g.updateMatrixWorld(true);LP.set(0,0,-0.16);a.tr.localToWorld(LP);
 a.sp.position.copy(LP);a.spt.position.set(LP.x+dx,LP.y+dy,LP.z+dz);a.sp.intensity=3*a.fi;
 if(show){a.gl.position.set(LP.x+dx*0.04,LP.y+dy*0.04,LP.z+dz*0.04);a.gl.material.opacity=0.9*a.fi;a.cone.position.copy(LP);a.dv.set(dx,dy,dz);a.cone.quaternion.setFromUnitVectors(UPN,a.dv);a.cone.material.opacity=0.07*a.fi}}
const LP=new THREE.Vector3();
function tagSpr(n){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 32px sans-serif';x.textAlign='center';x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,8,256,48);x.fillStyle='#fff';x.fillText(n,128,43);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,fog:false}));s.scale.set(1.1,0.275,1);s.position.y=2.1;return s}
function mkRem(r){const a=mkAv();a.g.visible=false;a.tag=tagSpr(r.n);a.tag.visible=false;S.add(a.tag);S.add(a.g);rem[r.id]=a}
// Animasi pintu lemari saat pemain lain masuk/keluar (terlihat oleh semua, termasuk penonton) + suara sesuai jarak
function cabAnim(i,ms){const c=cabs[i];if(!c)return;c.tgt=1;const v=Math.max(0,1-Math.hypot(c.pos.x-C.position.x,c.pos.z-C.position.z)/14);if(v>0.03){play('lemariBuka',v);setTimeout(()=>play('lemariTutup',v),700)}clearTimeout(c.ct);c.ct=setTimeout(()=>{c.tgt=0},ms)}
function mpTick(dt,t){
 if(window.specTick)specTick(dt);if(window.pgTick)pgTick(dt);
 if(isHost&&GS.st==='rush0'){GS.rt+=dt;if(GS.rt>=2.4){const sx=GS.rid==='p0'?{x:C.position.x,z:C.position.z,y:yaw}:st[GS.rid];GS.x=sx?sx.x-Math.sin(sx.y)*16:0;GS.z=sx?sx.z-Math.cos(sx.y)*16:0;GS.st='rush';GS.t=0;GS.todo=[];GS.path=[];amb=true;ghOp(1);GH.position.set(GS.x,0,GS.z)}} // Hantu muncul jauh di arah yang dilihat pemain (setelah menoleh), lalu menyerbu
 if(isHost&&Object.values(E).some(e=>e.r)&&!endSent){GS.onApp=()=>all({t:'GA',g:GS.gid});
  const tg=roster.filter(r=>{const e=eid(r.id);return e.r&&!e.c&&!e.x&&!e.l}).map(r=>r.id==='p0'?{id:'p0',x:C.position.x,z:C.position.z,h:hid}:st[r.id]?{id:r.id,x:st[r.id].x,z:st[r.id].z,h:st[r.id].h}:null).filter(Boolean);
  gTick(dt,tg).forEach(id=>{if(!eid(id).c){E[id].c=1;all({t:'CT',id,g:GS.gid});chkEnd()}})}
 sendT+=dt;if(sendT>=0.083){sendT=0;if(!myCaught&&!myEsc&&started){const m={t:'s',x:C.position.x,z:C.position.z,y:yaw,p:pitch,w:walkN?1:0,h:hid?1:0,r:k.ShiftLeft?1:0,f:spot.visible?1:0};if(reading){m.q=reading.userData.id;m.o=reading.userData.ord;m.k=reading.userData.pick}if(isHost)st.p0=m;else if(conn&&conn.open)conn.send(m)}
  if(isHost)bc({t:'S',p:st,g:[GS.x,GS.z,GS.ry,GS.op,GS.gid]})}
 if(!isHost&&gT){const f=Math.min(1,dt*10);GS.x+=(gT[0]-GS.x)*f;GS.z+=(gT[1]-GS.z)*f;GS.ry=gT[2];GH.position.set(GS.x,0,GS.z);GH.rotation.y=GS.ry;if(gT[4]!==undefined&&gT[4]!==GS.gid){GS.gid=gT[4];setGhost(GS.gid)}ghOp(gT[3])}
 if(fl2&&fl2.mp){const fy=fl2.y0+Math.PI,P=C.position;GH.position.set(P.x-Math.sin(fy)*1.9,0,P.z-Math.cos(fy)*1.9);GH.rotation.y=Math.atan2(P.x-GH.position.x,P.z-GH.position.z);ghVis(1)} // pemain gagal: hantu sudah berdiri tepat di belakangnya
 if(isHost&&!(scPos&&scT>=0&&scT<95)&&!(fl2&&fl2.mp))ghOp(GS.op); // host: setelah jumpscare selesai, tampilan hantu kembali mengikuti status hantu yang sebenarnya
 if(scPos&&scT>=0&&scT<95){GH.position.copy(scPos);GH.rotation.y=scRy;ghVis(1)}
 else if(GS.op>0.01&&((!myCaught&&!myEsc)||spec))ghUpd(1-Math.hypot(GS.x-C.position.x,GS.z-C.position.z)/14);else if(!(scT>=0&&scT<95))ghStop();
 for(const id in rem){const a=rem[id],s=st[id];if(!s)continue;if(!a.cur)a.cur={x:s.x,z:s.z,y:s.y};const f=Math.min(1,dt*12),c=a.cur;
  const oc=Object.keys(occ).find(i=>occ[i]===id);let ci=oc!==undefined?+oc:-1;if(ci<0){let bd=1e9,bi=-1;cabs.forEach((q,i)=>{const d=Math.hypot(q.pos.x-s.x,q.pos.z-s.z);if(d<bd){bd=d;bi=i}});if(s.h||bd<0.28)ci=bi}
  const hd=ci>=0||!!s.h;
  if(hd){a.wasHid=1;if(ci>=0){c.x=cabs[ci].pos.x;c.z=cabs[ci].pos.z}}
  else if(a.wasHid){a.wasHid=0;c.x=s.x;c.z=s.z}
  else{c.x+=(s.x-c.x)*f;c.z+=(s.z-c.z)*f}
  c.y+=Math.atan2(Math.sin(s.y-c.y),Math.cos(s.y-c.y))*f;a.g.position.set(c.x,0,c.z);a.g.rotation.y=c.y;a.hp.rotation.x=s.p*0.8;
  const mv=s.w&&!a.dead;a.amp+=((mv?1:0)-a.amp)*Math.min(1,dt*6);if(mv)a.ph+=dt*(s.r?8:5);const w=Math.sin(a.ph)*a.amp;a.lR.rotation.x=w*0.55;a.lL.rotation.x=-w*0.55;a.aL.rotation.x=w*0.45;a.aR.rotation.x=-w*0.45*(1-a.fi)+(Math.PI/2+s.p)*a.fi;
  let vis=(!hd&&!gone[id]||a.dead&&a.fT<2.2)&&id!==spec;if(a.dead){a.fT+=dt;a.g.rotation.x=-Math.min(1,a.fT/0.9)*1.5}a.g.visible=vis;if(vis&&!a.g.parent)S.add(a.g);else if(!vis&&a.g.parent)S.remove(a.g);if(ci>=0)a.tag.position.set(cabs[ci].pos.x,2.35,cabs[ci].pos.z);else a.tag.position.set(c.x,hd?2.35:2.1,c.z);a.tag.visible=(!gone[id]||(a.dead&&a.fT<2.2))&&id!==spec;remLight(a,s,id,dt,hd);
  if(mv&&vis){a.sT+=dt;if(a.sT>(s.r?0.32:0.5)){a.sT=0;if(SND.langkah){a.au=a.au||new Audio(SND.langkah);a.au.volume=Math.max(0,1-Math.hypot(c.x-C.position.x,c.z-C.position.z)/14)*0.8;a.au.currentTime=0;a.au.play().catch(()=>{})}}}else a.sT=0.3}}
window.mpTick=mpTick;window.mpWrong=()=>mpSend({t:'wa'});
