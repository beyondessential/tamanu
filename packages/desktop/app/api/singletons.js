import React from 'react';
import { app } from 'electron';
import { TamanuApi } from './TamanuApi';

import { discoverServer } from './discovery';

(async () => {
  // TODO: incorporate discovered server into TamanuApi object
  const serverDetails = await discoverServer();
  if(!serverDetails) return;

  const { protocol, address, port } = serverDetails;
  const host = `${protocol}://${address}:${port}`;
  console.log("Discovered server", host);
})();

const host = process.env.HOST;
if (!host) {
  console.error('Warning: environmental variable HOST must be set');
}
export const API = new TamanuApi(host, app.getVersion());
export const ApiContext = React.createContext(API);
