import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import { log } from './logging';

const isDevelopment = process.env.NODE_ENV === 'development';

const versionRouter = express.Router();

const appVersions = {
  desktop: '0.0.1',
  mobile: '0.0.1',
  lan: '0.0.1',
};

['desktop', 'mobile', 'lan'].map(appType => {
  versionRouter.get(`/${appType}`, (req, res) => {
    res.send({
      appType,
      version: '0.0.1',
    });
  });
});

export function createApp() {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/version', versionRouter);

  const servers = [
    { name: 'Dev', type: 'dev', host: 'https://dev-sync.tamanu.io', },
    { name: 'Fiji', type: 'live', host: 'https://fiji.tamanu.io', },
    { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io', },
    { name: 'Samoa', type: 'live', host: 'https://samoa.tamanu.io', },
  ];

  app.get('/servers', (req, res) => {
    res.send(servers);
  });

  app.get('/', (req, res) => {
    res.send({
      index: true,
    });
  });

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use((error, req, res, _) => {
    res.status(500).send({
      error: {
        message: error.message,
        ...error,
      } 
    });
  });

  return app;
}
