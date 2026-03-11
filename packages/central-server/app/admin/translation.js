import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { isEmpty } from 'lodash';
import { queryTranslatedStringsByLanguage } from '@tamanu/shared/utils/translation/queryTranslatedStringsByLanguage';
import { LANGUAGE_NAME_STRING_ID, DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';

export const translationRouter = express.Router();

// Bump default json limit as some deployments have a large number of translations
translationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    req.flagPermissionChecked();
    const languageNames = await store.models.TranslatedString.findAll({
      attributes: ['language', 'text'],
      where: { stringId: LANGUAGE_NAME_STRING_ID },
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
    req.checkPermission('write', 'Translation');

    const entries = [];
    for (const [stringId, languages] of Object.entries(body)) {
      for (const [language, text] of Object.entries(languages)) {
        if (language === DEFAULT_LANGUAGE_CODE) continue;
        entries.push({ stringId, language, text });
      }
    }

    if (entries.length === 0) {
      res.send({ ok: 'ok' });
      return;
    }

    const { created } = await sequelize.transaction(async () => {
      const toCreate = [];
      const toUpdate = [];
      const toDestroy = [];
      const pairs = entries.map(({ stringId, language }) => ({ stringId, language }));
      const existing = await TranslatedString.findAll({
        where: { [Op.or]: pairs },
        paranoid: false,
      });
      const existingMap = new Map(existing.map(r => [`${r.stringId};${r.language}`, r]));

      for (const { stringId, language, text } of entries) {
        const key = `${stringId};${language}`;
        const record = existingMap.get(key);

        if (isEmpty(text)) {
          if (record) toDestroy.push({ stringId, language });
          continue;
        }
        if (record && !record.deletedAt) {
          if (record.text === text) continue;
          toUpdate.push({ stringId, language, text, deletedAt: null });
        } else {
          toCreate.push({ stringId, language, text, deletedAt: null });
        }
      }

      const toBulkCreate = [...toCreate, ...toUpdate];
      if (toBulkCreate.length > 0) {
        await TranslatedString.bulkCreate(toBulkCreate, {
          validate: true,
          updateOnDuplicate: ['text', 'deletedAt'],
        });
      }
      if (toDestroy.length > 0) {
        await TranslatedString.destroy({
          where: { [Op.or]: toDestroy },
        });
      }

      return { created: toCreate };
    });

    if (created.length > 0) {
      res.status(201).send({ data: created });
      return;
    }
    res.send({ ok: 'ok' });
  }),
);
