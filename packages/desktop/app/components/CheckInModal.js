import React, { useCallback } from 'react';
import { REFERRAL_STATUSES } from 'shared/constants';
import { useApi } from '../api';

import { Modal } from './Modal';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';
import { usePatient } from '../contexts/Patient';

export const CheckInModal = React.memo(
  ({ open, onClose, patientId, referral, patientBillingTypeId, ...props }) => {
    const { createEncounter } = useEncounter();
    const api = useApi();
    const { loadPatient } = usePatient();

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

        loadPatient(patientId);
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
