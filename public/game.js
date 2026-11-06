import*as T from 'three';
const $=s=>document.querySelector(s),esc=s=>s.replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),hex=c=>'#'+c.toString(16).padStart(6,'0');
const COL=[0xe63946,0x2a9d8f,0x3a86ff,0xf4a261,0x9b5de5,0xff70a6,0x70c1b3,0xffd23f],SLX=[-3,0,3];
const TOPS={pep:['ペパロニ',0xb3201a],mush:['マッシュルーム',0xd9c3a0],olive:['オリーブ',0x2b2b2b],basil:['バジル',0x2f8f3a]};
const SK=['dough','roll','sauce','cheese','top','peel','bake','cut','box','serve'];
const STEPS=['生地をとる','めん棒でのばす','ソースをぬる','チーズをかける','トッピングをのせる','ピールでオーブンへ','焼き上がりを取り出す','ピザカッターで切る','箱につめる','お客さんに渡す'];
const HOW=['左の木箱を見て E','作業台を見て 左クリック長押し(めん棒)','作業台を見て 左クリック長押し(おたま)','作業台を見て 左クリック長押し','ボウルで E でつまむ → 作業台で 左クリック / Q で取り消し','作業台で E → 空いたオーブンで E','バーが緑のとき そのオーブンで E','カット台で E → 左クリック ×3','カット台で E','注文したお客さんを見て E'];
let ws,me=0,host=0,started=false,pend=null,col=0,money=0,dsp=0,ov=[[0,0,0],[0,0,0]],wantX=false,time=0,au,ls=0,tt,W=null,tgt=null,locked=false,inited=false,bob=0,bxHold=0,lmbDown=false,pkey=null,lastPr='';
const P={x:0,z:3,yaw:0,pitch:0,sp:0},vmx={a:0,pl:0,cut:0,sw:false,sl:0};
const pl=new Map(),cu=new Map(),info=new Map(),fx=[],keys={},inter=[],stn={};

/* ---------- scene ---------- */
const R=new T.WebGLRenderer({canvas:$('#c'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));
const S=new T.Scene();S.background=new T.Color(0x1a0f0b);S.fog=new T.Fog(0x1a0f0b,14,36);
const cam=new T.PerspectiveCamera(72,1,.05,60);cam.rotation.order='YXZ';S.add(cam);
const rs=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);rs();
S.add(new T.HemisphereLight(0xfff0d8,0x6a4030,1.9));const dl=new T.DirectionalLight(0xffe2b0,1.4);dl.position.set(3,6,-2);S.add(dl);
const mat=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.7,...o});
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t};
const spr=(t,w,h)=>{const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(w,h,1);s.renderOrder=10;return s};
const label=txt=>spr(mk(256,64,(g,w)=>{g.font='700 34px Fredoka,sans-serif';g.textAlign='center';g.lineWidth=8;g.strokeStyle='#000a';g.fillStyle='#fff';g.strokeText(txt,w/2,44);g.fillText(txt,w/2,44)}),2.4,.6);
const box=(w,h,d,c,x,y,z,p=S)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);p.add(m);return m};
const cyl=(r,h,c,y,p)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,28),mat(c));m.position.y=y;p.add(m);return m};
const P3=(o,y=0)=>new T.Vector3(o.position.x,o.position.y+y,o.position.z);
const bubTex=(ord,by)=>mk(256,120,(g,w,h)=>{g.fillStyle=by?'#ffe9a8':'#fff';g.beginPath();(g.roundRect||g.rect).call(g,4,4,w-8,h-8,22);g.fill();g.lineWidth=6;g.strokeStyle=by===me?'#3a86ff':'#c8321e';g.stroke();g.font='700 27px Fredoka,sans-serif';ord.forEach(([t,n],i)=>{g.fillStyle=hex(TOPS[t][1]);g.beginPath();g.arc(32,38+i*40,12,0,7);g.fill();g.fillStyle='#3b1d12';g.fillText(TOPS[t][0]+' ×'+n,54,48+i*40)})});

/* ---------- shop ---------- */
const chk=mk(128,128,g=>{g.fillStyle='#f3e3c3';g.fillRect(0,0,128,128);g.fillStyle='#d4452d';g.fillRect(0,0,64,64);g.fillRect(64,64,64,64)});chk.wrapS=chk.wrapT=T.RepeatWrapping;chk.repeat.set(7,5.8);
const fl=new T.Mesh(new T.PlaneGeometry(14,11.6),new T.MeshStandardMaterial({map:chk,roughness:.8}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,1.3);S.add(fl);
box(14.6,3.4,.3,0xf0d9b5,0,1.7,7.2);box(.3,3.4,12,0xf0d9b5,-7.1,1.7,1.3);box(.3,3.4,12,0xf0d9b5,7.1,1.7,1.3);
box(11.2,3.4,.3,0xf0d9b5,-1.4,1.7,-4.6);box(1.4,3.4,.3,0xf0d9b5,6.5,1.7,-4.6);box(14.6,.2,12,0xefe3cc,0,3.5,1.3);
box(13.6,1,.9,0xb5651d,0,.5,.3);box(13.8,.1,1.1,0xf0e0c0,0,1.05,.3);
box(13.2,.95,.9,0x8b5a2b,0,.475,6.65);box(13.4,.08,1.05,0xd9c3a0,0,.99,6.65);
const sign=new T.Mesh(new T.PlaneGeometry(6,1.5),new T.MeshBasicMaterial({transparent:true,map:mk(512,128,(g,w)=>{g.font='700 90px Fredoka,sans-serif';g.textAlign='center';g.fillStyle='#fff';g.shadowColor='#ff3b2f';g.shadowBlur=24;g.fillText('PIZZERIA',w/2,98)})}));sign.position.set(0,2.9,7.0);sign.rotation.y=Math.PI;S.add(sign);
[[-5.2,'① 生地'],[-3.2,'② 作業台'],[-.7,'③ トッピング'],[2.35,'④ オーブン'],[5.2,'⑤ カット・箱']].forEach(([x,t])=>{const l=label(t);l.position.set(x,2.45,6.5);l.scale.set(1.7,.43,1);S.add(l)});

function pizza(k,deco=true){const g=new T.Group(),b=k==='burnt';
  const d=(r,h,c,y)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mat(c));m.position.y=y;g.add(m);return m};
  d(.42,.05,b?0x2a1a14:0xe8c07a,0);
  if(k!=='dough'){d(.37,.02,b?0x1a0f0b:k==='pizza'?0xd9482b:0xe8452c,.03);d(.34,.02,b?0x120a07:k==='pizza'?0xffd86b:0xfff0b0,.05);
    if(deco)for(let i=0;i<6;i++){const a=i*1.05,p=d(.05,.03,b?0:0xb3201a,.08);p.position.x=Math.cos(a)*.2;p.position.z=Math.sin(a)*.2}}
  return g}
