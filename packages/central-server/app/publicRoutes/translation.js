import asyncHandler from 'express-async-handler';
import { keyBy, mapValues } from 'es-toolkit/compat';

/**
 * Translation handlers shared by the public routes and the patient portal API.
 * Both are unauthenticated: translations are needed to render the login screens.
 */

export const getLanguageOptions = asyncHandler(async (req, res) => {
  const { TranslatedString } = req.models;
  const response = await TranslatedString.getPossibleLanguages();
  res.send(response);
});

export const getTranslations = asyncHandler(async (req, res) => {
  const {
    models: { TranslatedString },
    params: { language },
  } = req;

  const translatedStringRecords = await TranslatedString.findAll({
    where: { language },
    attributes: ['stringId', 'text'],
  });

  res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
});
