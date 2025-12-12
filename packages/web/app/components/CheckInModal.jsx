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
          stringId="encounter.property.type.admission"
          fallback="Hospital admission"
          data-testid="translatedtext-bmgr"
        />
      );
    case ENCOUNTER_TYPES.CLINIC:
      return (
        <TranslatedText
          stringId="encounter.property.type.clinic"
          fallback="Clinic"
          data-testid="translatedtext-lt10"
        />
      );
    default:
      return '';
  }
}

export const CheckInModal = React.memo(
  ({
    open,
    onClose,
    onSubmitEncounter,
    patientId,
    referral,
    patientBillingTypeId,
    initialValues,
    withExistingEncounterCheck,
    ...props
  }) => {
    const { createEncounter } = useEncounter();
    const api = useApi();
    const dispatch = useDispatch();

    const onCreateEncounter = useCallback(
      async data => {
        const newEncounter = await createEncounter({
          patientId,
          referralId: referral?.id,
          ...data,
        });

        if (referral) {
          await api.put(`referral/${referral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
        }

        onSubmitEncounter?.(newEncounter);

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
            stringId="patient.modal.checkIn.title"
            fallback="Admit or check-in | :encounterType"
            replacements={{ encounterType: getEncounterTypeLabel(props?.encounterType) }}
            data-testid="translatedtext-s67c"
          />
        }
        open={open}
        onClose={onClose}
        data-testid="formmodal-4oua"
      >
        <EncounterForm
          onSubmit={async data => withExistingEncounterCheck(async () => onCreateEncounter(data))}
          onCancel={onClose}
          patientBillingTypeId={patientBillingTypeId}
          initialValues={initialValues}
          {...props}
          data-testid="encounterform-13gk"
        />
      </FormModal>
    );
  },
);
