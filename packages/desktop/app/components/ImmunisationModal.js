import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { ImmunisationForm } from '../forms/ImmunisationForm';

const DumbImmunisationModal = React.memo(
  ({
    open,
    practitionerSuggester,
    vaccineSuggester,
    onClose,
    onCreateImmunisation,
    facilitySuggester,
    getScheduledVaccines,
  }) => {
    return (
      <Modal title="New vaccine" open={open} onClose={onClose}>
        <ImmunisationForm
          onSubmit={onCreateImmunisation}
          onCancel={onClose}
          practitionerSuggester={practitionerSuggester}
          facilitySuggester={facilitySuggester}
          vaccineSuggester={vaccineSuggester}
          getScheduledVaccines={getScheduledVaccines}
        />
      </Modal>
    );
  },
);

export const ImmunisationModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateImmunisation: async data => {
    await api.post(`patient/${patientId}/administeredVaccine`, { ...data, patientId });
    dispatch(reloadPatient(patientId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  facilitySuggester: new Suggester(api, 'facility'),
  vaccineSuggester: new Suggester(api, 'vaccine'),
  getScheduledVaccines: async query => {
    return await api.get(`patient/${patientId}/scheduledVaccine`, query);
  },
}))(DumbImmunisationModal);
