import https from 'node:https';
import crypto from 'node:crypto';

// A stand-in facility server: HTTPS with a given key/cert, a tiny page that
// exercises secure-context APIs + localStorage + a WebSocket, and a hand-rolled
// WebSocket echo endpoint (no dependencies).

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>Tamanu Iti mock facility</title></head>
<body>
<div id="marker">tamanu-iti-mock-facility</div>
<script>
  window.__probe = {
    secureContext: window.isSecureContext,
    hasSubtleCrypto: !!(window.crypto && window.crypto.subtle),
    origin: location.origin,
    ws: null,
  };
  // localStorage counter: proves per-origin storage works and persists.
  var visits = Number(localStorage.getItem('visits') || '0') + 1;
  localStorage.setItem('visits', String(visits));
  window.__probe.visits = visits;
  // WebSocket round-trip through the loopback proxy.
  try {
    var ws = new WebSocket('ws://' + location.host + '/ws');
    ws.onopen = function () { ws.send('ping'); };
    ws.onmessage = function (e) { window.__probe.ws = e.data; };
    ws.onerror = function () { window.__probe.ws = 'error'; };
  } catch (e) { window.__probe.ws = 'throw:' + e.message; }
</script>
</body></html>`;

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  let mask;
  if (masked) {
    mask = buf.slice(offset, offset + 4);
    offset += 4;
  }
  const payload = buf.slice(offset, offset + len);
  if (masked) for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
  return { opcode, payload };
}

function encodeText(str) {
  const payload = Buffer.from(str);
  let header;
  if (payload.length < 126) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }
  return Buffer.concat([header, payload]);
}

function handleWebSocket(req, socket) {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  socket.on('data', buf => {
    const frame = decodeFrame(buf);
    if (!frame) return;
    if (frame.opcode === 0x8) {
      socket.end();
      return;
    }
    if (frame.opcode === 0x1) socket.write(encodeText(frame.payload.toString('utf8')));
  });
}

export function startMockFacility({ key, cert }) {
  const server = https.createServer({ key, cert }, (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      return;
    }
    if (req.url === '/' || req.url.startsWith('/index')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(PAGE);
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  server.on('upgrade', handleWebSocket);
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () =>
      resolve({
        port: server.address().port,
        close: () => new Promise(r => server.close(r)),
      }),
    );
  });
}
