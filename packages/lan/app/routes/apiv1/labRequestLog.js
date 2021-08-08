import express from 'express';
import asyncHandler from 'express-async-handler';

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
        const updatedByDisplayName = (await models.User.findByPk(log.updatedById)).dataValues.displayName;
        return { ...log.dataValues, updatedByDisplayName };
      }),
    );

    res.send({
      count: logsWithDisplayName.length,
      data: logsWithDisplayName,
    });
  }),
);