const topMesh=t=>{const c=TOPS[t][1],g=new T.Group();
  if(t==='olive'){const m=new T.Mesh(new T.TorusGeometry(.035,.015,6,12),mat(c));m.rotation.x=Math.PI/2;g.add(m)}
  else if(t==='basil'){const m=new T.Mesh(new T.SphereGeometry(.05,8,6),mat(c));m.scale.set(1,.25,1.4);g.add(m)}
  else{g.add(new T.Mesh(new T.CylinderGeometry(t==='pep'?.055:.045,t==='pep'?.055:.05,.025,12),mat(c)));if(t==='mush'){const s=new T.Mesh(new T.SphereGeometry(.035,8,6),mat(0xa88b64));s.scale.y=.5;s.position.y=.012;g.add(s)}}
  return g};
const bkind=()=>W.tm<7?'raw':W.tm<=14?'pizza':'burnt';
const bakedPz=k=>{const g=pizza(k,false);W.top.forEach(p=>{const m=topMesh(p.t);m.position.set(p.x,.08,p.z);m.rotation.y=p.m.rotation.y;g.add(m)});return g};

const stationObj=(k,x,extra)=>{const g=new T.Group();g.position.set(x,1.03,6.55);g.userData={k,...extra};S.add(g);inter.push(g);return g};
{const g=stationObj('crate',-5.2);box(1,.45,.7,0x9a6a3a,0,.225,0,g);for(let i=0;i<3;i++){const m=new T.Mesh(new T.SphereGeometry(.17,12,8),mat(0xf5deb3));m.position.set(-.28+i*.28,.5,0);m.scale.y=.8;g.add(m)}}
const prep=stationObj('table',-3.2);box(2,.04,.8,0xf4f4f4,0,.02,0,prep);
const tp=new T.Group();tp.position.set(-3.2,1.08,6.5);S.add(tp);
const tpD=cyl(.4,.05,0xe8c07a,.025,tp),tpS=cyl(.36,.02,0xd9482b,.06,tp),tpC=cyl(.33,.02,0xffd86b,.08,tp),tpT=new T.Group();tp.add(tpT);
Object.keys(TOPS).forEach((t,i)=>{const g=stationObj('bowl',-1.6+i*.6,{t}),b=new T.Mesh(new T.CylinderGeometry(.24,.17,.15,18),mat(0xcfd4da));b.position.y=.075;g.add(b);cyl(.21,.03,TOPS[t][1],.15,g);
  for(let j=0;j<4;j++){const m=topMesh(t);m.position.set(Math.cos(j*1.6)*.1,.18+j%2*.02,Math.sin(j*1.6)*.1);g.add(m)}
  const l=label(TOPS[t][0]);l.position.y=.55;l.scale.set(1.5,.375,1);g.add(l)});
[0,1].forEach(i=>{const g=stationObj('oven',1.6+i*1.5,{i});
  box(1.3,1.25,.9,0x8a2f1e,0,.625,0,g);box(1.4,.12,1.0,0x3b3b3b,0,1.3,0,g);
  const mouth=new T.Mesh(new T.BoxGeometry(.9,.55,.06),new T.MeshStandardMaterial({color:0x1a0f0b,emissive:0xff6a00,emissiveIntensity:0}));mouth.position.set(0,.55,-.46);g.add(mouth);
  const bg=new T.BoxGeometry(.9,.07,.07);bg.translate(.45,0,0);const bar=new T.Mesh(bg,new T.MeshBasicMaterial({color:0x00ff00}));bar.position.set(-.45,1.05,-.5);g.add(bar);
  const light=new T.PointLight(0xff7a1a,0,6,2);light.position.set(0,.8,-1.1);g.add(light);
  stn['o'+i]={g,mouth,bar,light,pk:null,pz:null}});
