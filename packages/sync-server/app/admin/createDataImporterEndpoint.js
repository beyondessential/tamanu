import asyncHandler from 'express-async-handler';
import config from 'config';
import { unlink } from 'fs';
import { Sequelize } from 'sequelize';

import { getUploadedData } from 'shared/utils/getUploadedData';

class DryRun extends Error {
  constructor() {
    super('Dry run: rollback');
  }
}

export function createDataImporterEndpoint(importer) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();
    const { store } = req;

    // read uploaded data
    const {
      file,
      deleteFileAfterImport,
      dryRun = false,
      showRecords = false,
      allowErrors = false,
      ...options
    } = await getUploadedData(req);
    
    const result = await Sequelize.transaction({
      // strongest level to be sure to read/write good data
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVEL.SERIALIZABLE,
    }, async () => {
      await importer(store.models, file, options);
      if (dryRun) throw new DryRun;
    }).then(resolved => ({ resolved }), rejected => ({ rejected }));

    // we don't need the file any more
    if (deleteFileAfterImport) {
      unlink(file, () => null);
    }
    
    const duration = (Date.now() - start) / 1000.0;
    const serverInfo = {
      host: config.sync.host,
    };

    if (result.resolved) {
      if (dryRun) {
        throw new Error('Data import completed but it was a dry run!!!');
      } else {
        res.send({
          duration,
          sentData: result.resolved,
          serverInfo,
        });
      }
    } else if (result.rejected) {
      if (dryRun && result.rejected instanceof DryRun) {
        res.send({
          didntSendReason: 'dryRun',
          duration,
          sentData: false,
          serverInfo,
        });
      } else {
        res.send({
          didntSendReason: 'validationFailed',
          duration,
          errorDetail: result.rejected?.stack ?? result.rejected,
          sentData: false,
          serverInfo,
        });
      }
    } else {
      throw new Error('Bad promise state');
    }
  });
}
