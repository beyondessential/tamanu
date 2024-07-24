import React, { useCallback, useState } from 'react';

import { generateId } from '@tamanu/shared/utils/generateId';
import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useLocalisation } from '../../../contexts/Localisation';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const { getLocalisation } = useLocalisation();
  // This is a hack to allow cambodia patient details template to have
  // mandatory fields that are not moved up into the primary details section.
  const collapseAdditionalFields =
    getLocalisation('layouts.patientDetails') !== PATIENT_DETAIL_LAYOUTS.CAMBODIA;

  const api = useApi();

  const [isSameAddress, setIsSameAddress] = useState(true);
  const toggleIsSameAddress = useCallback(value => setIsSameAddress(value));

  const onSubmit = useCallback(
    async data => {
      try {
        let submittedData = data;
        const {
          divisionId,
          subdivisionId,
          settlementId,
          villageId,
          streetVillage,
        } = submittedData;
  
        if (isSameAddress) {
          submittedData = {
            ...submittedData,
            secondaryDivisionId: divisionId,
            secondarySubdivisionId: subdivisionId,
            secondarySettlementId: settlementId,
            secondaryVillageId: villageId,
            patientFields: {
              ...submittedData.patientFields,
              "fieldDefinition-secondaryAddressStreet": streetVillage,
            }
          };
        }

        const newPatient = await api.post('patient', { ...submittedData, registeredById: api.user.id });
        onCreateNewPatient(newPatient);
      } catch (e) {
        notifyError(e.message);
      }
    },
    [api, onCreateNewPatient, isSameAddress],
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
        isSameAddress={isSameAddress}
        toggleIsSameAddress={toggleIsSameAddress}
        {...formProps}
      />
    </FormModal>
  );
};