const cb=stationObj('cutb',5.2);box(1.5,.05,.8,0xd9b382,0,.025,0,cb);
const cp=new T.Group();cp.position.set(5.2,1.1,6.5);S.add(cp);
const bx=new T.Group();bx.position.set(5.2,1.08,6.5);S.add(bx);box(.9,.1,.9,0xc79a5b,0,.05,0,bx);
const lidG=new T.Group();lidG.position.set(0,.1,.45);bx.add(lidG);box(.92,.04,.9,0xd8aa6a,0,0,-.45,lidG);
{const tr=new T.Group();tr.position.set(-6.2,0,5.3);tr.userData={k:'trash'};S.add(tr);inter.push(tr);const b=new T.Mesh(new T.CylinderGeometry(.35,.28,.8,16),mat(0x4b5563));b.position.y=.4;tr.add(b);const l=label('ゴミ箱');l.position.y=1.3;l.scale.set(1.2,.3,1);tr.add(l)}

/* ---------- characters (other players / customers) ---------- */
function chef(c,cust){const g=new T.Group(),u={};
  const mm=(geo,cc,x,y,z,par=g)=>{const m=new T.Mesh(geo,mat(cc));m.position.set(x,y,z);par.add(m);return m};
  u.body=mm(new T.CapsuleGeometry(.3,.4,4,10),c,0,.85,0);
  u.head=mm(new T.SphereGeometry(.26,16,12),0xffd3a8,0,1.55,0);
  mm(new T.SphereGeometry(.035,6,6),0x222222,-.09,.04,.23,u.head);mm(new T.SphereGeometry(.035,6,6),0x222222,.09,.04,.23,u.head);
  if(cust)mm(new T.SphereGeometry(.27,12,8,0,6.3,0,1.4),0x3a3a5a,0,.04,0,u.head);
  else{mm(new T.CylinderGeometry(.2,.22,.22,14),0xffffff,0,.3,0,u.head);mm(new T.SphereGeometry(.25,14,10),0xffffff,0,.45,0,u.head)}
  const piv=(x,y,len,cc)=>{const p=new T.Group();p.position.set(x,y,0);g.add(p);mm(new T.CapsuleGeometry(.08,len,3,6),cc,0,-len/2-.04,0,p);return p};
  u.aL=piv(-.4,1.05,.4,c);u.aR=piv(.4,1.05,.4,c);u.lL=piv(-.14,.5,.35,0x3b3b58);u.lR=piv(.14,.5,.35,0x3b3b58);
  Object.assign(u,{ph:0,pop:0,sp:0});g.userData=u;return g}
function anim(g,dt,t,mv,ry){const u=g.userData,e=Math.min(1,dt*10);
  u.sp+=((mv?1:0)-u.sp)*e;u.ph+=dt*u.sp*11;
  const k=u.sp,s=Math.sin(u.ph),br=Math.sin(t*2.2+g.id),b=Math.abs(s)*.07*k;
  u.lL.rotation.x=s*.9*k;u.lR.rotation.x=-s*.9*k;u.aL.rotation.x=-s*.8*k;u.aR.rotation.x=s*.8*k;
  u.body.position.y=.85+b+br*.012;u.head.position.y=1.55+b+br*.012;u.body.scale.y=1+br*.025+Math.abs(Math.cos(u.ph))*.04*k;
  u.pop=Math.max(0,u.pop-dt*2.2);const h=Math.sin(u.pop*Math.PI);g.position.y=h*.4;g.scale.set(1-h*.06,1+h*.12,1-h*.06);
  let d=ry-g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.rotation.y+=d*Math.min(1,dt*12)}

/* ---------- effects ---------- */
const addFx=(m,f)=>{S.add(m);fx.push({m,f,t:0})},tw=(d,f)=>addFx(new T.Object3D(),(m,t)=>{f(Math.min(1,t/d));return t>=d});
const PG=new T.SphereGeometry(.09,6,5);
function burst(p,c,n=10,sp=3,y=1){const mt=new T.MeshBasicMaterial({color:c});for(let i=0;i<n;i++){const m=new T.Mesh(PG,mt),v=new T.Vector3((Math.random()-.5)*sp,Math.random()*sp*.9+1,(Math.random()-.5)*sp);m.position.set(p.x,p.y+y,p.z);addFx(m,(m,t,dt)=>{v.y-=9*dt;m.position.addScaledVector(v,dt);m.scale.setScalar(Math.max(.01,1-t/.9));return t>.9})}}
function smoke(p){const m=new T.Mesh(PG,new T.MeshBasicMaterial({color:0x333333,transparent:true}));m.position.set(p.x+(Math.random()-.5)*.4,p.y,p.z);addFx(m,(m,t,dt)=>{m.position.y+=dt*1.2;m.scale.setScalar(1+t*4);m.material.opacity=Math.max(0,.55-t*.4);return t>1.4})}
function shred(p,c){const m=new T.Mesh(new T.BoxGeometry(.02,.01,.02),new T.MeshBasicMaterial({color:c})),v=new T.Vector3((Math.random()-.5)*.4,Math.random()*.3,(Math.random()-.5)*.4);m.position.copy(p);addFx(m,(m,t,dt)=>{v.y-=5*dt;m.position.addScaledVector(v,dt);m.rotation.x+=dt*9;return t>.7||m.position.y<1.06})}
function pop(p,txt){const v=p.clone().project(cam),d=document.createElement('div');d.className='f';d.textContent=txt;d.style.left=(v.x+1)/2*innerWidth+'px';d.style.top=(1-v.y)/2*innerHeight+'px';$('#fx').append(d);setTimeout(()=>d.remove(),1400)}
const beep=(f,d=.1,type='triangle')=>{try{au=au||new AudioContext();const o=au.createOscillator(),g=au.createGain(),n=au.currentTime;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.07,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(au.destination);o.start();o.stop(n+d)}catch{}};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2600)};

