import { Op } from 'sequelize';
import config from 'config';
import { chunk, omit, omitBy } from 'lodash';
import { PORTAL_USER_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';
import { InvalidParameterError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { refreshChildRecordsForSync } from '@tamanu/shared/utils/refreshChildRecordsForSync';

const BULK_CREATE_BATCH_SIZE = 100;

// These ones just need a patientId switched over.
// Models included here will just have their patientId field
// redirected to the new patient and that's all.

// IMPORTANT: Any models here that have child records, please add the logic to handle them
// in:
// - updateDependentRecordsForResync function in this file AND PatientMergeMaintainer.js.
export const simpleUpdateModels = [
  'Encounter',
  'PatientAllergy',
  'PatientFamilyHistory',
  'PatientCondition',
  'PatientIssue',
  'PatientVRSData',
  'PatientSecondaryId',
  'PatientCarePlan',
  'PatientCommunication',
  'Appointment',
  'DocumentMetadata',
  'CertificateNotification',
  'DeathRevertLog',
  'UserRecentlyViewedPatient',
  'PatientOngoingPrescription',
  'PatientContact',
  'IPSRequest',
  'Notification',
  'PortalSurveyAssignment',
];

// These ones need a little more attention.
// Models in this array will be ignored by the automatic pass
// so that they can be handled elsewhere.

// IMPORTANT: Any models here that have child records, please add the logic to handle them
// in:
// - updateDependentRecordsForResync function in this file AND PatientMergeMaintainer.js.
export const specificUpdateModels = [
  'Patient',
  'PatientAdditionalData',
  'PatientProgramRegistration',
  'PatientBirthData',
  'PatientDeathData',
  'Note',
  'PatientFacility',
  'PatientFieldValue',
  'PortalUser',
  'PatientInvoiceInsurancePlan',
];

// These columns should be omitted as we never want
// them to be preserved from the unwanted record.
const omittedColumns = [
  // common
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'patientId',

  // patient
  'mergedIntoId',
  'visibilityStatus',
  'dateOfBirthLegacy',
  'dateOfDeathLegacy',
  'dateOfDeath',

  // pad
  'updatedAtByField',
];

// This is for cases where we never want to update the patient_id
// even after merge
const omittedModels = ['AccessLog'];

function isNullOrEmptyString(value) {
  return value === null || value === '';
}

// Keeps all non-empty values from keepRecord, otherwise grabs values from unwantedRecord
function getMergedFieldsForUpdate(keepRecordValues = {}, unwantedRecordValues = {}) {
  const keepRecordNonEmptyValues = omitBy(keepRecordValues, isNullOrEmptyString);
  const unwantedRecordNonEmptyValues = omitBy(unwantedRecordValues, isNullOrEmptyString);

  return {
    ...omit(unwantedRecordNonEmptyValues, omittedColumns),
    ...omit(keepRecordNonEmptyValues, omittedColumns),
  };
}

const fieldReferencesPatient = field => field.references?.model === 'patients';
const modelReferencesPatient = ([, model]) =>
  Object.values(model.getAttributes()).some(fieldReferencesPatient);

export async function getTablesWithNoMergeCoverage(models) {
  const modelsToUpdate = Object.entries(models).filter(modelReferencesPatient);

  const coveredModels = [...simpleUpdateModels, ...specificUpdateModels, ...omittedModels];
  const missingModels = modelsToUpdate.filter(([name]) => !coveredModels.includes(name));

  return missingModels;
}

async function mergeRecordsForModel(
  model,
  keepPatientId,
  unwantedPatientId,
  patientFieldName = 'patient_id',
  additionalWhere = '',
) {
  // We need to go via a raw query as Model.update({}) performs validation on the
  // whole record, so we'll be rejected for failing to include required fields -
  //  even though we only want to update patientId!
  // Note that this also means that *even if a record has been soft-deleted* its
  // patientId will be shifted over to the "keep" patient. This is desirable! The
  // two patients are the same person, we're not meaningfully *updating* data
  // here, we're correcting it.
  const tableName = model.getTableName();
  const [, result] = await model.sequelize.query(
    `
    UPDATE ${tableName}
    SET
      ${patientFieldName} = :keepPatientId,
      updated_at = current_timestamp(3)
    WHERE
      ${patientFieldName} = :unwantedPatientId
      ${additionalWhere}
  `,
    {
      replacements: {
        unwantedPatientId,
        keepPatientId,
      },
    },
  );

  return result.rowCount;
}

export async function mergePatientAdditionalData(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedPAD = await models.PatientAdditionalData.findOne({
    where: { patientId: unwantedPatientId },
  });
  if (!existingUnwantedPAD) return null;
  const existingKeepPAD = await models.PatientAdditionalData.findOne({
    where: { patientId: keepPatientId },
  });
  const mergedPAD = {
    ...getMergedFieldsForUpdate(existingKeepPAD?.dataValues, existingUnwantedPAD.dataValues),
    patientId: keepPatientId,
  };
  await existingUnwantedPAD.destroy();
  if (existingKeepPAD) {
    return existingKeepPAD.update(mergedPAD);
  }
  return models.PatientAdditionalData.create(mergedPAD);
}

export async function mergePatientBirthData(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedPatientBirthData = await models.PatientBirthData.findOne({
    where: { patientId: unwantedPatientId },
  });
  if (!existingUnwantedPatientBirthData) return null;
  const existingKeepPatientBirthData = await models.PatientBirthData.findOne({
    where: { patientId: keepPatientId },
  });
  const mergedPatientBirthData = {
    ...getMergedFieldsForUpdate(
      existingKeepPatientBirthData?.dataValues,
      existingUnwantedPatientBirthData.dataValues,
    ),
    patientId: keepPatientId,
  };

  await existingUnwantedPatientBirthData.destroy();
  if (existingKeepPatientBirthData) {
    return existingKeepPatientBirthData.update(mergedPatientBirthData);
  }
  return models.PatientBirthData.create(mergedPatientBirthData);
}

export async function mergePatientDeathData(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedDeathDataRows = await models.PatientDeathData.findAll({
    where: { patientId: unwantedPatientId },
  });

  if (!existingUnwantedDeathDataRows.length) {
    return [];
  }

  const results = [];

  for (const unwantedDeathData of existingUnwantedDeathDataRows) {
    switch (unwantedDeathData.visibilityStatus) {
      // If merged patient has CURRENT death data, switch the status to MERGED and append it to the keep patient
      case VISIBILITY_STATUSES.CURRENT: {
        await unwantedDeathData.update({
          patientId: keepPatientId,
          visibilityStatus: VISIBILITY_STATUSES.MERGED,
        });
        results.push(unwantedDeathData);
        break;
      }
      // If merged patient has HISTORICAL death data, append it to the keep patient
      case VISIBILITY_STATUSES.HISTORICAL:
      case VISIBILITY_STATUSES.MERGED:
      default: {
        await unwantedDeathData.update({
          patientId: keepPatientId,
        });
        results.push(unwantedDeathData);
        break;
      }
    }
  }

  return results;
}

export async function mergePatientProgramRegistrations(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedRegistrations = await models.PatientProgramRegistration.findAll({
    where: { patientId: unwantedPatientId },
  });

  if (!existingUnwantedRegistrations.length) {
    return [];
  }

  const existingKeepRegistrations = await models.PatientProgramRegistration.findAll({
    where: { patientId: keepPatientId },
    paranoid: false, // Include soft deleted registrations, as we don't want to create new registrations if they've already been deleted on the keep
  });
  const keepRegistrationMap = new Map(existingKeepRegistrations.map(r => [r.programRegistryId, r]));

  const results = [];

  for (const unwantedRegistration of existingUnwantedRegistrations) {
    // This isn't a duplicate, so we should keep this record
    if (keepRegistrationMap.has(unwantedRegistration.programRegistryId) === false) {
      // Create a new patient program registration and keep all previous metadata, this is
      // needed because patient program registration conditions can be referencing the record
      // so we cannot perform a simple update
      const newRegistration = await models.PatientProgramRegistration.create({
        ...unwantedRegistration.dataValues,
        patientId: keepPatientId,
      });

      // Move conditions to the new patient program registration
      await models.PatientProgramRegistrationCondition.update(
        {
          patientProgramRegistrationId: newRegistration.id,
        },
        {
          where: {
            patientProgramRegistrationId: unwantedRegistration.id,
          },
        },
      );
    }

    // Always destroy the unwanted registration
    await unwantedRegistration.destroy();

    // Include all in results to report modified records
    results.push(unwantedRegistration);
  }

  return results;
}

export async function mergePatientFieldValues(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedFieldValues = await models.PatientFieldValue.findAll({
    where: { patientId: unwantedPatientId },
  });
  if (existingUnwantedFieldValues.length === 0) return [];

  const existingKeepFieldValues = await models.PatientFieldValue.findAll({
    where: { patientId: keepPatientId },
  });

  const records = [];

  // Iterate through all definitions to ensure we're not missing any
  const patientFieldDefinitions = await models.PatientFieldDefinition.findAll();
  for (const definition of patientFieldDefinitions) {
    const keepRecord = existingKeepFieldValues.find(
      ({ definitionId }) => definitionId === definition.id,
    );
    const unwantedRecord = existingUnwantedFieldValues.find(
      ({ definitionId }) => definitionId === definition.id,
    );

    if (keepRecord && isNullOrEmptyString(keepRecord.value) && unwantedRecord?.value) {
      const updated = await keepRecord.update({
        value: unwantedRecord.value,
      });
      records.push(updated);
    } else if (!keepRecord && unwantedRecord?.value) {
      const created = await models.PatientFieldValue.create({
        value: unwantedRecord.value,
        definitionId: definition.id,
        patientId: keepPatientId,
      });
      records.push(created);
    }
  }

  await models.PatientFieldValue.destroy({
    where: { patientId: unwantedPatientId },
  });
  return records;
}

export async function mergePortalUser(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedPortalUser = await models.PortalUser.findOne({
    where: { patientId: unwantedPatientId },
  });
  if (!existingUnwantedPortalUser) return null;

  const existingKeepPortalUser = await models.PortalUser.findOne({
    where: { patientId: keepPatientId },
  });

  // If the keep patient doesn't have a portal account, transfer the unwanted patient's account
  if (!existingKeepPortalUser) {
    return existingUnwantedPortalUser.update({
      patientId: keepPatientId,
    });
  }

  const shouldKeepUnwantedAccount =
    // If keep account is inactive but unwanted account is registered
    (existingKeepPortalUser.status !== PORTAL_USER_STATUSES.REGISTERED &&
      existingUnwantedPortalUser.status === PORTAL_USER_STATUSES.REGISTERED) ||
    // If both have same status, prefer the one with more recent updates
    (existingKeepPortalUser.status === existingUnwantedPortalUser.status &&
      new Date(existingUnwantedPortalUser.updatedAt) > new Date(existingKeepPortalUser.updatedAt));

  if (shouldKeepUnwantedAccount) {
    // Delete the keep patient's account and transfer the unwanted patient's account
    await existingKeepPortalUser.destroy();
    return existingUnwantedPortalUser.update({
      patientId: keepPatientId,
    });
  } else {
    // Keep the existing account and delete the unwanted one
    await existingUnwantedPortalUser.destroy();
    return existingKeepPortalUser;
  }
}

export async function mergePatientInvoiceInsurancePlans(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
    where: { patientId: unwantedPatientId },
    paranoid: false,
  });
  if (!existingUnwantedInvoiceInsurancePlans.length) {
    return [];
  }
  const existingKeepInvoiceInsurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
    where: { patientId: keepPatientId },
    paranoid: false,
  });

  const affectedRecords = [];

  // For each unwanted invoice insurance plan,
  // update the patientId to the keep patient if it doesn't exist in the keep patient
  for (const unwantedInvoiceInsurancePlan of existingUnwantedInvoiceInsurancePlans) {
    if (
      !existingKeepInvoiceInsurancePlans.some(
        p => p.invoiceInsurancePlanId === unwantedInvoiceInsurancePlan.invoiceInsurancePlanId,
      )
    ) {
      await unwantedInvoiceInsurancePlan.update({
        patientId: keepPatientId,
      });
      affectedRecords.push(unwantedInvoiceInsurancePlan);
    }
  }

  // For each keep invoice insurance plan,
  // if it matches an unwanted invoice insurance plan AND it is soft deleted, restore it
  for (const keepInvoiceInsurancePlan of existingKeepInvoiceInsurancePlans) {
    const matchedUnwantedInvoiceInsurancePlan = existingUnwantedInvoiceInsurancePlans.find(
      p =>
        p.invoiceInsurancePlanId === keepInvoiceInsurancePlan.invoiceInsurancePlanId
    );
    // If
    // 1. the unwanted invoice insurance plan exists and is not soft deleted, and
    // 2. the keep invoice insurance plan is soft deleted,
    // then restore the keep invoice insurance plan
    const shouldRestore = matchedUnwantedInvoiceInsurancePlan && !matchedUnwantedInvoiceInsurancePlan.deletedAt && keepInvoiceInsurancePlan.deletedAt;
    if (shouldRestore) {
      await keepInvoiceInsurancePlan.restore();
      affectedRecords.push(keepInvoiceInsurancePlan);
    }
  }
}

