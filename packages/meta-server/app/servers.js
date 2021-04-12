import express from 'express';

export const serversRouter = express.Router();

const servers = [
  { name: 'Dev', type: 'dev', host: 'https://sync-dev.tamanu.io' },
  { name: 'Demo', type: 'live', host: 'https://sync-demo.tamanu.io' },
  { name: 'Stress testing', type: 'dev', host: 'https://sync-stress-test.tamanu.io' },
  { name: 'Fiji', type: 'live', host: 'https://fiji.tamanu.io' },
  { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io' },
  { name: 'Samoa', type: 'live', host: 'https://tamanu-sync.health.gov.ws' },
];

serversRouter.get('/', (req, res) => {
  res.send(servers);
});
