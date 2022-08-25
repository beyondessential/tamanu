import React from 'react';

import { VACCINE_STATUS } from 'shared/constants';

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
    departmentSuggester,
    getScheduledVaccines,
    locationSuggester,
  }) => (
    <Modal title="Give vaccine" open={open} onClose={onClose}>
      <ImmunisationForm
        onSubmit={onCreateImmunisation}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        vaccineSuggester={vaccineSuggester}
        departmentSuggester={departmentSuggester}
        getScheduledVaccines={getScheduledVaccines}
        locationSuggester={locationSuggester}
      />
    </Modal>
  ),
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
  locationSuggester: new Suggester(api, 'location', {
    baseQueryParameters: { filterByFacility: true },
  }),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  vaccineSuggester: new Suggester(api, 'vaccine'),
  departmentSuggester: new Suggester(api, 'department', {
    baseQueryParameters: { filterByFacility: true },
  }),
  getScheduledVaccines: async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
}))(DumbImmunisationModal);
