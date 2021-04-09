import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { ImmunisationForm } from '../forms/ImmunisationForm';
import { VACCINE_STATUS } from '../constants';

const DumbImmunisationModal = React.memo(
  ({
    open,
    practitionerSuggester,
    vaccineSuggester,
    onClose,
    onCreateImmunisation,
    facilitySuggester,
    departmentSuggester,
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
          departmentSuggester={departmentSuggester}
          getScheduledVaccines={getScheduledVaccines}
        />
      </Modal>
    );
  },
);

export const ImmunisationModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateImmunisation: async data => {
    await api.post(`patient/${patientId}/administeredVaccine`, {
      ...data,
      patientId,
      status: VACCINE_STATUS.GIVEN,
    });
    dispatch(reloadPatient(patientId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  facilitySuggester: new Suggester(api, 'facility'),
  vaccineSuggester: new Suggester(api, 'vaccine'),
  departmentSuggester: new Suggester(api, 'department'),
  getScheduledVaccines: async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
}))(DumbImmunisationModal);