export async function reconcilePatientFacilities(models, keepPatientId, unwantedPatientId) {
  // This is a special case that helps with syncing the now-merged patient to any facilities
  // that track it
  // For any facility with a patient_facilities record on _either_ patient, we create a brand new
  // patient_facilities record, then delete the old one(s). This is the simplest way of making sure
  // that no matter what, all facilities that previously tracked either patient will track the
  // merged one, _and_ will resync it from scratch and get any history that was associated by the
  // one that wasn't tracked (obviously there are individual cases that could be handled more
  // specifically, but better to have a simple rule to rule them all, at the expense of a bit of
  // extra sync bandwidth)
  const where = { patientId: { [Op.in]: [keepPatientId, unwantedPatientId] } };
  const existingPatientFacilityRecords = await models.PatientFacility.findAll({
    where,
  });
  // This is the only place where hard deletion is allowed, as we will be creating
  // new records to replace the all the old ones and then some.
  await models.PatientFacility.destroy({ where, force: true });

  if (existingPatientFacilityRecords.length === 0) return [];

  const facilitiesTrackingPatient = [
    ...new Set(existingPatientFacilityRecords.map(r => r.facilityId)),
  ];
  const newPatientFacilities = facilitiesTrackingPatient.map(facilityId => ({
    patientId: keepPatientId,
    facilityId,
  }));

  for (const chunkOfRecords of chunk(newPatientFacilities, BULK_CREATE_BATCH_SIZE)) {
    await models.PatientFacility.bulkCreate(chunkOfRecords);
  }
  return newPatientFacilities;
}

