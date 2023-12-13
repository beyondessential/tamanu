import config from 'config';
import { Router } from 'express';
import { userMiddleware } from '../../auth/userMiddleware';

export const publicRoutes = Router();

// handles its own authentication using a separate secret + token issuance workflow, see default.json5
publicRoutes.use(userMiddleware({ secret: config.integrations.omniLab.secret }));

publicRoutes.get('/', (req, res) => {
  res.status(200).send({ implemented: false });
});
