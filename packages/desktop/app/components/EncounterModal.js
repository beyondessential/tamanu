import React, { useCallback } from 'react';
import { REFERRAL_STATUSES } from 'shared/constants';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { push } from 'connected-react-router';
import { Modal } from './Modal';
import { reloadPatient } from '../store/patient';
import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';

export const EncounterModal = React.memo(
  ({ open, onClose, patientId, referral, patientBillingTypeId, ...props }) => {
    const params = useParams();
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

        dispatch(reloadPatient(patientId));
        dispatch(push(`/patients/${params.category}/${patientId}/encounter/${encounter.id}/`));
        onClose();
      },
      [dispatch, patientId, api, createEncounter, onClose, referral, params.category],
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