/* ---------- first-person hands & tools ---------- */
const vm=new T.Group();cam.add(vm);
const mkHand=()=>{const g=new T.Group(),a=new T.Mesh(new T.CapsuleGeometry(.05,.42,3,8),mat(0xffffff));a.rotation.x=Math.PI/2-.3;a.position.set(0,-.06,.24);g.add(a,new T.Mesh(new T.SphereGeometry(.065,10,8),mat(0xffd3a8)));vm.add(g);return g};
const hR=mkHand(),hL=mkHand(),TL={},tool=(n,g,p=vm)=>{TL[n]=g;g.visible=false;p.add(g);return g};
{const g=new T.Group(),m=new T.Mesh(new T.CylinderGeometry(.035,.035,.5,12),mat(0xd9a55b));m.rotation.z=Math.PI/2;g.add(m);[-1,1].forEach(s=>{const h=new T.Mesh(new T.CylinderGeometry(.03,.03,.1,10),mat(0xb8803f));h.rotation.z=Math.PI/2;h.position.x=s*.3;g.add(h)});g.position.set(0,-.27,-.62);tool('pin',g)}
{const g=new T.Group(),st=new T.Mesh(new T.CylinderGeometry(.012,.012,.38,8),mat(0x999999)),b=new T.Mesh(new T.SphereGeometry(.07,12,8),mat(0xc0c4c8)),s=new T.Mesh(new T.SphereGeometry(.06,10,6),mat(0xd9482b));st.rotation.x=Math.PI/2;st.position.z=-.15;b.scale.y=.5;b.position.z=-.35;s.scale.y=.3;s.position.set(0,.02,-.35);g.add(st,b,s);g.position.set(0,.03,-.05);g.rotation.x=.5;tool('lad',g,hR)}
{const g=new T.Group();for(let i=0;i<7;i++){const m=new T.Mesh(new T.BoxGeometry(.03,.012,.03),mat(0xffe27a));m.position.set((Math.random()-.5)*.1,.06+Math.random()*.04,-.06+(Math.random()-.5)*.08);m.rotation.y=Math.random()*3;g.add(m)}tool('che',g,hR)}
tool('pc',new T.Group(),hR);
{const g=new T.Group(),bl=new T.Mesh(new T.BoxGeometry(.012,.1,.34),mat(0xd8dde2,{metalness:.7,roughness:.3})),h=new T.Mesh(new T.BoxGeometry(.03,.03,.12),mat(0x333333));bl.position.set(0,0,-.22);h.position.z=-.02;g.add(bl,h);g.position.set(0,.02,-.05);tool('cut',g,hR)}
const peelHold=new T.Group();peelHold.position.y=.02;peelHold.scale.setScalar(.62);
{const g=new T.Group(),d=new T.Mesh(new T.CylinderGeometry(.27,.27,.015,24),mat(0xc99a5b)),s=new T.Mesh(new T.CylinderGeometry(.015,.015,.5,8),mat(0x9a6a3a));s.rotation.x=Math.PI/2;s.position.z=.37;g.add(d,s,peelHold);g.position.set(0,-.3,-.85);tool('peel',g)}
{const g=new T.Group(),m=new T.Mesh(new T.SphereGeometry(.11,16,12),mat(0xf5deb3));m.scale.y=.8;g.add(m);g.position.set(0,-.27,-.55);tool('dough',g)}
{const g=new T.Group(),a=new T.Mesh(new T.BoxGeometry(.46,.07,.46),mat(0xc79a5b)),l=new T.Mesh(new T.BoxGeometry(.47,.025,.47),mat(0xd8aa6a));l.position.y=.05;g.add(a,l);g.position.set(0,-.3,-.62);g.rotation.x=.25;tool('box',g)}
const POSE={none:[.28,-.33,-.5,-.28,-.33,-.5],dough:[.15,-.28,-.5,-.15,-.28,-.5],pin:[.3,-.26,-.62,-.3,-.26,-.62],lad:[.2,-.3,-.5,-.3,-.34,-.45],che:[.15,-.28,-.5,-.3,-.34,-.45],pc:[.15,-.28,-.5,-.3,-.34,-.45],cut:[.2,-.3,-.5,-.3,-.34,-.45],peel:[.12,-.34,-.5,-.1,-.4,-.42],box:[.22,-.32,-.55,-.22,-.32,-.55]};
const hw=()=>hR.getWorldPosition(new T.Vector3());
function setPc(t){TL.pc.clear();const m=topMesh(t);m.scale.setScalar(1.6);m.position.set(0,.07,-.07);TL.pc.add(m)}
function setPeelPz(k){if(pkey===k)return;pkey=k;peelHold.clear();if(k)peelHold.add(bakedPz(k))}
function vmUpdate(dt,act){
  const s=W?SK[W.s]:'';let tl='none';
  if(s==='roll')tl=W.placed?'pin':'dough';else if(s==='sauce')tl='lad';else if(s==='cheese')tl='che';else if(s==='top'&&W.hold)tl='pc';
  else if(s==='peel'||(s==='cut'&&!W.placed)||vmx.sw)tl='peel';else if(s==='cut')tl='cut';else if(s==='serve')tl='box';
  for(const k in TL)TL[k].visible=k===tl;
  vmx.a+=((act?1:0)-vmx.a)*Math.min(1,dt*10);const a=vmx.a;vmx.pl=Math.max(0,vmx.pl-dt*4);vmx.cut=Math.max(0,vmx.cut-dt*5);
  const po=POSE[tl],pz=Math.sin(vmx.pl*Math.PI),cz=Math.sin(vmx.cut*Math.PI),sl=vmx.sw?vmx.sl:0;let ox=0,oy=0,oz=0,lz=0;
  if(tl==='pin'){oz=Math.sin(time*9)*.1*a;lz=oz;TL.pin.position.z=-.62+oz;TL.pin.rotation.x+=dt*14*a}
  else if(tl==='lad'){ox=Math.cos(time*8)*.05*a;oz=Math.sin(time*8)*.05*a}
  else if(tl==='che')oy=Math.sin(time*30)*.012*a;
  else if(tl==='pc')oz=-pz*.12;
  else if(tl==='dough'){oz=-pz*.12;TL.dough.scale.setScalar(1+Math.sin(time*6)*.04)}
  else if(tl==='cut'){oy=-cz*.08;TL.cut.rotation.x=-cz*.9}
  else if(tl==='peel'){oz=-.9*sl;lz=oz;TL.peel.position.z=-.85-.9*sl}
  const k=Math.min(1,dt*12);
  hR.position.x+=(po[0]+ox-hR.position.x)*k;hR.position.y+=(po[1]+oy-hR.position.y)*k;hR.position.z+=(po[2]+oz-hR.position.z)*k;
  hL.position.x+=(po[3]-hL.position.x)*k;hL.position.y+=(po[4]-hL.position.y)*k;hL.position.z+=(po[5]+lz-hL.position.z)*k;
  vm.position.y=Math.abs(Math.sin(bob))*.015*P.sp}

