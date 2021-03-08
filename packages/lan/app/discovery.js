import dgram from 'dgram';
import config from 'config';

import { log } from './logging';
import { version } from '../package.json';

import { DISCOVERY_MAGIC_STRING, DISCOVERY_PORT } from 'shared/constants';

export function listenForServerQueries() {
  const socket = dgram.createSocket('udp4');
  let address = '';
  const serverPort = config.port;
  const { overrideAddress, protocol } = config.discovery;

  socket.on('message', (msg, rinfo) => {
    if (`${msg}`.trim() !== DISCOVERY_MAGIC_STRING) {
      // not a locator message, probably an unrelated service
      // broadcasting on the same port.
      return;
    }

    log.info(`Sending server details to ${rinfo.address}:${rinfo.port}...`);
    socket.send(JSON.stringify({
      magicString: DISCOVERY_MAGIC_STRING,
      port: serverPort,
      address: overrideAddress,
      protocol,
      version,
    }), rinfo.port, rinfo.address);
  });

  socket.on('listening', () => {
    address = socket.address().address;
    log.info(`Server locator listening on ${address}:${DISCOVERY_PORT}`);
  });

  socket.bind(DISCOVERY_PORT);
}

