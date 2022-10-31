import { fake } from 'shared/test-helpers';

export default {
  run: (store, setupData, patientId) => {
    const { PatientAdditionalData } = store.models;
    return PatientAdditionalData.create({
      ...fake(PatientAdditionalData),
      patientId,
    });
  },
};
