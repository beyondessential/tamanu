import React, { useCallback } from 'react';

import { generateId } from '@tamanu/shared/utils/generateId';
import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { useLocalisation } from '../../../contexts/Localisation';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const { getLocalisation } = useLocalisation();
  // This is a hack to allow cambodia patient details template to have
  // mandatory fields that are not moved up into the primary details section.
  const collapseAdditionalFields =
    getLocalisation('layouts.patientDetails') !== PATIENT_DETAIL_LAYOUTS.CAMBODIA;

  const api = useApi();
  const onSubmit = useCallback(
    async data => {
      try {
        const newPatient = await api.post('patient', { ...data, registeredById: api.user.id });
        onCreateNewPatient(newPatient);
      } catch (e) {
        notifyError(e.message);
      }
    },
    [api, onCreateNewPatient],
  );
  return (
    <FormModal title="Add new patient" onClose={onCancel} open={open}>
      <NewPatientForm
        generateId={generateId}
        onCancel={onCancel}
        onSubmit={onSubmit}
        collapseAdditionalFields={collapseAdditionalFields}
        {...formProps}
      />
    </FormModal>
  );
};
