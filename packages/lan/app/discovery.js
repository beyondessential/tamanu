import dgram from 'dgram';
import config from 'config';

import { log } from 'shared/services/logging';
import { DISCOVERY_MAGIC_STRING, DISCOVERY_PORT } from 'shared/constants';

import { version } from '../package.json';

export function listenForServerQueries() {
  const socket = dgram.createSocket('udp4');
  let address = '';
  const serverPort = config.port;
  const { overrideAddress, overridePort, protocol } = config.discovery;

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

  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, closing UDP discovery server');
    socket.close();
  });
}
