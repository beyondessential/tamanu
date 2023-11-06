import express from 'express';
import asyncHandler from 'express-async-handler';
import { mapValues, keyBy } from 'lodash';
import { getLanguageOptions } from '@tamanu/shared/utils/translation/getLanguageOptions';

const ENGLISH_LANGUAGE_CODE = 'en';

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
  '/preLogin',
  asyncHandler(async (req, res) => {
    // No permission needed when on login screen
    req.flagPermissionChecked();

    const response = await getLanguageOptions(req.models, req.headers['if-none-match']);
    if (response === 304) {
      res.status(304).end();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', response.eTag);
    res.send(response.languageOptions);
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

    const eTag = await TranslatedString.etagForLanguage(language);

    if (req.headers['if-none-match'] === eTag) {
      res.status(304).end();
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
