import express from 'express';
import asyncHandler from 'express-async-handler';
import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { isString } from 'lodash';

export const translationRouter = express.Router();

translationRouter.use(ensurePermissionCheck);

translationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: { sequelize },
    } = req;
    req.flagPermissionChecked();
    res.send(await queryTranslatedStringsByLanguage(sequelize));
  }),
);

translationRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    req.checkPermission('translation', 'write');
    const {
      models: { TranslatedString },
    } = store;
    await store.sequelize.transaction(async () => {
      // Convert FE representation of translation data (grouped by stringId with keys for each languages text) to upsertable entries.
      await Promise.all(
        Object.entries(body).flatMap(([stringId, languages]) =>
          Object.entries(languages).map(
            ([code, text]) =>
              isString(text) &&
              TranslatedString.upsert(
                {
                  stringId,
                  language: code,
                  text,
                },
                {
                  conflictFields: ['string_id', 'language'],
                },
              ),
          ),
        ),
      );
    });
    res.send({ ok: 'ok' });
  }),
);
