import { Op } from 'sequelize';
import { chunk, isEmpty, omit, omitBy } from 'lodash';
import config from 'config';
import { VISIBILITY_STATUSES, PATIENT_MERGE_DELETION_ACTIONS } from 'shared/constants';
import { NOTE_RECORD_TYPES } from 'shared/constants/notes';
import { InvalidParameterError } from 'shared/errors';
import { log } from 'shared/services/logging';

const BULK_CREATE_BATCH_SIZE = 100;

// These ones just need a patientId switched over.
// Models included here will just have their patientId field
// redirected to the new patient and that's all.
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
  'PatientDeathData',
  'PatientBirthData',
  'Appointment',
  'DocumentMetadata',
  'CertificateNotification',
  'DeathRevertLog',
  'UserRecentlyViewedPatient',
];

// These ones need a little more attention.
// Models in this array will be ignored by the automatic pass
// so that they can be handled elsewhere.
export const specificUpdateModels = [
  'Patient',
  'PatientAdditionalData',
  'NotePage',
  'PatientFacility',
  'PatientFieldValue',
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

  // pad
  'updatedAtByField',
];

// Keeps all non-empty values from keepRecord, otherwise grabs values from unwantedRecord
function getSelectedMergeRecord(keepRecordValues = {}, unwantedRecordValues = {}) {
  const keepRecordNonEmptyValues = omitBy(keepRecordValues, isEmpty);
  const unwantedRecordNonEmptyValues = omitBy(unwantedRecordValues, isEmpty);

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

  const coveredModels = [...simpleUpdateModels, ...specificUpdateModels];
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
    raw: true,
  });
  if (!existingUnwantedPAD) return null;
  const existingKeepPAD = await models.PatientAdditionalData.findOne({
    where: { patientId: keepPatientId },
    raw: true,
  });
  const mergedPAD = {
    ...getSelectedMergeRecord(existingKeepPAD, existingUnwantedPAD),
    patientId: keepPatientId,
  };
  await models.PatientAdditionalData.destroy({
    where: { patientId: { [Op.in]: [keepPatientId, unwantedPatientId] } },
    force: true,
  });
  return models.PatientAdditionalData.create(mergedPAD);
}

export async function mergePatientFieldValues(models, keepPatientId, unwantedPatientId) {
  const existingUnwantedFieldValues = await models.PatientFieldValue.findAll({
    where: { patientId: unwantedPatientId },
  });
  if (existingUnwantedFieldValues.length === 0) return [];

  const existingKeepFieldValues = await models.PatientFieldValue.findAll({
    where: { patientId: keepPatientId },
  });
  const createdRecords = [];

  // Iterate through all definitions to ensure we're not missing any
  const patientFieldDefinitions = await models.PatientFieldDefinition.findAll();
  for (const definition of patientFieldDefinitions) {
    const keepRecord = existingKeepFieldValues.find(
      ({ definitionId }) => definitionId === definition.id,
    );
    const unwantedRecord = existingUnwantedFieldValues.find(
      ({ definitionId }) => definitionId === definition.id,
    );

    if (keepRecord) {
      // Prefer the keep record value if defined, otherwise if the unwanted value is defined use that
      await keepRecord.update({
        value: keepRecord.value || unwantedRecord.value,
      });
    } else if (unwantedRecord.value) {
      const newKeepRecord = await models.PatientFieldValue.create({
        value: unwantedRecord.value,
        definitionId: definition.id,
        patientId: keepPatientId,
      });
      createdRecords.push(newKeepRecord);
    }
  }

  await models.PatientFieldValue.destroy({
    where: { patientId: unwantedPatientId },
    force: true,
  });
  return [...existingKeepFieldValues, ...createdRecords];
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
  await models.PatientFacility.destroy({ where, force: true }); // hard delete

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

export async function mergePatient(models, keepPatientId, unwantedPatientId) {
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
      getSelectedMergeRecord(keepPatient.dataValues, unwantedPatient.dataValues),
    );

    // update core patient record
    await unwantedPatient.update({
      mergedIntoId: keepPatientId,
      visibilityStatus: VISIBILITY_STATUSES.MERGED,
    });

    const action = config.patientMerge?.deletionAction;
    if (action === PATIENT_MERGE_DELETION_ACTIONS.RENAME) {
      await unwantedPatient.update({ firstName: 'Deleted', lastName: 'Patient' });
    } else if (action === PATIENT_MERGE_DELETION_ACTIONS.DESTROY) {
      await unwantedPatient.destroy(); // this will just set deletedAt
    } else if (action === PATIENT_MERGE_DELETION_ACTIONS.NONE) {
      // do nothing
    } else {
      throw new Error(`Unknown config option for patientMerge.deletionAction: ${action}`);
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
    const updated = await mergePatientAdditionalData(models, keepPatientId, unwantedPatientId);
    if (updated) {
      updates.PatientAdditionalData = 1;
    }

    const fieldValueUpdates = await mergePatientFieldValues(
      models,
      keepPatientId,
      unwantedPatientId,
    );
    if (fieldValueUpdates.length > 0) {
      updates.PatientFieldValue = fieldValueUpdates.length;
    }

    // Merge notes - these don't have a patient_id due to their polymorphic FK setup
    // so need to be handled slightly differently.
    const notesMerged = await mergeRecordsForModel(
      models.NotePage,
      keepPatientId,
      unwantedPatientId,
      'record_id',
      `AND record_type = '${NOTE_RECORD_TYPES.PATIENT}'`,
    );
    if (notesMerged > 0) {
      updates.NotePage = notesMerged;
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
