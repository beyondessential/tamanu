import { VISIBILITY_STATUSES } from 'shared/constants';

// These ones just need a patientId switched over.
// Models included here will just have their patientId field
// redirected to the new patient and that's all.
const simpleUpdateModels = [
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
  'Appointment',
  'DocumentMetadata',
  'CertificateNotification',
];

// These ones need a little more attention.
// Models in this array will be ignored by the automatic pass
// so that they can be handled elsewhere.
const specificUpdateModels = [
  'Patient',
  'PatientAdditionalData',
];

const fieldReferencesPatient = field => field.references?.model === 'patients';
const modelReferencesPatient = ([name, model]) => Object.values(model.getAttributes()).some(fieldReferencesPatient);

export async function getTablesWithNoMergeCoverage(models) {
  const modelsToUpdate = Object.entries(models).filter(modelReferencesPatient);
  
  const coveredModels = [...simpleUpdateModels, ...specificUpdateModels];
  const missingModels = modelsToUpdate.filter(
    ([name, model]) => !coveredModels.includes(name)
  );

  return missingModels;
}

async function simpleUpdatePatientId(model, keepPatientId, unwantedPatientId, additionalOptions = {}) {
  // We need to go via a raw query as Model.update({}) performs validation on the whole record,
  // so we'll be rejected for failing to include required fields - even though we only want to
  // update patientId! 
  const tableName = model.getTableName();
  const [records, result] = await model.sequelize.query(`
    UPDATE ${tableName} 
    SET 
      patient_id = :keepPatientId
    WHERE
      patient_id = :unwantedPatientId
  `, {
    replacements: {
      unwantedPatientId,
      keepPatientId,
    }
  });

  return result.rowCount;
}

export async function mergePatient(models, keepPatientId, unwantedPatientId) {
  return models.Patient.sequelize.transaction(async () => {
    const unwantedPatient = await models.Patient.findByPk(unwantedPatientId);

    const updates = {};

    // update core patient record
    await unwantedPatient.update({
      mergedIntoId: keepPatientId,
      visibilityStatus: VISIBILITY_STATUSES.MERGED,
      deletedAt: new Date(),
    }, { paranoid: false });
    updates.Patient = 1;
    
    // update associated records
    for (const modelName of simpleUpdateModels) {
      const affectedCount = await simpleUpdatePatientId(
        models[modelName], 
        keepPatientId, 
        unwantedPatientId,
      );

      if (affectedCount > 0) {
        updates[modelName] = affectedCount;
      }
    }
    
    // reconcile PAD
    // TODO!!
    
    // TODO: any other things that require special handling
    
    return {
      updates,
    };
  });
}