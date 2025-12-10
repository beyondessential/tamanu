import config from 'config';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { singularize } from 'inflection';
import { camelCase, lowerCase } from 'lodash';
import { Sequelize } from 'sequelize';

import { OTHER_REFERENCE_TYPES, PROGRAM_REFERENCE_TYPES } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { log } from '@tamanu/shared/services/logging/log';

import { DataImportError, DryRun } from '../errors';
import { coalesceStats } from '../stats';

const normMapping = {
  // singularize transforms 'reference data' to 'reference datum', which is not what we want
  referenceDatumRelation: 'referenceDataRelation',
  vaccineSchedule: OTHER_REFERENCE_TYPES.SCHEDULED_VACCINE,
  procedure: 'procedureType',
  // This is needed to handle the way we are exporting that data
  patientFieldDefCategory: OTHER_REFERENCE_TYPES.PATIENT_FIELD_DEFINITION_CATEGORY,
  invoiceInsuranceItem: OTHER_REFERENCE_TYPES.INVOICE_INSURANCE_PLAN_ITEM,
  // We need mapping for program registry imports because program registry data is imported in the
  // worksheet sheets called registry and registryCondition but the full model names
  // are ProgramRegistry and ProgramRegistryCondition which are used everywhere else.
  // ProgramRegistryClinicalStatus is imported in the registry sheet so it doesn't need a mapping here
  registry: PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY,
  registryCondition: PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CONDITION,
  registryConditionCategories: PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CONDITION_CATEGORY,
};

export function normaliseSheetName(name, modelName) {
  const norm = camelCase(
    lowerCase(name)
      .split(/\s+/)
      .map(word => singularize(word))
      .join(' '),
  );

  // Exceptions where the sheet name for the program/survey/etc is not consistent with the model name
  if (modelName === 'ProgramRegistryClinicalStatus') {
    return PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CLINICAL_STATUS;
  }
  if (modelName === 'ProgramDataElement') {
    return PROGRAM_REFERENCE_TYPES.PROGRAM_DATA_ELEMENT;
  }
  if (modelName === 'SurveyScreenComponent') {
    return PROGRAM_REFERENCE_TYPES.SURVEY_SCREEN_COMPONENT;
  }
  if (modelName === 'Program') {
    return PROGRAM_REFERENCE_TYPES.PROGRAM;
  }
  if (modelName === 'Survey') {
    return PROGRAM_REFERENCE_TYPES.SURVEY;
  }

  return normMapping[norm] || norm;
}

/** @internal exported for testing only */
export async function importerTransaction({
  importer,
  models,
  file,
  dryRun = false,
  includedDataTypes = [],
  checkPermission,
  ...extraOptions
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
          where: { key: FACT_CURRENT_SYNC_TICK },
          lock: transaction.LOCK.UPDATE,
        });

        try {
          await importer({
            errors,
            models,
            stats,
            file,
            includedDataTypes,
            checkPermission,
            ...extraOptions,
          });
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
    const { store, checkPermission } = req;

    // read uploaded data
    const {
      file,
      deleteFileAfterImport = true,
      dryRun = false,
      includedDataTypes,
      ...extraOptions
    } = await getUploadedData(req);

    const result = await importerTransaction({
      importer,
      file,
      models: store.models,
      dryRun,
      includedDataTypes,
      checkPermission,
      ...extraOptions,
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
