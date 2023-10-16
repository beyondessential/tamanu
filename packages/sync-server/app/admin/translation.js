import express from 'express';
import asyncHandler from 'express-async-handler';
import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';

export const translationRouter = express.Router();

translationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: { sequelize },
    } = req;
    res.send(await queryTranslatedStringsByLanguage(sequelize));
  }),
);

translationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const {
      models: { TranslatedString },
    } = store;
  }),
);
