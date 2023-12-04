import React, { useCallback } from 'react';
import { ENCOUNTER_TYPES, REFERRAL_STATUSES } from '@tamanu/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';

import { FormModal } from './FormModal';
import { reloadPatient } from '../store/patient';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';
import { TranslatedText } from './Translation/TranslatedText';

function getEncounterTypeLabel(encounterType) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return (
        <TranslatedText
          stringId="patient.encounter.type.admission.label"
          fallback="Hospital admission"
        />
      );
    case ENCOUNTER_TYPES.CLINIC:
      return <TranslatedText stringId="patient.encounter.type.clinic.label" fallback="Clinic" />;
    default:
      return '';
  }
}

export const CheckInModal = React.memo(
  ({ open, onClose, onSubmitEncounter, patientId, referral, patientBillingTypeId, ...props }) => {
    const { createEncounter } = useEncounter();
    const api = useApi();
    const dispatch = useDispatch();

    const onCreateEncounter = useCallback(
      async data => {
        const newEncounter = {
          patientId,
          referralId: referral?.id,
          ...data,
        };

        await createEncounter(newEncounter);
        if (referral) {
          await api.put(`referral/${referral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
        }

        if (typeof onSubmitEncounter === 'function') {
          onSubmitEncounter(newEncounter);
        }

        onClose();

        dispatch(reloadPatient(patientId));
      },
      [dispatch, patientId, api, createEncounter, onSubmitEncounter, onClose, referral],
    );
    return (
      <FormModal
        // using replacements avoids [Object object] in the title
        title={
          <TranslatedText
            stringId="patient.modal.admit.title"
            fallback="Admit or check-in | :encounterType"
            replacements={{ encounterType: getEncounterTypeLabel(props?.encounterType) }}
          />
        }
        open={open}
        onClose={onClose}
      >
        <EncounterForm
          onSubmit={onCreateEncounter}
          onCancel={onClose}
          patientBillingTypeId={patientBillingTypeId}
          {...props}
        />
      </FormModal>
    );
  },
);
