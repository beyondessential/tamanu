import fs from 'fs';
import { InvalidParameterError } from '@tamanu/errors';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';

// spec: ATCH
// Uploading a file admits its bytes to this server's outbox and creates the
// attachment record together, so creation completes without central
// connectivity and an admitted blob always has its referencing record. The
// background pusher delivers the bytes once the record has synchronised.
// req: express request, maxFileSize: integer (size in bytes)
// scope: { patientId } or { encounterId } of the record the file is being
// attached to, carried so the attachment synchronises within that record's scope
export const uploadAttachment = async (req, maxFileSize, scope = {}) => {
  // TODO: Figure out permission management for writing
  // an Attachment
  // req.checkPermission('write', 'Attachment'); ??

  const { models, blobCache } = req;
  const { file, deleteFileAfterImport, type, ...metadata } = await getUploadedData(req);
  const { size } = fs.statSync(file);

  try {
    if (maxFileSize && size > maxFileSize) {
      throw new InvalidParameterError(`Uploaded file exceeds limit of ${maxFileSize} bytes.`);
    }

    const { hash, size: storedSize } = await blobCache.putOutbox(fs.createReadStream(file), {
      sizeHint: size,
    });
    const attachment = await models.Attachment.create({
      type,
      hash,
      size: storedSize,
      ...scope,
    });

    return {
      attachmentId: attachment.id,
      type,
      metadata,
    };
  } finally {
    // Parsed file needs to be deleted from memory
    if (deleteFileAfterImport) fs.unlink(file, () => null);
  }
};
