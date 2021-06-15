import express from 'express';

export const serversRouter = express.Router();

const servers = [
  { name: 'Dev', type: 'dev', host: 'https://sync-dev.tamanu.io' },
  { name: 'Demo', type: 'live', host: 'https://sync-demo.tamanu.io' },
  { name: 'Staging', type: 'dev', host: 'https://sync-staging.tamanu.io' },
  { name: 'Demo (Nauru)', type: 'live', host: 'https://sync-demo-nauru.tamanu.io' },
  { name: 'Stress testing', type: 'dev', host: 'https://sync-stress-test.tamanu.io' },
  { name: 'Fiji', type: 'live', host: 'https://fiji.tamanu.io' },
  { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io' },
  { name: 'Samoa', type: 'live', host: 'https://tamanu-sync.health.gov.ws' },
  {
    name: 'Motivation Australia - Iraq',
    type: 'live',
    host: 'https://motivation-sync-iraq.tamanu.io',
  },
  { name: 'Nauru', type: 'live', host: 'https://sync.tamanu-nauru.org' },
];

serversRouter.get('/', (req, res) => {
  res.send(servers);
});
