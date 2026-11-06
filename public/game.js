import*as T from 'three';
const $=s=>document.querySelector(s),esc=s=>s.replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),hex=c=>'#'+c.toString(16).padStart(6,'0');
const COL=[0xe63946,0x2a9d8f,0x3a86ff,0xf4a261,0x9b5de5,0xff70a6,0x70c1b3,0xffd23f],SLX=[-4,0,4];
const ST=await(await fetch('/stations.json')).json();
let ws,me=0,host=0,started=false,pend=null,col=0,lp=null,money=0,dsp=0,ov=[],wantX=false,time=0,au,ls=0,tt;
const pl=new Map(),cu=new Map(),so={},info=new Map(),fx=[],keys={},tp=new T.Vector3(),tl=new T.Vector3();

/* ---------- scene ---------- */
const R=new T.WebGLRenderer({canvas:$('#c'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;
const S=new T.Scene();S.background=new T.Color(0x24120c);S.fog=new T.Fog(0x24120c,28,55);
const cam=new T.PerspectiveCamera(45,1,.1,100),look=new T.Vector3(0,0,-2.5);cam.position.set(0,12,12);
const fit=()=>Math.max(1,1.4/cam.aspect);
const rs=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);rs();
S.add(new T.HemisphereLight(0xfff0d8,0x5a3020,1.6));
const sun=new T.DirectionalLight(0xffe2b0,2.6);sun.position.set(6,14,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-15,right:15,top:13,bottom:-13,near:1,far:40});sun.shadow.camera.updateProjectionMatrix();S.add(sun);
const mat=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.7,...o});
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t};
const spr=(t,w,h)=>{const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(w,h,1);s.renderOrder=10;return s};
const label=txt=>spr(mk(256,64,(g,w)=>{g.font='700 34px Fredoka,sans-serif';g.textAlign='center';g.lineWidth=8;g.strokeStyle='#000a';g.fillStyle='#fff';g.strokeText(txt,w/2,44);g.fillText(txt,w/2,44)}),2.4,.6);
const bubT=mk(96,96,g=>{g.fillStyle='#fff';g.beginPath();g.arc(48,46,40,0,7);g.fill();g.font='52px serif';g.textAlign='center';g.fillText('🍕',48,64)});
const P3=(o,y=0)=>new T.Vector3(o.position.x,o.position.y+y,o.position.z);

const chk=mk(128,128,g=>{g.fillStyle='#f3e3c3';g.fillRect(0,0,128,128);g.fillStyle='#d4452d';g.fillRect(0,0,64,64);g.fillRect(64,64,64,64)});chk.wrapS=chk.wrapT=T.RepeatWrapping;chk.repeat.set(13,8);
const fl=new T.Mesh(new T.PlaneGeometry(26,16),new T.MeshStandardMaterial({map:chk,roughness:.8}));fl.rotation.x=-Math.PI/2;fl.position.z=-1;fl.receiveShadow=true;S.add(fl);
const box=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;S.add(m)};
box(26,7,.4,0xf0d9b5,0,3.5,-8.2);box(18,1.05,1.4,0xb5651d,0,.52,-.6);box(18.4,.12,1.7,0xf0e0c0,0,1.1,-.6);
const sign=new T.Mesh(new T.PlaneGeometry(7,1.75),new T.MeshBasicMaterial({transparent:true,map:mk(512,128,(g,w)=>{g.font='700 90px Fredoka,sans-serif';g.textAlign='center';g.fillStyle='#fff';g.shadowColor='#ff3b2f';g.shadowBlur=24;g.fillText('PIZZERIA',w/2,98)})}));sign.position.set(0,5,-7.95);S.add(sign);
const ring=new T.Mesh(new T.RingGeometry(.9,1.1,32),new T.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.85,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.visible=false;S.add(ring);

/* ---------- models ---------- */
function pizza(k){const g=new T.Group(),b=k==='burnt';
  const d=(r,h,c,y)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,20),mat(c));m.position.y=y;m.castShadow=true;g.add(m);return m};
  d(.42,.07,b?0x2a1a14:0xe8c07a,0);
  if(k!=='dough'){d(.36,.03,b?0x1a0f0b:k==='pizza'?0xd9482b:0xe8452c,.05);d(.33,.03,b?0x120a07:k==='pizza'?0xffd86b:0xfff0b0,.08);
    for(let i=0;i<6;i++){const a=i*1.05,p=d(.06,.04,b?0:0xb3201a,.11);p.position.x=Math.cos(a)*.2;p.position.z=Math.sin(a)*.2}}
  return g}
