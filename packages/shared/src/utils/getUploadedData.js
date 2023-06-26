import multiparty from 'multiparty';

import { tmpdir } from './tmpdir';

async function getMultipartData(req) {
  const form = new multiparty.Form({ autoFiles: true, uploadDir: await tmpdir() });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        const { jsonData, ...otherFields } = fields;

        try {
          const parsedData = jsonData ? JSON.parse(jsonData) : {};

          const fileInfo = files.file
            ? { file: files.file[0].path, deleteFileAfterImport: true }
            : {};

          resolve({
            ...parsedData,
            ...otherFields,
            ...fileInfo,
          });
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

export async function getUploadedData(req) {
  const contentType = (req.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  switch (contentType) {
    case 'multipart/form-data':
      return getMultipartData(req);
    case 'application/json':
      return { ...req.body };
    default:
      throw new Error(`Couldn't understand content type ${contentType}`);
  }
}
