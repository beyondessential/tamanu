import express from 'express';
import asyncHandler from 'express-async-handler';
import { LANGUAGE_NAMES, LANGUAGE_CODES } from '@tamanu/constants';

export const translation = express.Router();

// Register a new string for translation
translation.post(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
      body: { stringId, fallback },
    } = req;

    const translatedString = await TranslatedString.create({
      stringId,
      text: fallback,
      language: LANGUAGE_CODES.ENGLISH,
    });

    res.send(translatedString);
  }),
);

translation.get(
  '/preLogin',
  asyncHandler(async (req, res) => {
    // No permission needed when on login screen
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
    } = req;

    const translatedStringRecords = await TranslatedString.findAll({
      attributes: ['language'],
      distinct: true,
    });

    const languageOptions = translatedStringRecords
      .map(obj => obj.language)
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      })
      .map(languageCode => ({
        label: LANGUAGE_NAMES[languageCode],
        value: languageCode,
      }));

    res.send(languageOptions);
  }),
);

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
