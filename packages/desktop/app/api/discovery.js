import dgram from "dgram";

import { DISCOVERY_PORT, DISCOVERY_MAGIC_STRING } from 'shared/constants';

const PORT = process.env.DISCOVERY_PORT || DISCOVERY_PORT;
const BROADCAST_IP = '255.255.255.255';

export async function discoverServer() {
  const socket = dgram.createSocket('udp4');
  let timeout;

  const promise = new Promise((resolve, reject) => {
    socket.on('message', (msg, rinfo) => {
      if(`${msg}`.includes(DISCOVERY_MAGIC_STRING)) {
        try {
          const data = JSON.parse(msg);
          const { port, version, overrideAddress, protocol  } = data;
          clearTimeout(timeout);
          resolve({
            address: overrideAddress || rinfo.address,
            protocol,
            port,
            version,
          });
        } catch(e) {
          console.warn(e);
        }
      }
    });

    socket.on('listening', () => {
      socket.setBroadcast(true);
      socket.send(DISCOVERY_MAGIC_STRING, PORT, BROADCAST_IP);
      timeout = setTimeout(
        () => reject('Server discovery broadcast timed out'),
        2000,
      );
    });
  });

  socket.bind();

  try {
    const response = await promise;
    return response;
  } catch(e) {
    console.warn(e);
    return null;
  } finally {
    socket.close();
  }
}

