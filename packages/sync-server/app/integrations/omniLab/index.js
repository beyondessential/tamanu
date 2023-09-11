import { Router } from 'express';
import config from 'config';
import { userMiddleware } from '../../auth/userMiddleware';

export const publicRoutes = Router();

// TODO: use db config fetcher?
// handles its own authentication using a separate secret + token issuance workflow, see default.json
publicRoutes.use(userMiddleware({ secret: config.integrations.omniLab.secret }));

publicRoutes.get('/', (req, res) => {
  res.status(200).send({ implemented: false });
});
