import fs, { promises as asyncFs } from 'fs';
import { RemoteCallError } from '@tamanu/errors';
import { assertUploadedFilePath, getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { log } from '@tamanu/shared/services/logging';
import { CentralServerConnection } from '../sync';

// Helper function for uploading one file to the central server
// req: express request, maxFileSize: integer (size in bytes)
export const uploadAttachment = async (req, maxFileSize) => {
  // TODO: Figure out permission management for writing
  // an Attachment
  // req.checkPermission('write', 'Attachment'); ??

  // Read request and extract file, stats and metadata
  const { deviceId } = req;
  const { file, type, ...metadata } = await getUploadedData(req, { maxFileSize });
  assertUploadedFilePath(file);
  const { size } = fs.statSync(file);
  const fileData = await asyncFs.readFile(file, { encoding: 'base64' });

  // Parsed file needs to be deleted from memory. Awaited so the delete can't land
  // after this request has returned; a failed delete shouldn't fail the upload.
  await asyncFs.unlink(file).catch(error => {
    log.warn('uploadAttachment: failed to delete uploaded file', { error: error.message });
  });

  // Upload file to central server
  // CentralServerConnection takes care of adding headers and convert body to JSON
  const centralServer = new CentralServerConnection({ deviceId });
  const syncResponse = await centralServer.fetch('attachment', {
    method: 'POST',
    body: {
      type,
      size,
      data: fileData,
    },
    backoff: { maxAttempts: 1 },
  });

  if (syncResponse.error) {
    throw new RemoteCallError(syncResponse.error.message);
  }

  // Send parsed metadata along with the new created attachment id
  return {
    attachmentId: syncResponse.attachmentId,
    type,
    metadata,
  };
};
