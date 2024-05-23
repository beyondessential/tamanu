import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from '@tamanu/shared/errors';

import { getTranslatedCronParser } from '../../utils/getTranslatedCronParser';

export const materializedView = express.Router();

materializedView.get(
  '/refreshStats/:tableName',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { tableName } = req.params;
    const { models, query } = req;
    const { language } = query;
    const taskConfig = config.schedules.refreshMaterializedView[tableName];
    if (!taskConfig) {
      throw new NotFoundError();
    }
    const { schedule } = taskConfig;
    const parseCronExpression = await getTranslatedCronParser(models, language);
    return res.send({
      lastRefreshed: await req.models.LocalSystemFact.get(
        `materializedViewLastRefreshedAt:${tableName}`,
      ),
      schedule: parseCronExpression(schedule),
    });
  }),
);
