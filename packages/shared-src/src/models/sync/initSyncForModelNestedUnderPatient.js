import { SYNC_DIRECTIONS } from '../../constants';

export const initSyncForModelNestedUnderPatient = (model, name) => {
  model.afterInit(() => {
    const HOOK_TRIGGER = 'beforeSave';
    const HOOK_NAME = 'markPatientForPush';
    // we remove and add the hook because Sequelize doesn't have a good way
    // to detect which hooks have already been added to a model in its
    // public API
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

  return {
    syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
    channelRoutes: [
      {
        route: `patient/:patientId/${name}`,
        params: [{ name: 'patientId' }],
      },
    ],
    getChannels: async patientId => {
      let ids;
      if (patientId) {
        ids = [patientId];
      } else {
        ids = await model.sequelize.models.Patient.getSyncIds();
      }
      return ids.map(id => `patient/${id}/${name}`);
    },
  };
};