function chef(c,cust){const g=new T.Group(),u={};
  const mm=(geo,cc,x,y,z,par=g)=>{const m=new T.Mesh(geo,mat(cc));m.position.set(x,y,z);m.castShadow=true;par.add(m);return m};
  u.body=mm(new T.CapsuleGeometry(.3,.4,4,10),c,0,.85,0);
  u.head=mm(new T.SphereGeometry(.26,16,12),0xffd3a8,0,1.55,0);
  mm(new T.SphereGeometry(.035,6,6),0x222222,-.09,.04,.23,u.head);mm(new T.SphereGeometry(.035,6,6),0x222222,.09,.04,.23,u.head);
  if(cust)mm(new T.SphereGeometry(.27,12,8,0,6.3,0,1.4),0x3a3a5a,0,.04,0,u.head);
  else{mm(new T.CylinderGeometry(.2,.22,.22,14),0xffffff,0,.3,0,u.head);mm(new T.SphereGeometry(.25,14,10),0xffffff,0,.45,0,u.head)}
  const piv=(x,y,len,cc)=>{const p=new T.Group();p.position.set(x,y,0);g.add(p);mm(new T.CapsuleGeometry(.08,len,3,6),cc,0,-len/2-.04,0,p);return p};
  u.aL=piv(-.4,1.05,.4,c);u.aR=piv(.4,1.05,.4,c);u.lL=piv(-.14,.5,.35,0x3b3b58);u.lR=piv(.14,.5,.35,0x3b3b58);
  Object.assign(u,{ph:0,pop:0,sp:0,cu:0});g.userData=u;return g}
function anim(g,dt,t,mv,carry,ry){const u=g.userData,e=Math.min(1,dt*10);
  u.sp+=((mv?1:0)-u.sp)*e;u.cu+=((carry?1:0)-u.cu)*e;u.ph+=dt*u.sp*11;
  const k=u.sp,s=Math.sin(u.ph),br=Math.sin(t*2.2+g.id),b=Math.abs(s)*.07*k;
  u.lL.rotation.x=s*.9*k;u.lR.rotation.x=-s*.9*k;
  u.aL.rotation.x=-s*.8*k*(1-u.cu)-1.3*u.cu;u.aR.rotation.x=s*.8*k*(1-u.cu)-1.3*u.cu;
  u.body.position.y=.85+b+br*.012;u.head.position.y=1.55+b+br*.012;u.body.scale.y=1+br*.025+Math.abs(Math.cos(u.ph))*.04*k;
  u.pop=Math.max(0,u.pop-dt*2.2);const h=Math.sin(u.pop*Math.PI);g.position.y=h*.4;g.scale.set(1-h*.06,1+h*.12,1-h*.06);
  let d=ry-g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.rotation.y+=d*Math.min(1,dt*12)}

/* ---------- effects ---------- */
const PG=new T.SphereGeometry(.09,6,5),addFx=(m,f)=>{S.add(m);fx.push({m,f,t:0})};
function burst(p,c,n=10,sp=3,y=1){const mt=new T.MeshBasicMaterial({color:c});for(let i=0;i<n;i++){const m=new T.Mesh(PG,mt),v=new T.Vector3((Math.random()-.5)*sp,Math.random()*sp*.9+1,(Math.random()-.5)*sp);m.position.set(p.x,p.y+y,p.z);addFx(m,(m,t,dt)=>{v.y-=9*dt;m.position.addScaledVector(v,dt);m.scale.setScalar(Math.max(.01,1-t/.9));return t>.9})}}
function smoke(p,c=0x333333){const m=new T.Mesh(PG,new T.MeshBasicMaterial({color:c,transparent:true}));m.position.set(p.x+(Math.random()-.5)*.6,p.y,p.z);addFx(m,(m,t,dt)=>{m.position.y+=dt*1.3;m.scale.setScalar(1+t*5);m.material.opacity=Math.max(0,.55-t*.4);return t>1.4})}
const toss=p=>{const m=pizza('dough');addFx(m,(m,t)=>{const u=Math.min(1,t/.8);m.position.set(p.x,1.3+Math.sin(u*Math.PI)*2.4,p.z);m.rotation.x=u*Math.PI*8;return u>=1})};
const fly=(a,b)=>{const m=pizza('pizza'),A=a.clone(),B=b.clone();addFx(m,(m,t)=>{const u=Math.min(1,t/.45);m.position.lerpVectors(A,B,u);m.position.y=1.5+Math.sin(u*Math.PI)*1.6;m.rotation.y=u*12;return u>=1})};
function pop(p,txt){const v=p.clone().project(cam),d=document.createElement('div');d.className='f';d.textContent=txt;d.style.left=(v.x+1)/2*innerWidth+'px';d.style.top=(1-v.y)/2*innerHeight+'px';$('#fx').append(d);setTimeout(()=>d.remove(),1400)}
const beep=(f,d=.1,type='triangle')=>{try{au=au||new AudioContext();const o=au.createOscillator(),g=au.createGain(),n=au.currentTime;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.07,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(au.destination);o.start();o.stop(n+d)}catch{}};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)};

