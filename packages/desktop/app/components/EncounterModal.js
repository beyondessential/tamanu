import React, { useCallback } from 'react';
import { REFERRAL_STATUSES } from 'shared/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';

import { Modal } from './Modal';
import { reloadPatient } from '../store/patient';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

export const EncounterModal = React.memo(
  ({ open, onClose, patientId, referral, patientBillingTypeId, ...props }) => {
    const { navigateToEncounter } = usePatientNavigation();
    const { createEncounter } = useEncounter();
    const api = useApi();
    const dispatch = useDispatch();

    const onCreateEncounter = useCallback(
      async data => {
        const encounter = await createEncounter({
          patientId,
          referralId: referral?.id,
          ...data,
        });
        if (referral) {
          await api.put(`referral/${referral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
        }

        await dispatch(reloadPatient(patientId));
        navigateToEncounter(encounter.id);
        onClose();
      },
      [dispatch, patientId, api, createEncounter, onClose, referral, navigateToEncounter],
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
