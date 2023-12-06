import dgram from 'dgram';
import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { DISCOVERY_MAGIC_STRING, DISCOVERY_PORT } from '@tamanu/constants';

import { version } from './serverInfo';

export function listenForServerQueries({ enabled, overrideAddress, overridePort, protocol }) {
  const serverPort = config.port;
  if (!enabled) {
    return;
  }

  const socket = dgram.createSocket('udp4');
  let address = '';

  socket.on('message', (msg, rinfo) => {
    if (`${msg}`.trim() !== DISCOVERY_MAGIC_STRING) {
      // not a locator message, probably an unrelated service
      // broadcasting on the same port.
      return;
    }

    log.info(`Sending server details to ${rinfo.address}:${rinfo.port}...`);
    socket.send(
      JSON.stringify({
        magicString: DISCOVERY_MAGIC_STRING,
        port: overridePort ?? serverPort,
        overrideAddress,
        protocol,
        version,
      }),
      rinfo.port,
      rinfo.address,
    );
  });

  socket.on('listening', () => {
    address = socket.address().address;
    log.info(`Server locator listening on ${address}:${DISCOVERY_PORT}`);
  });

  socket.bind(DISCOVERY_PORT);

  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing UDP discovery server');
    socket.close();
  });
}
