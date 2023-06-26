import config from 'config';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { singularize } from 'inflection';
import { camelCase, lowerCase } from 'lodash';
import { Sequelize } from 'sequelize';

import { getUploadedData } from 'shared/utils/getUploadedData';
import { log } from 'shared/services/logging/log';
import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';

import { DryRun, DataImportError } from './errors';
import { coalesceStats } from './stats';

export function normaliseSheetName(name) {
  const norm = camelCase(
    lowerCase(name)
      .split(/\s+/)
      .map(word => singularize(word))
      .join(' '),
  );

  if (norm === 'vaccineSchedule') return 'scheduledVaccine';
  if (norm === 'procedure') return 'procedureType';

  // This is needed to handle the way we are exporting that data
  if (norm === 'patientFieldDefCategory') return 'patientFieldDefinitionCategory';

  return norm;
}

/** @internal exported for testing only */
export async function importerTransaction({
  importer,
  models,
  file,
  dryRun = false,
  includedDataTypes = [],
}) {
  const errors = [];
  const stats = [];

  try {
    log.debug('Starting transaction');
    await models.ReferenceData.sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async transaction => {
        // acquire a lock on the sync time row in the local system facts table, so that all imported
        // changes have the same updated_at_sync_tick, and no sync pull snapshot can start while this
        // import is still in progress
        // the pull snapshot starts by updating the current time, so this locks that out while the
        // import transaction happens, to avoid the snapshot missing records that get saved during
        // this import, but aren't visible in the db to be snapshot until the transaction commits,
        // so would otherwise be completely skipped over by that sync client
        await models.LocalSystemFact.findAll({
          where: { key: CURRENT_SYNC_TIME_KEY },
          lock: transaction.LOCK.UPDATE,
        });

        try {
          await importer({ errors, models, stats, file, includedDataTypes });
        } catch (err) {
          errors.push(err);
        }

        if (errors.length > 0) throw new Error('rollback on errors');
        if (dryRun) throw new DryRun(); // roll back the transaction
      },
    );
    log.debug('Ended transaction');

    return { errors: [], stats: coalesceStats(stats) };
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
      includedDataTypes,
    } = await getUploadedData(req);

    const result = await importerTransaction({
      importer,
      file,
      models: store.models,
      dryRun,
      includedDataTypes,
    });

    // we don't need the file any more
    if (deleteFileAfterImport) {
      // eslint-disable-next-line no-unused-vars
      await fs.unlink(file).catch(ignore => {});
    }

    result.errors =
      result.errors?.map(err =>
        (err instanceof Error || typeof err === 'string') && !(err instanceof DataImportError)
          ? new DataImportError('(general)', -3, err)
          : err,
      ) ?? [];

    res.send({
      ...result,
      duration: (Date.now() - start) / 1000.0,
      serverInfo: {
        host: config.canonicalHostName,
      },
    });
  });
}
