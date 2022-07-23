import asyncHandler from 'express-async-handler';
import config from 'config';
import { promises as fs } from 'fs';

import { getUploadedData } from 'shared/utils/getUploadedData';

export function createDataImporterEndpoint(importer, permissions = []) {
  return asyncHandler(async (req, res) => {
    for (const perm of permissions) {
      req.checkPermission('write', perm);
    }

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

    const result = await importer({ file, models: store.models, allowErrors, dryRun, whitelist });

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