/* ---------- stations ---------- */
function build(s){
  const g=new T.Group(),o={g,type:s.type,kick:0};g.position.set(s.x,0,s.z);S.add(g);
  const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
  const cyl=(r,h,c,x)=>new T.Mesh(new T.CylinderGeometry(r,r,h,18),mat(c,x));
  const tb=(w,d)=>add(new T.Mesh(new T.BoxGeometry(w,1,d),mat(0x8b5a2b)),0,.5,0);
  if(s.type==='dough'){tb(2.2,1.2);o.ball=add(new T.Mesh(new T.SphereGeometry(.42,18,12),mat(0xf5deb3)),0,1.38,0);add(cyl(.18,.06,0xffffff),.75,1.03,.2)}
  else if(s.type==='top'){tb(2.6,1.2);[[0xb3201a,-.8],[0x3c8d2f,0],[0xffd86b,.8]].forEach(([c,x])=>{add(cyl(.3,.28,0x9aa0a6),x,1.14,0);add(cyl(.25,.06,c),x,1.3,0)})}
  else if(s.type==='trash'){add(cyl(.55,1.1,0x4b5563),0,.55,0);add(cyl(.6,.12,0x374151),0,1.15,0)}
  else if(s.type==='counter'){o.bell=add(new T.Mesh(new T.SphereGeometry(.22,14,8,0,6.3,0,1.6),mat(0xffd23f,{metalness:.6,roughness:.3})),0,1.17,.1)}
  else if(s.type==='oven'){
    add(new T.Mesh(new T.BoxGeometry(2.4,2.2,1.6),mat(0x8a2f1e)),0,1.1,0);add(new T.Mesh(new T.BoxGeometry(2.6,.2,1.8),mat(0x3b3b3b)),0,2.3,0);add(cyl(.2,.8,0x3b3b3b),.7,2.8,-.3);
    o.mouth=add(new T.Mesh(new T.BoxGeometry(1.4,.95,.1),new T.MeshStandardMaterial({color:0x1a0f0b,emissive:0xff6a00,emissiveIntensity:0})),0,1.2,.82);
    add(new T.Mesh(new T.BoxGeometry(1.7,.2,.1),mat(0x222222)),0,2.75,.2).castShadow=false;
    const bg=new T.BoxGeometry(1.6,.14,.14);bg.translate(.8,0,0);o.bar=add(new T.Mesh(bg,new T.MeshBasicMaterial({color:0x00ff00})),-.8,2.75,.22);o.bar.castShadow=false;
    o.light=new T.PointLight(0xff7a1a,0,9,2);o.light.position.set(0,1.3,2);g.add(o.light)}
  so[s.id]=o}
ST.forEach(build);

/* ---------- entities ---------- */
function addPl(id,x,z){const inf=info.get(id)||{name:'?',color:0},root=new T.Group(),g=chef(COL[inf.color],0),lb=label(inf.name+(id===me?' (あなた)':''));
  lb.position.y=2.35;root.add(g,lb);root.position.set(x,0,z);S.add(root);
  const c={root,g,tx:x,tz:z,try:0,mv:0,lmv:false,cr:null,ck:null,item:null,it:0,shake:0};pl.set(id,c);if(id===me)lp=c;return c}
function addCu(id,slot){const root=new T.Group(),g=chef(new T.Color().setHSL(Math.random(),.6,.55).getHex(),1);
  const bg=new T.Sprite(new T.SpriteMaterial({color:0,opacity:.55,transparent:true,depthTest:false}));bg.center.set(0,.5);bg.scale.set(1.1,.2,1);bg.position.set(-.55,2.15,0);bg.renderOrder=10;
  const bar=new T.Sprite(new T.SpriteMaterial({color:0x44ff44,depthTest:false}));bar.center.set(0,.5);bar.position.set(-.5,2.15,0);bar.renderOrder=11;
  const bub=spr(bubT,.9,.9);bub.position.y=2.8;
  root.add(g,bg,bar,bub);root.position.set(13,0,3);S.add(root);
  const c={root,g,bg,bar,bub,slot,st:'wait',pat:1,rt:0,gone:false};cu.set(id,c);return c}

