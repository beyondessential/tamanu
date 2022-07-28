import asyncHandler from 'express-async-handler';
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
      whitelist = [],
    } = await getUploadedData(req);

    const result = await importer({ file, models: store.models, dryRun, whitelist });

    // we don't need the file any more
    if (deleteFileAfterImport) {
      // eslint-disable-next-line no-unused-vars
      await fs.unlink(file).catch(ignore => {});
    }

    res.send({
      ...result,
      duration: (Date.now() - start) / 1000.0,
      serverInfo: {
        host: 'Central Server',
      },
    });
  });
}
