import React, { useCallback } from 'react';
import { REFERRAL_STATUSES } from 'shared/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';

import { Modal } from './Modal';
import { reloadPatient } from '../store/patient';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';

export const CheckInModal = React.memo(
  ({ open, onClose, patientId, referral, patientBillingTypeId, ...props }) => {
    const { createEncounter } = useEncounter();
    const api = useApi();
    const dispatch = useDispatch();

    const onCreateEncounter = useCallback(
      async data => {
        onClose();
        await createEncounter({
          patientId,
          referralId: referral?.id,
          ...data,
        });
        if (referral) {
          await api.put(`referral/${referral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
        }

        dispatch(reloadPatient(patientId));
      },
      [dispatch, patientId, api, createEncounter, onClose, referral],
    );

    return (
      <Modal title="Check-in" open={open} onClose={onClose}>
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
