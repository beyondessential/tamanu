import express from 'express';

export const serversRouter = express.Router();

const servers = [
  { name: 'Dev', type: 'dev', host: 'https://sync-dev.tamanu.io', },
  { name: 'Stress testing', type: 'dev', host: 'http://tamanu-sync-server-stress-test.ap-southeast-2.elasticbeanstalk.com', },
  { name: 'Fiji', type: 'live', host: 'https://fiji.tamanu.io', },
  { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io', },
  { name: 'Samoa', type: 'live', host: 'https://samoa.tamanu.io', },
];

serversRouter.get('/', (req, res) => {
  res.send(servers);
});
