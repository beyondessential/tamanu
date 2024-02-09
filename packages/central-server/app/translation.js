import { NOT_MODIFIED_STATUS_CODE } from '@tamanu/constants';
import { keyBy, mapValues } from 'lodash';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';

export const translationRoutes = Router();

translationRoutes.get(
  '/:language',
  asyncHandler(async (req, res) => {
    const {
      models: { TranslatedString },
      params: { language },
    } = req;

    const eTag = await TranslatedString.etagForLanguage(language);

    if (req.headers['if-none-match'] === eTag) {
      res.status(NOT_MODIFIED_STATUS_CODE).end();
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', eTag);

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
  }),
);
