export const extendClassWithPatientChannel = (model, name) => {
  // this should be fine - we're explicitly extending the class
  // eslint-disable-next-line no-param-reassign
  model.getChannels = async patientId => {
    let ids;
    if (patientId) {
      ids = [patientId];
    } else {
      ids = await model.sequelize.models.Patient.getSyncIds();
    }
    return ids.map(id => `patient/${id}/${name}`);
  };

  model.afterInit(() => {
    const HOOK_TRIGGER = 'beforeSave';
    const HOOK_NAME = 'markPatientForPush';
    model.removeHook(HOOK_TRIGGER, HOOK_NAME);
    model.addHook(HOOK_TRIGGER, HOOK_NAME, async record => {
      if (!record.patientId) {
        return;
      }
      if (record.changed('pushedAt')) {
        return;
      }
      const patient = await model.sequelize.models.Patient.findByPk(record.patientId);
      if (!patient) {
        return;
      }
      patient.markedForSync = true;
      await patient.save();
    });
  });
};
