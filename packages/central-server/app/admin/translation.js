import express from 'express';
import asyncHandler from 'express-async-handler';
import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { isNull } from 'lodash';
import { NOT_MODIFIED_STATUS_CODE } from '@tamanu/constants';
import { getLanguageOptions } from '@tamanu/shared/utils/translation/getLanguageOptions';

export const translationRouter = express.Router();

translationRouter.use(ensurePermissionCheck);

translationRouter.get('/preLogin', async (req, res) => {
  req.flagPermissionChecked();
  const response = await getLanguageOptions(req.models, req.headers['if-none-match']);
  if (response === NOT_MODIFIED_STATUS_CODE) {
    res.status(NOT_MODIFIED_STATUS_CODE).end();
    return;
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', response.eTag);
  res.send(response.languageOptions);
});

translationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    req.flagPermissionChecked();
    const languageNames = await store.models.TranslatedString.findAll({
      attributes: ['language', 'text'],
      where: { stringId: 'languageName' },
    });
    const translations = await queryTranslatedStringsByLanguage(store);
    res.send({
      translations,
      languageNames: (languageNames || []).reduce(
        (acc, { language, text }) => ({ ...acc, [language]: text }),
        {},
      ),
    });
  }),
);

translationRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const {
      models: { TranslatedString },
      sequelize,
    } = store;
    req.checkPermission('translation', 'write');
    const upsertTranslation = async ({ stringId, language, text }) => {
      // Postgres doesn't return any information about whether an upserted row was created or updated
      // so we have to check for an existing row first and match the return style of upsert i.e [record, isCreate].
      const existing = await TranslatedString.findOne({
        where: {
          stringId,
          language,
        },
      });
      if (isNull(text) || existing?.text === text) return [];
      if (existing) return [await existing.update({ text }), false];
      return [await TranslatedString.create({ stringId, language, text }), true];
    };
    await sequelize.transaction(async () => {
      // Convert FE representation of translation data (grouped by stringId with keys for each languages text)
      // to upsertable entries.
      const results = await Promise.all(
        Object.entries(body).flatMap(([stringId, languages]) =>
          Object.entries(languages).map(([language, text]) =>
            upsertTranslation({ stringId, language, text }),
          ),
        ),
      );

      const newlyCreated = results
        .filter(result => result[1])
        .map(result => result[0].get({ plain: true }));

      if (newlyCreated.length) {
        res.status(201).send({ data: newlyCreated });
        return;
      }
      res.send({ ok: 'ok' });
    });
  }),
);