export async function refreshMultiChildRecordsForSync(model, records) {
  for (const record of records) {
    await refreshChildRecordsForSync(model, record.id);
  }
}

/**
 * Due to the generic cascade deletion hook, when the unwanted patient deletion is synced down to facility,
 * all dependent records that are not updated as part of this transaction will also be soft deleted in facility.
 * Hence, we need to update the dependent records of unwanted patient in this transaction, so that they are not soft deleted.
 * @param {*} models
 * @param {*} unwantedPatientId
 */
async function updateDependentRecordsForResync(models, unwantedPatientId) {
  // Encounters
  const encounters = await models.Encounter.findAll({
    where: { patientId: unwantedPatientId },
    attributes: ['id'],
  });
  await refreshMultiChildRecordsForSync(models.Encounter, encounters);

  // Patient Care Plans
  const patientCarePlans = await models.PatientCarePlan.findAll({
    where: { patientId: unwantedPatientId },
    attributes: ['id'],
  });
  await refreshMultiChildRecordsForSync(models.PatientCarePlan, patientCarePlans);

  // Patient Death Data
  const patientDeathDataRecords = await models.PatientDeathData.findAll({
    where: { patientId: unwantedPatientId },

    attributes: ['id'],
  });
  await refreshMultiChildRecordsForSync(models.PatientDeathData, patientDeathDataRecords);
}

