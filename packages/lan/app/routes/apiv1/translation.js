import express from 'express';
import asyncHandler from 'express-async-handler';
import { mapValues, keyBy } from 'lodash';

import { LANGUAGE_NAMES } from '@tamanu/constants';

export const translation = express.Router();

translation.get(
  '/preLogin',
  asyncHandler(async (req, res) => {
    // No permission needed when on login screen
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
    } = req;

    const queryResponse = await TranslatedString.findAll({
      attributes: ['language'],
      group: 'language',
    });

    const languageOptions = queryResponse.map(({ language }) => {
      return {
        label: LANGUAGE_NAMES[language],
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

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
  }),
);
