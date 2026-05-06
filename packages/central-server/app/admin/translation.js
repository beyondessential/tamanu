import express from 'express';
import asyncHandler from 'express-async-handler';
import { isEmpty } from 'lodash';
import { Op } from 'sequelize';
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

    // Flatten the FE shape (grouped by stringId, keyed by language) into
    // discrete entries, skipping the default language since it isn't stored.
    const entries = Object.entries(body).flatMap(([stringId, languages]) =>
      Object.entries(languages)
        .filter(([language]) => language !== DEFAULT_LANGUAGE_CODE)
        .map(([language, text]) => ({ stringId, language, text })),
    );

    if (entries.length === 0) {
      res.send({ ok: 'ok' });
      return;
    }

    const keyOf = (stringId, language) => `${stringId}\x00${language}`;

    const newlyCreated = await sequelize.transaction(async () => {
      // Bulk-fetch all candidate rows in a single SELECT inside the transaction
      // (including soft-deleted ones, so we can restore rather than recreate)
      // instead of doing a findOne per entry — typical saves submit hundreds of
      // unchanged rows. Op.or matches only the exact (stringId, language) pairs
      // rather than the full Cartesian product of unique stringIds × languages.
      const existingRows = await TranslatedString.findAll({
        where: { [Op.or]: entries.map(({ stringId, language }) => ({ stringId, language })) },
        paranoid: false,
      });
      const existingByKey = new Map(
        existingRows.map(row => [keyOf(row.stringId, row.language), row]),
      );

      const created = [];
      for (const { stringId, language, text } of entries) {
        const existing = existingByKey.get(keyOf(stringId, language));
        const noText = isEmpty(text);

        if (!existing) {
          if (noText) continue;
          const row = await TranslatedString.create({ stringId, language, text });
          created.push(row.get({ plain: true }));
          continue;
        }

        if (noText) {
          if (!existing.deletedAt) await existing.destroy();
          continue;
        }

        const wasDeleted = !!existing.deletedAt;
        if (wasDeleted) await existing.restore();
        if (existing.text !== text) await existing.update({ text });
        // Restoring a soft-deleted row counts as a creation for the response,
        // matching the previous (one-findOne-per-entry) behaviour.
        if (wasDeleted) created.push(existing.get({ plain: true }));
      }
      return created;
    });

    if (newlyCreated.length) {
      res.status(201).send({ data: newlyCreated });
      return;
    }

    res.send({ ok: 'ok' });
  }),
);