function ev(e){
  const ch=pl.get(e.p),mine=e.p===me;
  if(e.k==='act'){const s=so[e.s];if(ch)ch.g.userData.pop=1;
    if(s){s.kick=1;const p=s.g.position;
      if(s.type==='dough')toss(p);
      else if(s.type==='top')burst(p,[0xb3201a,0x3c8d2f,0xffd86b][Math.random()*3|0],12,2.5,1.6);
      else if(s.type==='trash')burst(p,0x999999,10,3,1.2);
      else if(s.type==='oven')burst(p,0xff8a1a,10,3,1.3)}
    if(mine)beep(520+Math.random()*80,.07)}
  else if(e.k==='no'){if(ch)ch.shake=.5;if(mine)beep(150,.15,'sawtooth')}
  else if(e.k==='serve'){const c=cu.get(e.c);if(c&&ch){fly(P3(ch.root),P3(c.root));c.g.userData.pop=1;
    setTimeout(()=>{burst(c.root.position,0xffd23f,16,4,2);pop(P3(c.root,3),'+$'+e.v);beep(880,.1);setTimeout(()=>beep(1320,.18),90)},450)}}
  else if(e.k==='angry'){const c=cu.get(e.c);if(c){burst(c.root.position,0xff3b2f,10,3,2);pop(P3(c.root,3),'💢 -$5');beep(110,.3,'sawtooth')}}
  else if(e.k==='ding'){const s=so['o'+e.o];burst(s.g.position,0x7dff7d,14,4,1.4);pop(P3(s.g,3.3),'🔔 焼けた!');beep(1046,.3,'sine')}
  else if(e.k==='burn'){const s=so['o'+e.o];pop(P3(s.g,3.3),'🔥 焦げた!');beep(90,.4,'sawtooth')}
  else if(e.k==='load')toast('📂 ロードしました')}

function state(m){
  money=m.m;$('#d').textContent=m.d;$('#sv').textContent=m.sv;$('#ls').textContent=m.ls;ov=m.o;
  const seen=new Set();
  for(const [id,x,z,ry,mv,cr] of m.p){seen.add(id);const c=pl.get(id)||addPl(id,x,z);c.cr=cr;if(id!==me){c.tx=x;c.tz=z;c.try=ry;c.mv=mv}}
  for(const [id,c] of pl)if(!seen.has(id)){S.remove(c.root);pl.delete(id)}
  const ids=new Set(m.c.map(a=>a[0]));
  for(const [id,slot,pat,st] of m.c){const c=cu.get(id)||addCu(id,slot);c.pat=pat;c.st=st}
  for(const [id,c] of cu)if(!ids.has(id))c.gone=true;
  m.e.forEach(ev)}

/* ---------- input ---------- */
addEventListener('keydown',e=>{keys[e.code]=1;if((e.code==='Space'||e.code==='KeyE')&&started&&!e.repeat&&document.activeElement.tagName!=='INPUT'){send({t:'act'});e.preventDefault()}});
addEventListener('keyup',e=>keys[e.code]=0);

/* ---------- network / lobby / save ---------- */
const conn=()=>new Promise((ok,ng)=>{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);ws.onopen=ok;ws.onerror=()=>{$('#err').textContent='サーバーに接続できません';ng()};ws.onmessage=e=>on(JSON.parse(e.data));ws.onclose=()=>{if(me)toast('切断されました。再読み込みしてください')}});
const send=o=>ws&&ws.readyState===1&&ws.send(JSON.stringify(o));
const enter=async m=>{$('#err').textContent='';try{if(!ws||ws.readyState!==1)await conn()}catch{return}send({...m,name:$('#name').value.trim()||'Chef',color:col})};
function on(m){
  if(m.t==='joined'){me=m.you;$('#s1').hidden=true;$('#s2').hidden=false;$('#bigcode').textContent=m.code;$('#rc').textContent='ROOM '+m.code}
  else if(m.t==='lobby'){host=m.host;m.players.forEach(p=>info.set(p.id,p));
    $('#pl').innerHTML=m.players.map(p=>`<li><b style="color:${hex(COL[p.color])}">●</b> ${esc(p.name)}${p.id===m.host?' 👑':''}</li>`).join('');
    $('#start').hidden=me!==host;$('#wait').hidden=me===host;
    if(m.started&&!started){started=true;$('#lobby').hidden=true;$('#hud').hidden=false;document.activeElement?.blur()}}
  else if(m.t==='s')state(m);
  else if(m.t==='err')$('#err').textContent=m.msg;
  else if(m.t==='save'){try{localStorage.setItem('pizza_save',JSON.stringify(m.data))}catch{}
    if(wantX){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(m.data,null,1)],{type:'application/json'}));a.download='pizzeria-save.json';a.click()}
    toast(wantX?'💾 保存して書き出しました':'💾 ブラウザにセーブしました')}}
