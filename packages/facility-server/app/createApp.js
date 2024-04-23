import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';
import routes from './routes';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);
  const websocket = await createWebsocket(api.httpServer, ctx);
  api.express.use((req, _, next) => {
    req.websocketService = websocket?.websocketService;
    req.websocketClientService = websocket?.websocketClientService;
    next();
  });

  // index route for debugging connectivity
  api.express.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  api.express.use('/', routes);

  // Dis-allow all other routes
  api.express.get('*', (req, res) => {
    res.status(404).end();
  });

  return { express: api.express, server: api.httpServer, websocket };
}
