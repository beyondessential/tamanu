import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';
import cronstrue from 'cronstrue';

import { NotFoundError } from '@tamanu/shared/errors';

import { TranslatedCronParser } from '../../utils/TranslatedCronParser';

export const materializedView = express.Router();

materializedView.get(
  '/refreshStats/:tableName',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { tableName } = req.params;
    const { models, query } = req;
    const { language } = query;
    const { TranslatedString } = models;
    const taskConfig = config.schedules.refreshMaterializedView[tableName];
    if (!taskConfig) {
      throw new NotFoundError();
    }
    const { schedule } = taskConfig;
    const translationFunc = await TranslatedString.getTranslationFunction(language);
    cronstrue.locales.custom = new TranslatedCronParser(translationFunc);
    return res.send({
      lastRefreshed: await req.models.LocalSystemFact.get(
        `materializedViewLastRefreshedAt:${tableName}`,
      ),
      schedule: cronstrue.toString(schedule, {
        locale: 'custom',
      }),
    });
  }),
);
