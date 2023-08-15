import React, { useCallback } from 'react';
import { ENCOUNTER_TYPES, REFERRAL_STATUSES } from '@tamanu/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';

import { Modal } from './Modal';
import { reloadPatient } from '../store/patient';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';

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
      <Modal
        title={`Admit or check-in | ${
          props?.encounterType === ENCOUNTER_TYPES.ADMISSION ? 'Hospital admission' : ''
        }${props?.encounterType === ENCOUNTER_TYPES.CLINIC ? 'Clinic' : ''}`}
        open={open}
        onClose={onClose}
      >
        <EncounterForm
          onSubmit={onCreateEncounter}
          onCancel={onClose}
          patientBillingTypeId={patientBillingTypeId}
          {...props}
        />
      </Modal>
    );
  },
);