/* ---------- order / procedure ---------- */
const newW=a=>({c:a[0],ord:a[4],s:0,pr:0,top:[],hold:null,placed:false,cuts:0,oi:-1,tm:0,done:false,bad:0,err:0});
function tally(){const n={},need=Object.fromEntries(W.ord);W.top.forEach(p=>n[p.t]=(n[p.t]||0)+1);let bad=0,ok=true;for(const t in n)if(n[t]>(need[t]||0))bad+=n[t]-(need[t]||0);for(const t in need)if((n[t]||0)<need[t])ok=false;W.bad=bad;W.done=ok&&!bad;return n}
function setTk(){$('#tk').hidden=!W;if(!W)return;const n=tally();
  $('#tks').innerHTML=STEPS.map((t,i)=>`<li class="${i<W.s?'done':i===W.s?'cur':''}">${t}</li>`).join('');
  $('#tko').innerHTML=W.ord.map(([t,c])=>`<span class="chip" style="--c:${hex(TOPS[t][1])}">${TOPS[t][0]} ${n[t]||0}/${c}</span>`).join('');
  $('#tki').textContent='▶ '+HOW[W.s]}
function adv(){W.s=Math.min(9,W.s+1);W.pr=0;if(W.s===7)W.placed=false;if(W.s===8)lidG.rotation.x=1.9;vmx.pl=1;beep(600+W.s*60,.1);setTk()}
function clear(drop){if(W&&drop)send({t:'drop'});W=null;tpT.clear();cp.clear();vmx.sw=false;setPeelPz(null);setTk()}
const score=()=>{const b=W.tm<6?25:W.tm<8?60:W.tm<=11.5?100:W.tm<=14?65:15;return Math.round(Math.max(0,100-W.err*12)*.4+b*.45+15)};
function pick(t){W.hold=t;setPc(t);vmx.pl=1;beep(520,.05)}
function place(pt){const lx=pt.x-tp.position.x,lz=pt.z-tp.position.z,d=Math.hypot(lx,lz),r=.3,x=d>r?lx/d*r:lx,z=d>r?lz/d*r:lz,m=topMesh(W.hold);
  m.position.set(x,.1,z);m.rotation.y=Math.random()*6;tpT.add(m);W.top.push({t:W.hold,x,z,m});
  tw(.25,u=>{const e=u-1;m.scale.setScalar(Math.max(.01,1+2.70158*e*e*e+1.70158*e*e));m.position.y=.1+Math.sin(u*Math.PI)*.15});
  const b0=W.bad;tally();if(W.bad>b0){W.err++;beep(180,.12,'sawtooth')}else beep(700,.05);vmx.pl=1;setTk()}
function cut(){const i=W.cuts++,l=box(.84,.012,.012,0x5a3b1a,0,.075,0,cp);l.rotation.y=i*Math.PI/3;tw(.15,u=>l.scale.x=u);vmx.cut=1;burst(cp.position,0xffe9a8,5,1.5,.2);beep(300+i*60,.05,'square');if(W.cuts>=3)adv()}
function use(t,go){
  if(!t)return'';const k=t.k;
  if(!W){const c=k==='cust'&&cu.get(t.id);if(c&&c.st==='wait'&&!c.by){if(go){send({t:'claim',c:t.id});beep(660,.08)}return'E: 注文を受ける'}return''}
  const s=SK[W.s];
  if(k==='trash'){if(go)clear(true);return'E: 捨てて最初から'}
  if(s==='dough'&&k==='crate'){if(go)adv();return'E: 生地をとる'}
  if(s==='top'){if(k==='bowl'){if(go)pick(t.t);return'E: '+TOPS[t.t][0]+'をつまむ'}if(k==='table'&&W.done){if(go)adv();return'E: ピールにのせる'}}
  if(s==='peel'&&k==='oven'){if(ov[t.i][0])return'このオーブンは使用中';if(go)send({t:'oven',i:t.i,op:'in'});return'E: オーブンに入れる'}
  if(s==='bake'&&k==='oven'&&t.i===W.oi){if(go)send({t:'oven',i:t.i,op:'out'});return'E: 取り出す'}
  if(s==='cut'&&k==='cutb'&&!W.placed){if(go){W.placed=true;cp.clear();cp.add(bakedPz(bkind()));cp.position.y=1.1;tw(.3,u=>cp.position.y=1.1+(1-u)*.3);setTk()}return'E: カット台にのせる'}
  if(s==='box'&&k==='cutb'){if(go){bxHold=time+.8;tw(.7,u=>{lidG.rotation.x=1.9*(1-Math.max(0,(u-.35)/.65))});adv()}return'E: 箱につめる'}
  if(s==='serve'&&k==='cust'&&t.id===W.c){if(go)send({t:'serve',c:W.c,q:score()});return'E: 渡す'}
  return''}
