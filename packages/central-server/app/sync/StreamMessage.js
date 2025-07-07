import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';

// +---------+---------+----------------+
// |   kind  |  length |     data...    |
// +---------+---------+----------------+
// | 4 bytes | 4 bytes | $length$ bytes |
// +---------+---------+----------------+

export function startStream(res) {
  res.writeHead(200, {
    'Content-Type': 'application/json+frame',
    'Transfer-Encoding': 'chunked',
  });
}

function shape(kind, data = undefined) {
  const dataBytes =
    data === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(data), 'utf8');
  const buf = Buffer.alloc(dataBytes.length + 8);
  buf.writeUInt32BE(kind, 0);
  buf.writeUInt32BE(dataBytes.length, 4);
  dataBytes.copy(buf, 8);
  return buf;
}

export const StreamMessage = {
  sessionWaiting() {
    return shape(SYNC_STREAM_MESSAGE_KIND.SESSION_WAITING);
  },
  pullWaiting() {
    return shape(SYNC_STREAM_MESSAGE_KIND.PULL_WAITING);
  },
  pullChange(data) {
    return shape(SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE, data);
  },
  end(data = {}) {
    return shape(SYNC_STREAM_MESSAGE_KIND.END, Object.entries(data).length > 0 ? data : undefined);
  },
};
