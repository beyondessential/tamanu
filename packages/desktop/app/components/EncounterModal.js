import React, { useCallback } from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewPatientEncounter } from '../store/patient';

import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';
import { useReferral } from '../contexts/Referral';
import { LoadingIndicator } from './LoadingIndicator';

const DumbEncounterModal = React.memo(
  ({ open, onClose, patientId, loadAndViewPatientEncounter, ...rest }) => {
    const { createEncounter } = useEncounter();
    const { referral, writeReferral, loadingReferral } = useReferral();

    const onCreateEncounter = useCallback(
      async data => {
        const createdEncounter = await createEncounter({ patientId, ...data });
        if (referral) {
          console.log('attaching referral')
          await writeReferral(referral.id, { encounterId: createdEncounter.id });
        }
        loadAndViewPatientEncounter();
        onClose();
      },
      [patientId],
    );

    if (loadingReferral) return <LoadingIndicator />;

    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <EncounterForm onSubmit={onCreateEncounter} onCancel={onClose} {...rest} />
      </Modal>
    );
  },
);

export const EncounterModal = connectApi((api, dispatch, { patientId }) => ({
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
  loadAndViewPatientEncounter: () => dispatch(viewPatientEncounter(patientId)),
}))(DumbEncounterModal);
