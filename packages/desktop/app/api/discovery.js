import dgram from 'dgram';
import { isEqual } from 'lodash';

import { DISCOVERY_PORT, DISCOVERY_MAGIC_STRING } from '@tamanu/constants';

const PORT = process.env.DISCOVERY_PORT || DISCOVERY_PORT;
const BROADCAST_IP = '255.255.255.255';

export async function discoverServer() {
  const socket = dgram.createSocket('udp4');

  const promise = new Promise((resolve, reject) => {
    const servers = [];

    socket.on('message', (msg, rinfo) => {
      if (`${msg}`.includes(DISCOVERY_MAGIC_STRING)) {
        try {
          const data = JSON.parse(msg);
          const { port, version, overrideAddress, protocol } = data;
          const server = {
            address: overrideAddress || rinfo.address,
            protocol,
            port,
            version,
          };
          if (!servers.find(s => isEqual(s, server))) {
            servers.push(server);
          }
        } catch (e) {
          // deliberate logging
          // eslint-disable-next-line no-console
          console.warn(e);
        }
      }
    });

    socket.on('listening', () => {
      socket.setBroadcast(true);
      socket.send(DISCOVERY_MAGIC_STRING, PORT, BROADCAST_IP);
      setTimeout(() => {
        if (servers.length === 0) {
          reject(new Error('Server discovery broadcast timed out'));
        } else {
          resolve(servers);
        }
      }, 2000);
    });
  });

  socket.bind();

  try {
    const response = await promise;
    return response;
  } catch (e) {
    // deliberate logging
    // eslint-disable-next-line no-console
    console.warn(e);
    return null;
  } finally {
    socket.close();
  }
}
