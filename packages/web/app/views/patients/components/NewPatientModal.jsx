import React, { useCallback, useState } from 'react';

import { generateId } from '@tamanu/utils/generateId';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useAuth } from '../../../contexts/Auth';
import { DuplicatePatientWarningModal } from './DuplicatePatientWarningModal';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const { facilityId } = useAuth();

  // Warning modal state
  const [warningModalData, setWarningModalData] = useState({
    proposedPatient: {},
    potentialDuplicates: [],
  });
  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const confirmUniquePatientWithUser = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const onSubmit = useCallback(
    async data => {
      try {
        const { data: potentialDuplicates } = await api.post('patient/checkDuplicates', data);

        // If duplicates are found, populate the warning modal state and wait for the user to
        // confirm its unique. If the user confirms, proceed with creating the new patient
        if (potentialDuplicates.length > 0) {
          setWarningModalData({
            proposedPatient: data,
            potentialDuplicates,
          });
          const confirmed = await confirmUniquePatientWithUser();
          if (!confirmed) return;
        }

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
    <>
      <FormModal
        title={
          <TranslatedText
            stringId="patient.modal.create.title"
            fallback="Add new patient"
            data-testid="translatedtext-q61s"
          />
        }
        onClose={onCancel}
        open={open}
        data-testid="formmodal-jc02"
      >
        <NewPatientForm
          generateId={generateId}
          onCancel={onCancel}
          onSubmit={onSubmit}
          {...formProps}
          data-testid="newpatientform-4lx2"
        />
      </FormModal>
      <DuplicatePatientWarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
        data-testid="warningmodal-h7av"
        warningModalData={warningModalData}
        onCancelNewPatient={onCancel}
      />
    </>
  );
};
