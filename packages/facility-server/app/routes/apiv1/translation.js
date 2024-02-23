import express from 'express';
import asyncHandler from 'express-async-handler';
import { mapValues, keyBy } from 'lodash';
import { ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

export const translation = express.Router();

// Register a new string for translation
translation.post(
  '/',
  asyncHandler(async (req, res) => {
    // Everyone can interact with translations as long as logged in
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
      body: { stringId, fallback },
    } = req;

    const translatedString = await TranslatedString.create({
      stringId,
      text: fallback,
      language: ENGLISH_LANGUAGE_CODE,
    });

    res.send(translatedString);
  }),
);

translation.get(
  '/:language',
  asyncHandler(async (req, res) => {
    // Everyone can access translations
    req.flagPermissionChecked();

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
