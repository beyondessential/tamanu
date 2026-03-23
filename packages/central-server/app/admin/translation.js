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
      res.status(200).send({ createdCount: 0, updatedCount: 0, deletedCount: 0 });
      return;
    }

    const { createdCount, updatedCount, deletedCount } = await sequelize.transaction(async () => {
      const pairs = entries.map(({ stringId, language }) => ({ stringId, language }));
      const existing = await TranslatedString.findAll({
        where: { [Op.or]: pairs },
        paranoid: false, // Find soft deleted translations so that we can restore them instead of creating a new one
      });
      const existingMap = new Map(existing.map(r => [`${r.stringId};${r.language}`, r]));

      const toCreate = [];
      const toUpdate = [];
      const toDestroy = [];
      for (const { stringId, language, text } of entries) {
        const key = `${stringId};${language}`;
        const record = existingMap.get(key);
        if (isEmpty(text)) {
          if (record && !record.deletedAt) toDestroy.push({ stringId, language });
          continue;
        }
        if (!record) {
          toCreate.push({ stringId, language, text });
          continue;
        }
        if (record.deletedAt || record.text !== text) {
          toUpdate.push({ stringId, language, text, deletedAt: null });
        }
      }

      const toUpsert = [...toCreate, ...toUpdate];
      if (toUpsert.length > 0) {
        await TranslatedString.bulkCreate(toUpsert, {
          validate: true,
          updateOnDuplicate: ['text', 'deletedAt'],
        });
      }
      if (toDestroy.length > 0) {
        await TranslatedString.destroy({
          where: { [Op.or]: toDestroy },
        });
      }

      return {
        createdCount: toCreate.length,
        updatedCount: toUpdate.length,
        deletedCount: toDestroy.length,
      };
    });

    res.status(200).send({ createdCount, updatedCount, deletedCount });
  }),
);
