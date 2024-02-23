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

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
  }),
);

translationRoutes.post('/', (req, res) => {
  // TODO finish this
  res.send({ ok: 'ok' });
});
