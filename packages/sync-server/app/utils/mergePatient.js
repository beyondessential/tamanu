import { VISIBILITY_STATUSES } from 'shared/constants';

const simpleUpdateModels = [
  'PatientAllergy',
  'Encounter',
];

export async function checkTables(context) {
  const modelsToUpdate = Object.values(context.models)
    .filter(m => m.hasField('patientId'));
  
  // TODO:
  // exclude those covered by simpleUpdateModels
  // exclude PatientAdditionalData
  // make a fuss about any remaining

  // TODO: call this during startup validation
}

export async function mergePatient(context, canonicalPatientId, redundantPatientId) {
  return context.models.Patient.sequelize.transaction(() => {
    const redundantPatient = await context.models.Patient.findByPk(redundantPatientId);

    // update core patient record
    await redundantPatient.update({
      mergedIntoId: canonicalPatientId,
      visibilityStatus: VISIBILITY_STATUSES.MERGED,
    });
    
    // update associated records
    const updates = {};
    for (const modelName of simpleUpdateModels) {
      const model = context.models[modelName];
      const affected = await model.update({ 
        patientId: canonicalPatientId,
      }, {
        where: { patientId: redundantPatientId } 
      });
      updates[modelName] = affected.count;
    }

    // reconcile PAD
    // TODO!!
    
    // TODO: any others
    
    return {
      updates,
    };
  });
}