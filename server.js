const express = require('express'), http = require('http'), path = require('path'), { WebSocketServer } = require('ws');
const app = express();
app.get('/health', (_, r) => r.send('ok'));
app.use('/three', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app), wss = new WebSocketServer({ server, maxPayload: 32768 });

const rooms = new Map(), L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', TOP = ['pep', 'mush', 'olive', 'basil'];
const num = v => Number.isFinite(+v) ? Math.max(0, Math.min(1e9, +v)) : 0, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const send = (ws, o) => ws.readyState === 1 && ws.send(JSON.stringify(o)), day = r => 1 + Math.floor(r.time / 120);
function code() { let c; do { c = Array.from({ length: 4 }, () => L[Math.random() * L.length | 0]).join('') } while (rooms.has(c)); return c }
const order = () => TOP.slice().sort(() => Math.random() - .5).slice(0, Math.random() < .5 ? 2 : 1).map(t => [t, 2 + (Math.random() * 3 | 0)]);
function newRoom() { return { code: code(), players: new Map(), host: 0, started: false, money: 0, served: 0, lost: 0, time: 0, nid: 1, cid: 1, cust: [], ovens: [{ s: 0, o: 0, t: 0 }, { s: 0, o: 0, t: 0 }], ev: [], sp: 2 } }
function applySave(r, d) { d = d || {}; r.money = num(d.money); r.served = num(d.served); r.lost = num(d.lost); r.time = num(d.time); r.cust = []; r.ovens.forEach(o => { o.s = 0; o.o = 0; o.t = 0 }); r.players.forEach(p => p.ord = 0); r.ev.push({ k: 'load' }) }
function lobby(r) { const o = { t: 'lobby', host: r.host, started: r.started, players: [...r.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color })) }; r.players.forEach(p => send(p.ws, o)) }
function join(ws, r, m) {
  const id = r.nid++, p = { id, ws, name: String(m.name || 'Chef').slice(0, 12), color: clamp(m.color | 0, 0, 7), x: (Math.random() - .5) * 4, z: 3, ry: 0, mv: 0, ord: 0 };
  r.players.set(id, p); ws.p = p; ws.r = r; if (!r.host) r.host = id;
  send(ws, { t: 'joined', you: id, code: r.code }); lobby(r);
}
function sim(r, dt) {
  r.time += dt; const d = day(r);
  r.ovens.forEach((o, i) => { if (o.s) { o.t += dt; if (o.t >= 8 && o.t - dt < 8) r.ev.push({ k: 'ding', i }); if (o.t >= 14 && o.t - dt < 14) r.ev.push({ k: 'burn', i }) } });
  r.sp -= dt;
  if (r.sp <= 0) {
    const free = [0, 1, 2].filter(s => !r.cust.some(c => c.slot === s));
    if (free.length) r.cust.push({ id: r.cid++, slot: free[Math.random() * free.length | 0], pat: 1, st: 'wait', lt: 0, ord: order(), by: 0 });
    r.sp = Math.max(16, 34 - d * 2) + Math.random() * 8;
  }
  for (const c of r.cust) {
    if (c.st === 'wait') {
      c.pat -= dt / Math.max(110, 180 - d * 8);
      if (c.pat <= 0) { c.pat = 0; c.st = 'angry'; c.lt = 0; r.lost++; r.money = Math.max(0, r.money - 10); const q = r.players.get(c.by); if (q) q.ord = 0; r.ev.push({ k: 'angry', c: c.id }) }
    } else c.lt += dt;
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
        else if (m.t === 'pos') { p.x = clamp(+m.x || 0, -6.3, 6.3); p.z = clamp(+m.z || 0, 1.2, 5.8); p.ry = +m.ry || 0; p.mv = m.mv ? 1 : 0 }
        else if (m.t === 'save') send(ws, { t: 'save', data: { v: 2, money: r.money, served: r.served, lost: r.lost, time: Math.floor(r.time), at: Date.now() } });
        else if (m.t === 'load' && p.id === r.host) applySave(r, m.data);
        else if (!r.started) return;
        else if (m.t === 'claim') { const c = r.cust.find(c => c.id === m.c); if (c && c.st === 'wait' && !c.by && !p.ord) { c.by = p.id; p.ord = c.id } }
        else if (m.t === 'drop') { const c = r.cust.find(c => c.by === p.id && c.st === 'wait'); if (c) c.by = 0; p.ord = 0; r.ovens.forEach(o => { if (o.o === p.id) { o.s = 0; o.o = 0 } }) }
        else if (m.t === 'oven') {
          const i = m.i | 0, o = r.ovens[i]; if (!o) return;
          if (m.op === 'in') { if (!o.s && p.ord) { o.s = 1; o.o = p.id; o.t = 0; send(ws, { t: 'in', i }) } else send(ws, { t: 'no' }) }
          else if (o.s && o.o === p.id) { send(ws, { t: 'out', i, tm: +o.t.toFixed(1) }); o.s = 0; o.o = 0; o.t = 0 }
        }
        else if (m.t === 'serve') {
          const c = r.cust.find(c => c.id === m.c);
          if (c && c.by === p.id && c.st === 'wait') {
            const q = clamp(+m.q || 0, 0, 100), v = 20 + Math.round(q * .4) + Math.round(c.pat * 10);
            r.money += v; r.served++; c.st = 'happy'; c.lt = 0; p.ord = 0; r.ev.push({ k: 'serve', c: c.id, p: p.id, v, q: Math.round(q) });
          }
        }
      }
    } catch (e) { }
  });
  ws.on('close', () => {
    const r = ws.r; if (!r) return; const id = ws.p.id;
    r.players.delete(id); r.cust.forEach(c => { if (c.by === id) c.by = 0 }); r.ovens.forEach(o => { if (o.o === id) { o.s = 0; o.o = 0 } });
    if (!r.players.size) { rooms.delete(r.code); return }
    if (r.host === id) r.host = r.players.keys().next().value;
    lobby(r);
  });
});
setInterval(() => wss.clients.forEach(c => c.ping()), 25000);
setInterval(() => {
  for (const r of rooms.values()) {
    if (r.started) sim(r, .1);
    const m = JSON.stringify({
      t: 's', m: r.money, d: day(r), sv: r.served, ls: r.lost,
      o: r.ovens.map(o => [o.s, o.o, +o.t.toFixed(1)]),
      c: r.cust.map(c => [c.id, c.slot, +c.pat.toFixed(3), c.st, c.ord, c.by]),
      p: [...r.players.values()].map(p => [p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.mv]), e: r.ev
    });
    r.ev = []; r.players.forEach(p => p.ws.readyState === 1 && p.ws.send(m));
  }
}, 100);
server.listen(process.env.PORT || 3000, () => console.log('Pizzeria Online listening'));
