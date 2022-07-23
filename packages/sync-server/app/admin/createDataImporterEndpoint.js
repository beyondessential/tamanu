import asyncHandler from 'express-async-handler';
import config from 'config';
import { promises as fs } from 'fs';

import { getUploadedData } from 'shared/utils/getUploadedData';

export function createDataImporterEndpoint(importer) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();
    const { store } = req;

    // read uploaded data
    const {
      file,
      deleteFileAfterImport = true,
      dryRun = false,
      allowErrors = false,
      whitelist = [],
    } = await getUploadedData(req);

    const result = await importer(store.models, file, { allowErrors, dryRun, whitelist });

    // we don't need the file any more
    if (deleteFileAfterImport) {
      await fs.unlink(file).catch(_ => {});
    }

    res.send({
      ...result,
      duration: (Date.now() - start) / 1000.0,
      serverInfo: {
        host: config.sync.host,
      },
    });
  });
}
