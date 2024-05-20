import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';
import cronstrue from 'cronstrue';

import { NotFoundError } from '@tamanu/shared/errors';
import { MATERIALIZED_VIEW_REFRESH_CONFIG } from '@tamanu/constants';

import { TranslatedCronParser } from '../../utils/TranslatedCronParser';

export const materializedView = express.Router();

materializedView.get(
  '/refreshStats/:viewName',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { viewName } = req.params;
    const { models, query } = req;
    const { language } = query;
    const { TranslatedString } = models;
    const taskConfig = config.schedules.refreshMaterializedView[viewName];
    if (!taskConfig) {
      throw new NotFoundError();
    }
    const { schedule } = taskConfig;
    const refreshConfig = MATERIALIZED_VIEW_REFRESH_CONFIG[viewName];
    if (!refreshConfig) {
      throw new NotFoundError();
    }
    const { refreshedAtKey } = refreshConfig;
    const translationFunc = await TranslatedString.getTranslationFunction(language);
    cronstrue.locales.custom = new TranslatedCronParser(translationFunc);
    return res.send({
      lastRefreshed: await req.models.LocalSystemFact.get(refreshedAtKey),
      schedule: cronstrue.toString(schedule, {
        locale: 'custom',
      }),
    });
  }),
);
