import express from 'express';
import asyncHandler from 'express-async-handler';
import { mapValues, keyBy } from 'lodash';

export const translation = express.Router();

translation.get(
  '/preLogin',
  asyncHandler(async (req, res) => {
    // No permission needed when on login screen
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
    } = req;

    const eTag = await TranslatedString.etagForLanguageOptions();

    if (req.headers['if-none-match'] === eTag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', eTag);

    const languagesInDb = await TranslatedString.findAll({
      attributes: ['language'],
      group: 'language',
    });

    const languageNames = await TranslatedString.findAll({
      where: { stringId: 'languageName' },
    });

    const languageDisplayNames = mapValues(keyBy(languageNames, 'language'), 'text');
    const languageOptions = languagesInDb.map(({ language }) => {
      return {
        label: languageDisplayNames[language],
        value: language,
      };
    });

    res.send(languageOptions);
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
