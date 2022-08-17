import config from 'config';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { Sequelize } from 'sequelize';

import { getUploadedData } from 'shared/utils/getUploadedData';

import { DryRun } from './errors';
import { coalesceStats } from './stats';

async function importerTransaction({ importer, models, file, dryRun = false, whitelist = [] }) {
  const errors = [];
  const stats = [];

  try {
    log.debug('Starting transaction');
    await models.ReferenceData.sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async () => {
        try {
          await importer({ errors, models, stats, file, whitelist });
        } catch (err) {
          errors.push(err);
        }

        if (errors.length > 0) throw new Error('rollback on errors');
        if (dryRun) throw new DryRun(); // roll back the transaction
      },
    );
    log.debug('Ended transaction');

    if (dryRun) {
      throw new Error('Data import completed but it was a dry run!!!');
    } else {
      return { errors: [], stats: coalesceStats(stats) };
    }
  } catch (err) {
    log.error(`while importing refdata: ${err.stack}`);
    if (dryRun && err instanceof DryRun) {
      return {
        didntSendReason: 'dryRun',
        errors: [],
        stats: coalesceStats(stats),
      };
    }
    if (errors.length) {
      return {
        didntSendReason: 'validationFailed',
        errors,
        stats: coalesceStats(stats),
      };
    }
    return {
      didntSendReason: 'validationFailed',
      errors: [err],
      stats: coalesceStats(stats),
    };
  }
}

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

    const result = await importerTransaction({
      importer,
      file,
      models: store.models,
      dryRun,
      whitelist,
    });

    // we don't need the file any more
    if (deleteFileAfterImport) {
      // eslint-disable-next-line no-unused-vars
      await fs.unlink(file).catch(ignore => {});
    }

    res.send({
      ...result,
      duration: (Date.now() - start) / 1000.0,
      serverInfo: {
        host: config.canonicalHostName,
      },
    });
  });
}
