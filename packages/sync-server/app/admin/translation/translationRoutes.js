import express from 'express';
import asyncHandler from 'express-async-handler';

export const translationRouter = express.Router();

translationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Translation');
    const { store } = req;
    const {
      models: { TranslatedString },
    } = store;

    const translatedStrings = await TranslatedString.findAll({
      order: [['stringId', 'ASC']],
    });

    res.send(translatedStrings);
  }),
);
