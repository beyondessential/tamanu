import express from 'express';
import asyncHandler from 'express-async-handler';

export const translation = express.Router();

translation.get(
  '/:language',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Translation');

    const {
      models: { TranslatedString },
      params: { language },
    } = req;

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    const translationDictionary = Object.fromEntries(
      translatedStringRecords.map(obj => [obj.stringId, obj.text]),
    );

    res.send(translationDictionary);
  }),
);
