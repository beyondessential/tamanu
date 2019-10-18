import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { AppointmentForm } from '../forms/AppointmentForm';

const DumbAppointmentModal = React.memo(
  ({
    open,
    locationSuggester,
    practitionerSuggester,
    facilitySuggester,
    onClose,
    onCreateAppointment,
  }) => {
    return (
      <Modal title="New appointment" open={open} onClose={onClose}>
        <AppointmentForm
          onSubmit={onCreateAppointment}
          onCancel={onClose}
          locationSuggester={locationSuggester}
          facilitySuggester={facilitySuggester}
          practitionerSuggester={practitionerSuggester}
        />
      </Modal>
    );
  },
);

export const AppointmentModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateAppointment: async data => {
    await api.post(`patient/${patientId}/appointment`, data);
    dispatch(reloadPatient(patientId));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  facilitySuggester: new Suggester(api, 'facility'),
}))(DumbAppointmentModal);
