import { VISIBILITY_STATUSES } from 'shared/constants';

const simpleUpdateModels = [
  'PatientAllergy',
  'Encounter',
];

const complexUpdateModels = [
  'Patient',
  'PatientAdditionalData',
];

const fieldReferencesPatient = field => field.references?.model === 'patients';
const modelReferencesPatient = model => Object.values(model.getAttributes()).some(fieldReferencesPatient);

export async function getTablesWithNoMergeCoverage(models) {
  const modelsToUpdate = Object.values(models).filter(modelReferencesPatient);
  
  console.log(modelsToUpdate);

  const coveredModels = [...simpleUpdateModels, ...complexUpdateModels];
  const missingModels = modelsToUpdate.filter(
    m => !coveredModels.includes(m.modelName)
  );

  console.log(missingModels);

  return missingModels;
}

export async function mergePatient(models, canonicalPatientId, redundantPatientId) {
  return models.Patient.sequelize.transaction(async () => {
    const redundantPatient = await models.Patient.findByPk(redundantPatientId);

    const updates = {};

    // update core patient record
    await redundantPatient.update({
      mergedIntoId: canonicalPatientId,
      visibilityStatus: VISIBILITY_STATUSES.MERGED,
      deletedAt: new Date(),
    });
    updates[models.Patient.modelName] = 1;
    
    // update associated records
    for (const modelName of simpleUpdateModels) {
      const model = models[modelName];
      const affected = await model.update({ 
        patientId: canonicalPatientId,
      }, {
        where: { patientId: redundantPatientId } 
      });
      console.log(affected);
      updates[modelName] = affected.count;
    }

    // reconcile PAD
    // TODO!!
    
    // TODO: any other things that require special handling
    
    return {
      updates,
    };
  });
}