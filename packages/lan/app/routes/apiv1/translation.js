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

    const languagesInDb = await TranslatedString.findAll({
      attributes: ['language'],
      group: 'language',
    });

    const languageNames = await TranslatedString.findAll({
      where: {
        stringId: 'languageName',
      },
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
    res.setHeader('Cache-Control', 'public, max-age=2628288');

    console.log('hello')

    const {
      models: { TranslatedString },
      params: { language },
    } = req;

    const eTagData = await req.db.query(
      `SELECT uuid_generate_v5(uuid_nil(), string_agg(id, ':') || string_agg(updated_at::text, ':')) AS hash FROM translated_strings WHERE language = '${language}'`,
    );

    const eTag = eTagData[0].hash;

    if (req.headers['if-none-match'] === eTag) {
      res.status(304).send();
      return;
    }

    res.setHeader('ETag', eTag);

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
  }),
);
