import React, { useCallback } from 'react';

import { generateId } from '@tamanu/shared/utils/generateId';
import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useLocalisation } from '../../../contexts/Localisation';
import { useAuth } from '../../../contexts/Auth';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { getLocalisation } = useLocalisation();
  // This is a hack to allow cambodia patient details template to have
  // mandatory fields that are not moved up into the primary details section.
  const collapseAdditionalFields =
    getLocalisation('layouts.patientDetails') !== PATIENT_DETAIL_LAYOUTS.CAMBODIA;

  const onSubmit = useCallback(
    async data => {
      try {
        const newPatient = await api.post('patient', {
          ...data,
          registeredById: api.user.id,
          facilityId,
        });
        onCreateNewPatient(newPatient);
      } catch (e) {
        notifyError(e.message);
      }
    },
    [api, onCreateNewPatient, facilityId],
  );
  return (
    <FormModal
      title={<TranslatedText stringId="patient.modal.create.title" fallback="Add new patient" />}
      onClose={onCancel}
      open={open}
    >
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
