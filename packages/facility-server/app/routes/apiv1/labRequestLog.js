import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

export const labRequestLog = express.Router();

labRequestLog.get(
  '/labRequest/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('list', 'LabRequestLog');

    const logs = await models.LabRequestLog.findAll({
      where: { labRequestId: params.id },
      order: [['createdAt', 'DESC']],
    });

    const logsWithDisplayName = await Promise.all(
      logs.map(async log => {
        const updatedByDisplayName = (await models.User.findByPk(log.updatedById)).dataValues
          .displayName;
        return { ...log.dataValues, updatedByDisplayName };
      }),
    );

    res.send({
      count: logsWithDisplayName.length,
      data: logsWithDisplayName,
    });
  }),
);

labRequestLog.get(
  '/labRequest/:id/latest-published',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('list', 'LabRequestLog');

    const publishedLog = await models.LabRequestLog.findOne({
      where: {
        labRequestId: params.id,
        status: { [Op.in]: [LAB_REQUEST_STATUSES.PUBLISHED, LAB_REQUEST_STATUSES.VERIFIED] },
      },
      order: [['createdAt', 'DESC']],
      include: [{ association: 'updatedBy', attributes: ['displayName'] }],
    });

    res.send(publishedLog);
  }),
);