function lmb(t,dt,down,go){
  if(!W||!t)return'';const s=SK[W.s],k=t.k;
  if(k==='bowl'&&s==='top'){if(go&&down)pick(t.t);return TOPS[t.t][0]+'をつまむ'}
  if(k==='table'){
    if(s==='roll'){if(!W.placed){if(go&&down){W.placed=true;vmx.pl=1;beep(300,.08)}return'左クリック: 生地を台に置く'}
      if(go){W.pr=Math.min(1,W.pr+dt*.5);if(Math.random()<dt*16)shred(tp.position.clone().add(new T.Vector3((Math.random()-.5)*.5,.12,(Math.random()-.5)*.5)),0xffffff);if(W.pr>=1)adv()}return'長押し: めん棒でのばす'}
    if(s==='sauce'){if(go){W.pr=Math.min(1,W.pr+dt*.45);if(Math.random()<dt*20)shred(hw(),0xd9482b);if(W.pr>=1)adv()}return'長押し: ソースをぬる'}
    if(s==='cheese'){if(go){W.pr=Math.min(1,W.pr+dt*.5);if(Math.random()<dt*40)shred(hw(),0xffe27a);if(W.pr>=1)adv()}return'長押し: チーズをかける'}
    if(s==='top'&&W.hold){if(go&&down)place(t.pt);return'左クリック: '+TOPS[W.hold][0]+'をのせる'}}
  if(k==='cutb'&&s==='cut'&&W.placed){if(go&&down)cut();return`左クリック: カット (${W.cuts}/3)`}
  return''}

/* ---------- entities ---------- */
function addPl(id,x,z){const inf=info.get(id)||{name:'?',color:0},root=new T.Group(),g=chef(COL[inf.color],0),lb=label(inf.name);lb.position.y=2.35;root.add(g,lb);root.position.set(x,0,z);S.add(root);const c={root,g,tx:x,tz:z,try:0,mv:0};pl.set(id,c);return c}
function addCu(id,slot,ord){const root=new T.Group(),g=chef(new T.Color().setHSL(Math.random(),.6,.55).getHex(),1);
  const bg=new T.Sprite(new T.SpriteMaterial({color:0,opacity:.55,transparent:true,depthTest:false}));bg.center.set(0,.5);bg.scale.set(1.1,.2,1);bg.position.set(-.55,2.12,0);bg.renderOrder=10;
  const bar=new T.Sprite(new T.SpriteMaterial({color:0x44ff44,depthTest:false}));bar.center.set(0,.5);bar.position.set(-.5,2.12,0);bar.renderOrder=11;
  const bub=spr(bubTex(ord,0),1.6,.75);bub.position.y=2.75;
  root.add(g,bg,bar,bub);root.position.set(5,0,-8);root.userData={k:'cust',id};S.add(root);inter.push(root);
  const c={root,g,bg,bar,bub,slot,ord,by:0,st:'wait',pat:1,rt:0,gone:false};cu.set(id,c);return c}
function ev(e){
  if(e.k==='serve'){const c=cu.get(e.c);if(c){c.g.userData.pop=1;burst(c.root.position,0xffd23f,16,4,2);pop(P3(c.root,2.9),'+$'+e.v);beep(880,.1);setTimeout(()=>beep(1320,.18),90)}
    if(e.p===me){const n=Math.round(e.q/20);toast(`🍕 提供! +$${e.v}　${'★'.repeat(n)}${'☆'.repeat(5-n)}`);clear(false)}}
  else if(e.k==='angry'){const c=cu.get(e.c);if(c){burst(c.root.position,0xff3b2f,10,3,2);pop(P3(c.root,2.9),'💢 -$10');beep(110,.3,'sawtooth')}}
  else if(e.k==='ding'){burst(stn['o'+e.i].g.position,0x7dff7d,14,3,1.6);beep(1046,.3,'sine');if(ov[e.i]&&ov[e.i][1]===me)toast('🔔 焼き上がり! 取り出して!')}
  else if(e.k==='burn'){if(ov[e.i]&&ov[e.i][1]===me)toast('🔥 焦げ始めた!');beep(90,.4,'sawtooth')}
  else if(e.k==='load'){toast('📂 ロードしました');clear(false)}}
function state(m){
  money=m.m;$('#d').textContent=m.d;$('#sv').textContent=m.sv;$('#ls').textContent=m.ls;ov=m.o;
  const seen=new Set();
  for(const [id,x,z,ry,mv] of m.p){if(id===me){if(!inited){P.x=x;P.z=z;inited=true}continue}seen.add(id);const c=pl.get(id)||addPl(id,x,z);c.tx=x;c.tz=z;c.try=ry+Math.PI;c.mv=mv}
  for(const [id,c] of pl)if(!seen.has(id)){S.remove(c.root);pl.delete(id)}
  const ids=new Set(m.c.map(a=>a[0]));
  for(const [id,slot,pat,st,ord,by] of m.c){const c=cu.get(id)||addCu(id,slot,ord);c.pat=pat;c.st=st;if(c.by!==by){c.by=by;c.bub.material.map=bubTex(ord,by);c.bub.material.needsUpdate=true}}
  for(const [id,c] of cu)if(!ids.has(id))c.gone=true;
  m.e.forEach(ev);
  const mine=m.c.find(a=>a[5]===me&&a[3]==='wait');
  if(mine&&!W){W=newW(mine);setTk();toast('🧾 注文を受けました! 手順どおりに作ろう')}
  else if(W&&!(mine&&mine[0]===W.c)){toast('注文が取り消されました');clear(false)}}

