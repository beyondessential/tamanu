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
