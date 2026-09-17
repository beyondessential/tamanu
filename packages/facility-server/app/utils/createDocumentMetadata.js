import { Op } from 'sequelize';
import { subSeconds } from 'date-fns';

import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';

// Repeat submissions of one upload — a double-clicked Add button, or a client that
// retried — arrive as separate requests carrying identical metadata. A submission
// matching one already recorded within this window is treated as that same document
// rather than a new one. The window is short enough that deliberately adding the same
// file again still creates a second document.
const DUPLICATE_WINDOW_SECONDS = 10;

// A document is the same submission as another when it belongs to the same owner, was
// given the same name, and was created at the same time (taken from the file itself, so
// it is stable across repeat submissions of that file).
const buildDuplicateFilter = (owner, { name, documentCreatedAt }) => ({
  ...owner,
  name,
  // documentCreatedAt is optional, and an undefined value isn't a valid filter — a
  // document without one matches other documents that equally lack one.
  documentCreatedAt: documentCreatedAt ?? null,
  source: DOCUMENT_SOURCES.UPLOADED,
  documentUploadedAt: {
    [Op.gte]: toDateTimeString(subSeconds(new Date(), DUPLICATE_WINDOW_SECONDS)),
  },
});

/**
 * Record an uploaded document, returning the existing record instead of creating a
 * second one when this submission repeats one already made.
 *
 * `owner` is the column identifying what the document hangs off, either
 * `{ encounterId }` or `{ patientId }`.
 */
export const createDocumentMetadata = async (req, owner, { attachmentId, type, metadata }) => {
  const { db, models } = req;

  return db.transaction(async () => {
    // Simultaneous submissions would both read before either wrote, so both would find
    // no duplicate and both insert. Serialise them on the document's identity: the
    // second waits here until the first commits, then sees the row it created.
    await db.query('SELECT pg_advisory_xact_lock(hashtext(:documentKey))', {
      replacements: {
        documentKey: JSON.stringify([owner, metadata.name, metadata.documentCreatedAt ?? null]),
      },
    });

    const existingDocument = await models.DocumentMetadata.findOne({
      where: buildDuplicateFilter(owner, metadata),
    });
    if (existingDocument) return existingDocument;

    return models.DocumentMetadata.create({
      ...metadata,
      ...owner,
      attachmentId,
      type,
      documentUploadedAt: getCurrentDateTimeString(),
      source: DOCUMENT_SOURCES.UPLOADED,
    });
  });
};
