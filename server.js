const express = require('express'), http = require('http'), path = require('path'), { WebSocketServer } = require('ws');
const app = express();
const ST = [
  { id: 'dough', type: 'dough', x: -7, z: -5.5 }, { id: 'top', type: 'top', x: -3.5, z: -5.5 },
  { id: 'o0', type: 'oven', x: 1, z: -6.3, i: 0 }, { id: 'o1', type: 'oven', x: 4.5, z: -6.3, i: 1 },
  { id: 'trash', type: 'trash', x: 7.6, z: -3 },
  { id: 'c0', type: 'counter', x: -4, z: -1.4, slot: 0 }, { id: 'c1', type: 'counter', x: 0, z: -1.4, slot: 1 }, { id: 'c2', type: 'counter', x: 4, z: -1.4, slot: 2 }];
app.get('/health', (_, r) => r.send('ok'));
app.get('/stations.json', (_, r) => r.json(ST));
app.use('/three', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app), wss = new WebSocketServer({ server, maxPayload: 32768 });

const rooms = new Map(), L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const num = v => Number.isFinite(+v) ? Math.max(0, Math.min(1e9, +v)) : 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const send = (ws, o) => ws.readyState === 1 && ws.send(JSON.stringify(o));
const day = r => 1 + Math.floor(r.time / 120);
function code() { let c; do { c = Array.from({ length: 4 }, () => L[Math.random() * L.length | 0]).join('') } while (rooms.has(c)); return c }
function newRoom() { return { code: code(), players: new Map(), host: 0, started: false, money: 0, served: 0, lost: 0, time: 0, nid: 1, cid: 1, cust: [], ovens: [{ s: 'empty', t: 0 }, { s: 'empty', t: 0 }], ev: [], sp: 2 } }
function applySave(r, d) { d = d || {}; r.money = num(d.money); r.served = num(d.served); r.lost = num(d.lost); r.time = num(d.time); r.cust = []; r.ovens = [{ s: 'empty', t: 0 }, { s: 'empty', t: 0 }]; r.players.forEach(p => p.carry = null); r.ev.push({ k: 'load' }) }
function lobby(r) { const o = { t: 'lobby', host: r.host, started: r.started, players: [...r.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color })) }; r.players.forEach(p => send(p.ws, o)) }
function join(ws, r, m) {
  const id = r.nid++, p = { id, ws, name: String(m.name || 'Chef').slice(0, 12), color: clamp(m.color | 0, 0, 7), x: (Math.random() - .5) * 6, z: -3, ry: 0, mv: 0, carry: null };
  r.players.set(id, p); ws.p = p; ws.r = r; if (!r.host) r.host = id;
  send(ws, { t: 'joined', you: id, code: r.code }); lobby(r);
}
function act(r, p) {
  let st = null, bd = 2.6;
  for (const s of ST) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd) { bd = d; st = s } }
  let ok = false;
  if (st) {
    const o = r.ovens[st.i];
    if (st.type === 'dough' && !p.carry) { p.carry = 'dough'; ok = true }
    else if (st.type === 'top' && p.carry === 'dough') { p.carry = 'raw'; ok = true }
    else if (st.type === 'oven') {
      if (p.carry === 'raw' && o.s === 'empty') { o.s = 'baking'; o.t = 0; p.carry = null; ok = true }
      else if (!p.carry && (o.s === 'done' || o.s === 'burnt')) { p.carry = o.s === 'done' ? 'pizza' : 'burnt'; o.s = 'empty'; o.t = 0; ok = true }
    }
    else if (st.type === 'trash' && p.carry) { p.carry = null; ok = true }
    else if (st.type === 'counter' && p.carry === 'pizza') {
      const c = r.cust.find(c => c.slot === st.slot && c.st === 'wait');
      if (c) { const v = 25 + Math.round(c.pat * 15); r.money += v; r.served++; c.st = 'happy'; c.lt = 0; p.carry = null; ok = true; r.ev.push({ k: 'serve', c: c.id, p: p.id, v }) }
    }
  }
  r.ev.push(ok ? { k: 'act', p: p.id, s: st.id } : { k: 'no', p: p.id });
}
function sim(r, dt) {
  r.time += dt; const d = day(r);
  r.ovens.forEach((o, i) => {
    if (o.s === 'baking' || o.s === 'done') {
      o.t += dt;
      if (o.s === 'baking' && o.t >= 8) { o.s = 'done'; r.ev.push({ k: 'ding', o: i }) }
      else if (o.s === 'done' && o.t >= 14) { o.s = 'burnt'; r.ev.push({ k: 'burn', o: i }) }
    }
  });
  r.sp -= dt;
  if (r.sp <= 0) {
    const free = [0, 1, 2].filter(s => !r.cust.some(c => c.slot === s));
    if (free.length) r.cust.push({ id: r.cid++, slot: free[Math.random() * free.length | 0], pat: 1, st: 'wait', lt: 0 });
    r.sp = Math.max(3.5, 9 - d * .7) + Math.random() * 3;
  }
  for (const c of r.cust) {
    if (c.st === 'wait') { c.pat -= dt / Math.max(22, 40 - d * 2); if (c.pat <= 0) { c.pat = 0; c.st = 'angry'; c.lt = 0; r.lost++; r.money = Math.max(0, r.money - 5); r.ev.push({ k: 'angry', c: c.id }) } }
    else c.lt += dt;
  }
  r.cust = r.cust.filter(c => c.st === 'wait' || c.lt < 2.6);
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    try {
      const m = JSON.parse(raw), r = ws.r, p = ws.p;
      if (m.t === 'create' && !r) { const n = newRoom(); rooms.set(n.code, n); join(ws, n, m); if (m.save) applySave(n, m.save) }
      else if (m.t === 'join' && !r) {
        const n = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!n) return send(ws, { t: 'err', msg: 'そのコードのルームは見つかりません' });
        if (n.players.size >= 6) return send(ws, { t: 'err', msg: 'ルームが満員です(最大6人)' });
        join(ws, n, m);
      } else if (r) {
        if (m.t === 'start' && p.id === r.host) { r.started = true; lobby(r) }
        else if (m.t === 'pos') { p.x = clamp(+m.x || 0, -9, 9); p.z = clamp(+m.z || 0, -7.5, -1.7); p.ry = +m.ry || 0; p.mv = m.mv ? 1 : 0 }
        else if (m.t === 'act' && r.started) act(r, p);
        else if (m.t === 'save') send(ws, { t: 'save', data: { v: 1, money: r.money, served: r.served, lost: r.lost, time: Math.floor(r.time), at: Date.now() } });
        else if (m.t === 'load' && p.id === r.host) applySave(r, m.data);
      }
    } catch (e) { }
  });
  ws.on('close', () => {
    const r = ws.r; if (!r) return;
    r.players.delete(ws.p.id);
    if (!r.players.size) { rooms.delete(r.code); return }
    if (r.host === ws.p.id) r.host = r.players.keys().next().value;
    lobby(r);
  });
});
setInterval(() => wss.clients.forEach(c => c.ping()), 25000);
setInterval(() => {
  for (const r of rooms.values()) {
    if (r.started) sim(r, .1);
    const m = JSON.stringify({
      t: 's', m: r.money, d: day(r), sv: r.served, ls: r.lost,
      o: r.ovens.map(o => [o.s, +o.t.toFixed(1)]),
      c: r.cust.map(c => [c.id, c.slot, +c.pat.toFixed(2), c.st]),
      p: [...r.players.values()].map(p => [p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.mv, p.carry]), e: r.ev
    });
    r.ev = []; r.players.forEach(p => p.ws.readyState === 1 && p.ws.send(m));
  }
}, 100);
server.listen(process.env.PORT || 3000, () => console.log('Pizzeria Online listening'));
