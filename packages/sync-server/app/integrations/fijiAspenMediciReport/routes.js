import { QueryTypes } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { requireClientHeaders } from '../../middleware/requireClientHeaders';

export const routes = express.Router();

const reportQuery = `
select * from users limit 1;
`;

routes.use(requireClientHeaders);
routes.get(
  '/',
  asyncHandler(async (req, res) => {
    // req.checkPermission('read', 'Signer');
    const { sequelize } = req.store;
    const data = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
    });

    res.status(200).send({ data });
  }),
);
