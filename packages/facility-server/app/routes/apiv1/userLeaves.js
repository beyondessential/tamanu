import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

export const userLeaves = express.Router();

userLeaves.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { id: userId } = params;

    const user = await models.User.findByPk(userId);
    req.checkPermission('read', user);

    let where = {
      userId,
    };

    if (query.all !== 'true') {
      where.endDate = {
        [Op.gte]: getCurrentDateString(),
      };
    }

    const leaves = await models.UserLeave.findAll({
      where,
      order: [['startDate', 'ASC']],
    });

    res.send(leaves);
  }),
);