export async function mergePatient(
  models,
  keepPatientId,
  unwantedPatientId,
  updateDependentRecordsForResyncEnabled = config.patientMerge
    .updateDependentRecordsForResyncEnabled,
) {
  const { sequelize } = models.Patient;

  if (keepPatientId === unwantedPatientId) {
    throw new InvalidParameterError('Cannot merge a patient record into itself.');
  }

  return sequelize.transaction(async () => {
    const keepPatient = await models.Patient.findByPk(keepPatientId);
    if (!keepPatient) {
      throw new InvalidParameterError(`Patient to keep (with id ${keepPatientId}) does not exist.`);
    }

    const unwantedPatient = await models.Patient.findByPk(unwantedPatientId);
    if (!unwantedPatient) {
      // Extremely tempting to start this error message with "Good news:"
      throw new InvalidParameterError(
        `Patient to merge (with id ${unwantedPatientId}) does not exist.`,
      );
    }

    log.info('patientMerge: starting', { keepPatientId, unwantedPatientId, name: 'PatientMerge' });

    const updates = {};

    // update missing fields
    await keepPatient.update(
      getMergedFieldsForUpdate(keepPatient.dataValues, unwantedPatient.dataValues),
    );

    // update core patient record
    await unwantedPatient.update({
      mergedIntoId: keepPatientId,
      visibilityStatus: VISIBILITY_STATUSES.MERGED,
    });

    // See the function's documentation for more details on why this is needed
    if (updateDependentRecordsForResyncEnabled) {
      await updateDependentRecordsForResync(models, unwantedPatientId);
    }

    updates.Patient = 2;

    // update associated records
    for (const modelName of simpleUpdateModels) {
      const affectedCount = await mergeRecordsForModel(
        models[modelName],
        keepPatientId,
        unwantedPatientId,
      );

      if (affectedCount > 0) {
        updates[modelName] = affectedCount;
      }
    }

    // Now reconcile patient additional data.
    // This is a special case as we want to just keep one, merged PAD record
    const updatedPAD = await mergePatientAdditionalData(models, keepPatientId, unwantedPatientId);
    if (updatedPAD) {
      updates.PatientAdditionalData = 1;
    }

    // Only keep 1 PatientBirthData
    const updatedPatientBirthData = await mergePatientBirthData(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (updatedPatientBirthData) {
      updates.PatientBirthData = 1;
    }

    const updatedPatientDeathDataRows = await mergePatientDeathData(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (updatedPatientDeathDataRows.length > 0) {
      updates.PatientDeathData = updatedPatientDeathDataRows.length;
    }

    const fieldValueUpdates = await mergePatientFieldValues(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (fieldValueUpdates.length > 0) {
      updates.PatientFieldValue = fieldValueUpdates.length;
    }

    const patientProgramRegistrationUpdates = await mergePatientProgramRegistrations(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (patientProgramRegistrationUpdates.length > 0) {
      updates.PatientProgramRegistration = patientProgramRegistrationUpdates.length;
    }

    // Merge PortalUser records - ensure only one portal account per patient
    const updatedPortalUser = await mergePortalUser(models, keepPatientId, unwantedPatientId);
    if (updatedPortalUser) {
      updates.PortalUser = 1;
    }

    // Merge notes - these don't have a patient_id due to their polymorphic FK setup
    // so need to be handled slightly differently.
    const notesMerged = await mergeRecordsForModel(
      models.Note,
      keepPatientId,
      unwantedPatientId,
      'record_id',
      `AND record_type = '${NOTE_RECORD_TYPES.PATIENT}'`,
    );
    if (notesMerged > 0) {
      updates.Note = notesMerged;
    }

    // Finally reconcile patient_facilities records
    const facilityUpdates = await reconcilePatientFacilities(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (facilityUpdates.length > 0) {
      updates.PatientFacility = facilityUpdates.length;
    }

    // Destroy at the end to avoid cascade deleting everything referencing the patient
    await unwantedPatient.destroy();

    log.info('patientMerge: finished', {
      keepPatientId,
      unwantedPatientId,
      updates,
      name: 'PatientMerge',
    });

    return {
      updates,
    };
  });
}