/* ---------- input ---------- */
addEventListener('keydown',e=>{keys[e.code]=1;if(!started||!locked||e.repeat)return;
  if(e.code==='KeyE')use(tgt,true);
  else if(e.code==='KeyK'){wantX=false;send({t:'save'})}
  else if(e.code==='KeyQ'&&W&&SK[W.s]==='top'&&W.top.length){const p=W.top.pop();tpT.remove(p.m);tally();setTk();beep(250,.06)}});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousedown',e=>{if(e.button===0&&locked){keys.lmb=1;lmbDown=true}});
addEventListener('mouseup',e=>{if(e.button===0)keys.lmb=0});
addEventListener('mousemove',e=>{if(locked){P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.35,Math.min(1.35,P.pitch-e.movementY*.0022))}});
$('#c').onclick=()=>{if(started&&!locked)$('#c').requestPointerLock()};
document.onpointerlockchange=()=>{locked=document.pointerLockElement===$('#c');$('#lock').hidden=!started||locked;if(!locked)keys.lmb=0};

/* ---------- network / lobby / save ---------- */
const conn=()=>new Promise((ok,ng)=>{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);ws.onopen=ok;ws.onerror=()=>{$('#err').textContent='サーバーに接続できません';ng()};ws.onmessage=e=>on(JSON.parse(e.data));ws.onclose=()=>{if(me)toast('切断されました。再読み込みしてください')}});
const send=o=>ws&&ws.readyState===1&&ws.send(JSON.stringify(o));
const enter=async m=>{$('#err').textContent='';try{if(!ws||ws.readyState!==1)await conn()}catch{return}send({...m,name:$('#name').value.trim()||'Chef',color:col})};
function on(m){
  if(m.t==='joined'){me=m.you;$('#s1').hidden=true;$('#s2').hidden=false;$('#bigcode').textContent=m.code;$('#rc').textContent='ROOM '+m.code}
  else if(m.t==='lobby'){host=m.host;m.players.forEach(p=>info.set(p.id,p));
    $('#pl').innerHTML=m.players.map(p=>`<li><b style="color:${hex(COL[p.color])}">●</b> ${esc(p.name)}${p.id===m.host?' 👑':''}</li>`).join('');
    $('#start').hidden=me!==host;$('#wait').hidden=me===host;
    if(m.started&&!started){started=true;$('#lobby').hidden=true;$('#hud').hidden=false;$('#lock').hidden=false;document.activeElement?.blur()}}
  else if(m.t==='s')state(m);
  else if(m.t==='err')$('#err').textContent=m.msg;
  else if(m.t==='in'){if(W&&W.s===5){adv();W.oi=m.i;vmx.sw=true;tw(.5,u=>{vmx.sl=u;if(u>=1)vmx.sw=false})}}
  else if(m.t==='out'){if(W&&W.s===6){W.tm=m.tm;adv();setPeelPz(bkind());vmx.sw=true;tw(.5,u=>{vmx.sl=1-u;if(u>=1)vmx.sw=false});toast(m.tm<8?'生焼け…':m.tm<=11.5?'🔥 いい焼き色!':m.tm<=14?'ちょっと焼きすぎ':'焦げた…')}}
  else if(m.t==='no')toast('いまは入れられません');
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
const rc=new T.Raycaster(),c0=new T.Vector2(0,0);
function update(dt){
  dsp+=(money-dsp)*Math.min(1,dt*6);$('#m').textContent=Math.round(dsp);
  const down=lmbDown;lmbDown=false;let act=false;
  vm.visible=started;
  if(started){
    if(locked){const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),n=Math.hypot(f,r)||1,sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);
      P.x=Math.max(-6.3,Math.min(6.3,P.x+(-sy*f+cy*r)/n*3.2*dt));P.z=Math.max(1.3,Math.min(5.75,P.z+(-cy*f-sy*r)/n*3.2*dt));
      P.sp+=((f||r?1:0)-P.sp)*Math.min(1,dt*8)}else P.sp*=.9;
    bob+=dt*P.sp*9;
    cam.position.set(P.x+Math.sin(bob*.5)*.012*P.sp,1.62+Math.abs(Math.sin(bob))*.03*P.sp,P.z);cam.rotation.set(P.pitch,P.yaw,0);cam.updateMatrixWorld();
    if(performance.now()-ls>66){ls=performance.now();send({t:'pos',x:P.x,z:P.z,ry:P.yaw,mv:P.sp>.3?1:0})}
    rc.setFromCamera(c0,cam);rc.far=5;tgt=null;
    for(const x of rc.intersectObjects(inter,true)){let o=x.object;while(o&&!o.userData.k)o=o.parent;if(o){if(o.userData.k==='cust'||x.distance<2.8)tgt={...o.userData,pt:x.point};break}}
    let lab='';
    if(locked){lab=use(tgt,false)||lmb(tgt,0,false,false);
      act=!!(keys.lmb&&tgt&&tgt.k==='table'&&W&&(SK[W.s]==='sauce'||SK[W.s]==='cheese'||(SK[W.s]==='roll'&&W.placed)));
      if(keys.lmb)lmb(tgt,dt,down,true)}
    const txt=locked?(lab||(W?'':'カウンターのお客さんを見て E: 注文を受ける')):'';
    if(txt!==lastPr){lastPr=txt;$('#pr').textContent=txt;$('#xh').classList.toggle('on',!!lab)}
  }else{cam.position.set(0,1.65,3.2);cam.rotation.set(-.05,Math.sin(time*.15)*.9,0)}
  if(!vmx.sw)setPeelPz(W?(W.s===5?'raw':(W.s===7&&!W.placed)?bkind():null):null);
  vmUpdate(dt,act);
  const bkEl=$('#bk');bkEl.hidden=!(W&&W.s===6);if(!bkEl.hidden)$('#bkn').style.left=Math.min(100,(ov[W.oi]?ov[W.oi][2]:0)/16*100)+'%';
  tp.visible=!!W&&W.placed&&W.s>=1&&W.s<=4;
  if(tp.visible){const r=W.s===1?W.pr:1;tpD.scale.set(.35+.65*r,W.s===1?2.4-1.4*r:1,.35+.65*r);
    tpS.visible=W.s>=2;if(tpS.visible){const q=W.s===2?Math.max(.03,W.pr):1;tpS.scale.set(q,1,q)}
    tpC.visible=W.s>=3;if(tpC.visible){const q=W.s===3?Math.max(.03,W.pr):1;tpC.scale.set(q,1,q)}}
  cp.visible=!!W&&((W.s===7&&W.placed)||W.s===8||time<bxHold);bx.visible=(!!W&&W.s===8)||time<bxHold;if(W&&W.s===8)cp.position.y=1.17;
  for(const [id,c] of pl){const p=c.root.position,k=Math.min(1,dt*9);p.x+=(c.tx-p.x)*k;p.z+=(c.tz-p.z)*k;anim(c.g,dt,time,c.mv,c.try)}
  for(const [id,c] of cu){
    const leaving=c.gone||c.st!=='wait';if(leaving)c.rt+=dt;
    const go=leaving&&c.rt>(c.st==='angry'?.5:1.1),p=c.root.position;let tx,tz;
    if(!go){tx=SLX[c.slot];tz=-1.6;if(p.z<-3.4){tx=5;tz=-3}}else{tx=5;tz=-8;if(p.z>-3.2&&Math.abs(p.x-5)>.5)tz=-3}
    const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),mv=d>.15,sp=c.st==='angry'?5.5:3.4;
    if(mv){const s=Math.min(d,sp*dt)/d;p.x+=dx*s;p.z+=dz*s}
    if(c.st==='happy'&&leaving&&!go&&Math.floor(c.rt*2)!==c.hp){c.hp=Math.floor(c.rt*2);c.g.userData.pop=1}
    c.g.rotation.z=c.st==='angry'&&!go?Math.sin(time*50)*.15:0;
    anim(c.g,dt,time,mv,mv?Math.atan2(dx,dz):0);
    const w=!leaving;c.bar.visible=c.bg.visible=c.bub.visible=w;
    if(w){c.bar.scale.set(Math.max(.001,c.pat),.14,1);c.bar.material.color.setHSL(c.pat*.33,.9,.5);c.bub.scale.set(1.6*(1+Math.sin(time*(3+(1-c.pat)*8))*.03),.75*(1+Math.sin(time*(3+(1-c.pat)*8))*.03),1)}
    if(c.gone&&go&&p.z<-7.5){S.remove(c.root);inter.splice(inter.indexOf(c.root),1);cu.delete(id)}}
  [0,1].forEach(i=>{const o=stn['o'+i],[s,ow,t]=ov[i]||[0,0,0],kind=s?(t<8?'raw':t<=14?'pizza':'burnt'):null;
    if(o.pk!==kind){if(o.pz)o.g.remove(o.pz);o.pz=kind?pizza(kind):null;if(o.pz){o.pz.position.set(0,.55,-.52);o.pz.scale.setScalar(.5);o.pz.rotation.x=-Math.PI/2;o.g.add(o.pz)}o.pk=kind}
    if(o.pz&&s&&t<8)o.pz.rotation.y+=dt*.8;
    const glow=!s?0:t>14?.15:.8+Math.sin(time*8)*.2,em=o.mouth.material;em.emissiveIntensity+=(glow-em.emissiveIntensity)*Math.min(1,dt*8);o.light.intensity=em.emissiveIntensity*14;
    const pr=!s?0:t<8?t/8:t<14?1-(t-8)/6:1;o.bar.scale.x=Math.max(.001,pr);o.bar.material.color.setHSL(!s?0:t<8?.08:t<14?.33*pr:0,.9,.5);
    if(s&&t>14&&((o.sm=(o.sm||0)-dt)<0)){o.sm=.2;smoke(new T.Vector3(o.g.position.x,2.4,o.g.position.z))}});
  for(let i=fx.length-1;i>=0;i--){const o=fx[i];o.t+=dt;if(o.f(o.m,o.t,dt)){S.remove(o.m);fx.splice(i,1)}}
  sign.material.opacity=.9+Math.sin(time*23)*.05-(Math.random()<.015?.45:0)}
let lastT=performance.now();
(function loop(n){const dt=Math.min(.05,(n-lastT)/1000);lastT=n;time+=dt;update(dt);R.render(S,cam);requestAnimationFrame(loop)})(lastT);
