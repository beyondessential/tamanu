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
function getImportedFileName(userId) {
  return `imported-${userId}.xlsx`;
}

async function getDataFromFileSystem(req) {
  const { ...otherProps } = req.body;
  const fileName = getImportedFileName(req.user.id);
  if (!fileName) throw Error('File name is required');

  const file = fileName;
  return { ...otherProps, deleteFileAfterImport: true, file };
}

export function createDataImporterEndpoint(importer, importingUsingChunks = false) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();

    // read uploaded data
    const {
      file,
      deleteFileAfterImport = true,
      dryRun = false,
      includedDataTypes,
    } = importingUsingChunks ? await getDataFromFileSystem(req) : await getUploadedData(req);

    const { store } = req;
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

export function createChunkedUploadEndpoint() {
  return asyncHandler(async (req, res) => {
    const contentRange = req.headers['content-range'];
    const userId = req.user.id;
    // Parse the range information from the Content-Range header
    const [, start, end, fileSize] = contentRange.match(/bytes=(\d+)-(\d+)\/(\d+)/);
    if (!req.app.locals.fileData) {
      req.app.locals.fileData = {};
    }

    if (parseInt(start, 10) === 0) {
      // Reset upload
      req.app.locals.fileData[req.user.id] = null;
    }
    // Extract the uploaded chunk data from the request body
    const chunkData = req.body;
    if (!req.app.locals.fileData[userId]) {
      req.app.locals.fileData[userId] = Buffer.from(chunkData, 'binary');
    } else {
      req.app.locals.fileData[userId] = Buffer.concat([req.app.locals.fileData[userId], chunkData]);
    }
    if (end !== fileSize) {
      // Chunk received successfully, send a partial content response
      res.status(206).send({});
      return;
    }

    const fileName = getImportedFileName(userId);
    await fs.writeFile(fileName, req.app.locals.fileData[userId], { encoding: 'binary' });

    // File is fully uploaded
    res.status(200).send({ message: 'File was created succesfully' });
  });
}
