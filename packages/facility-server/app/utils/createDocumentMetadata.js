import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

/**
 * Record an uploaded document.
 *
 * Two uploads that reach here are two distinct submissions, so each becomes its own document —
 * deliberately re-adding the same file creates a second document. A repeat of a single submission
 * is handled before it reaches here: a double-clicked Add button is caught in the form, and a
 * dropped-connection retry carrying the same `Idempotency-Key` is replayed by the request
 * idempotency middleware rather than running the handler again.
 *
 * `owner` is the column identifying what the document hangs off, either `{ encounterId }` or
 * `{ patientId }`.
 */
export const createDocumentMetadata = async (req, owner, { attachmentId, type, metadata }) =>
  req.models.DocumentMetadata.create({
    ...metadata,
    ...owner,
    attachmentId,
    type,
    documentUploadedAt: getCurrentDateTimeString(),
    source: DOCUMENT_SOURCES.UPLOADED,
  });