COL.forEach((c,i)=>{const e=document.createElement('i');e.style.background=hex(c);e.onclick=()=>{col=i;[...$('#sw').children].forEach(x=>x.classList.remove('on'));e.classList.add('on')};$('#sw').append(e)});$('#sw').children[0].classList.add('on');
$('#create').onclick=()=>enter({t:'create',save:pend});
const doJoin=()=>{const c=$('#code').value.trim().toUpperCase();if(c.length!==4)return $('#err').textContent='4文字のコードを入力してください';enter({t:'join',code:c})};
$('#join').onclick=doJoin;$('#code').onkeydown=e=>{if(e.key==='Enter')doJoin()};$('#code').oninput=e=>e.target.value=e.target.value.toUpperCase();
$('#start').onclick=()=>send({t:'start'});
const slot=()=>{try{return JSON.parse(localStorage.getItem('pizza_save'))}catch{return null}};
function setSave(d){if(!d||typeof d.money!=='number')return toast('セーブデータが不正です');
  if(started){if(me!==host)return toast('ロードはホストのみ可能です');send({t:'load',data:d})}
  else{pend=d;$('#sinfo').textContent=`📦 読み込み済み: Day ${1+(d.time/120|0)} / $${d.money}`}}
const fromSlot=()=>{const d=slot();d?setSave(d):toast('ブラウザにセーブがありません')},fromFile=()=>$('#file').click();
$('#file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{setSave(JSON.parse(await f.text()))}catch{toast('読み込めませんでした')}};
['lsave','bload'].forEach(i=>$('#'+i).onclick=fromSlot);['lfile','bfile'].forEach(i=>$('#'+i).onclick=fromFile);
$('#bsave').onclick=()=>{wantX=false;send({t:'save'})};$('#bexp').onclick=()=>{wantX=true;send({t:'save'})};
document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>b.blur()));

/* ---------- update / loop ---------- */
function update(dt){
  dsp+=(money-dsp)*Math.min(1,dt*6);$('#m').textContent=Math.round(dsp);
  const f=fit();ring.visible=false;
  if(started&&lp){
    let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
    const n=Math.hypot(dx,dz),p=lp.root.position;lp.lmv=n>0;
    if(n){dx/=n;dz/=n;p.x=Math.max(-9,Math.min(9,p.x+dx*5.2*dt));p.z=Math.max(-7.5,Math.min(-1.7,p.z+dz*5.2*dt));
      for(const s of ST)if(s.type!=='counter'){const rd=s.type==='oven'?1.5:1.25,ex=p.x-s.x,ez=p.z-s.z,d=Math.hypot(ex,ez);if(d<rd&&d>0){p.x=s.x+ex/d*rd;p.z=s.z+ez/d*rd}}
      lp.try=Math.atan2(dx,dz)}
    if(performance.now()-ls>66){ls=performance.now();send({t:'pos',x:p.x,z:p.z,ry:lp.try,mv:n>0?1:0})}
    let ns=null,bd=2.6;for(const s of ST){const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<bd){bd=d;ns=s}}
    if(ns){ring.visible=true;ring.position.set(ns.x,.04,ns.z);ring.scale.setScalar(1+Math.sin(time*6)*.08)}}
  for(const [id,c] of pl){const p=c.root.position;
    if(id!==me){const k=Math.min(1,dt*9);p.x+=(c.tx-p.x)*k;p.z+=(c.tz-p.z)*k}
    if(c.ck!==c.cr){if(c.item)c.g.remove(c.item);c.item=c.cr?pizza(c.cr):null;if(c.item){c.item.position.set(0,1.3,.62);c.g.add(c.item)}c.ck=c.cr;c.it=0}
    if(c.item){c.it=Math.min(1,c.it+dt*3.5);const x=c.it-1;c.item.scale.setScalar(1+2.70158*x*x*x+1.70158*x*x);c.item.position.y=1.3+Math.sin(time*6)*.03;c.item.rotation.y+=dt*2}
    c.shake=Math.max(0,c.shake-dt);c.g.rotation.z=Math.sin(c.shake*60)*.3*c.shake;
    anim(c.g,dt,time,id===me?c.lmv:c.mv,!!c.cr,c.try)}
  for(const [id,c] of cu){
    const leaving=c.gone||c.st!=='wait';if(leaving)c.rt+=dt;
    const go=leaving&&c.rt>(c.st==='angry'?.5:1.1),p=c.root.position;
    const tx=go?13:SLX[c.slot],tz=go?3:1.5,dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),mv=d>.15,sp=c.st==='angry'?5.5:3.4;
    if(mv){const s=Math.min(d,sp*dt)/d;p.x+=dx*s;p.z+=dz*s}
    if(c.st==='happy'&&leaving&&!go&&Math.floor(c.rt*2)!==c.hp){c.hp=Math.floor(c.rt*2);c.g.userData.pop=1}
    c.g.rotation.z=c.st==='angry'&&!go?Math.sin(time*50)*.15:0;
    anim(c.g,dt,time,mv,false,mv?Math.atan2(dx,dz):Math.PI);
    const w=!leaving;c.bar.visible=c.bg.visible=c.bub.visible=w;
    if(w){c.bar.scale.set(Math.max(.001,c.pat),.14,1);c.bar.material.color.setHSL(c.pat*.33,.9,.5);c.bub.scale.setScalar(.9+Math.sin(time*(3+(1-c.pat)*10))*.08)}
    if(c.gone&&go&&p.x>12.5){S.remove(c.root);cu.delete(id)}}
  for(const id in so){const s=so[id];s.kick=Math.max(0,s.kick-dt*3.5);const k=Math.sin(s.kick*Math.PI);s.g.scale.set(1+k*.1,1-k*.12,1+k*.1);if(s.ball)s.ball.scale.y=.75+Math.sin(time*2)*.03}
  [0,1].forEach(i=>{const o=so['o'+i],[s,t]=ov[i]||['empty',0],kind=s==='baking'?'raw':s==='done'?'pizza':s==='burnt'?'burnt':null;
    if(o.pk!==kind){if(o.pz)o.g.remove(o.pz);o.pz=kind?pizza(kind):null;if(o.pz){o.pz.position.set(0,1,.75);o.g.add(o.pz)}o.pk=kind}
    if(o.pz&&s==='baking')o.pz.rotation.y+=dt*1.5;
    const glow=s==='empty'?0:s==='burnt'?.1:.8+Math.sin(time*8)*.25,em=o.mouth.material;
    em.emissiveIntensity+=(glow-em.emissiveIntensity)*Math.min(1,dt*8);o.light.intensity=em.emissiveIntensity*30;
    const pr=s==='baking'?t/8:s==='done'?1-(t-8)/6:s==='burnt'?1:0;
    o.bar.scale.x=Math.max(.001,pr);o.bar.material.color.setHSL(s==='baking'?.08:s==='done'?.33*pr:0,.9,.5);
    o.g.rotation.z=s==='done'?Math.sin(time*30)*.012:0;
    if(s==='burnt'&&((o.sm=(o.sm||0)-dt)<0)){o.sm=.18;smoke(P3(o.g,3))}});
  for(let i=fx.length-1;i>=0;i--){const o=fx[i];o.t+=dt;if(o.f(o.m,o.t,dt)){S.remove(o.m);fx.splice(i,1)}}
  sign.material.opacity=.9+Math.sin(time*23)*.05-(Math.random()<.015?.45:0);
  if(started&&lp){tp.set(lp.root.position.x*.2,12*f,11*f);tl.set(lp.root.position.x*.25,0,-2.5)}
  else{const a=Math.sin(time*.2)*.6;tp.set(Math.sin(a)*15,10+Math.sin(time*.4),Math.cos(a)*13*Math.max(1,f*.9));tl.set(0,.5,-2.5)}
  tp.y+=Math.sin(time*.8)*.12;const k=1-Math.exp(-dt*3);cam.position.lerp(tp,k);look.lerp(tl,k);cam.lookAt(look)}
let lastT=performance.now();
(function loop(n){const dt=Math.min(.05,(n-lastT)/1000);lastT=n;time+=dt;update(dt);R.render(S,cam);requestAnimationFrame(loop)})(lastT);
