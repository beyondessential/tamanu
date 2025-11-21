import React, { useCallback, useState } from 'react';

import { generateIdFromPattern } from '@tamanu/utils/generateId';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useAuth } from '../../../contexts/Auth';
import { DuplicatePatientWarningModal } from './DuplicatePatientWarningModal';
import { CancelNewPatientConfirmationModal } from './CancelNewPatientConfirmationModal';
import { useSettings } from '@tamanu/ui-components';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const { getSetting } = useSettings();
  const { facilityId } = useAuth();
  const patientIdGenerationPattern = getSetting('patientIdGenerationPattern');
  
  const [cancelNewPatientModalOpen, setCancelNewPatientModalOpen] = useState(false);
  const [duplicateWarningModalOpen, setDuplicateWarningModalOpen] = useState(false);
  const [duplicateWarningModalData, setDuplicateWarningModalData] = useState({
    proposedPatient: {},
    potentialDuplicates: [],
  });
  const [resolveFn, setResolveFn] = useState(null);

  const confirmUniquePatientWithUser = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setDuplicateWarningModalOpen(true);
    });

  const onSubmit = useCallback(
    async data => {
      try {
        const { data: potentialDuplicates } = await api.post('patient/checkDuplicates', data);

        // If duplicates are found, populate the warning modal state and wait for the user to
        // confirm its unique. If the user confirms, proceed with creating the new patient
        if (potentialDuplicates.length > 0) {
          setDuplicateWarningModalData({
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
        onClose={() => setCancelNewPatientModalOpen(true)}
        open={open}
        data-testid="formmodal-jc02"
      >
        <NewPatientForm
          generateId={() => generateIdFromPattern(patientIdGenerationPattern)}
          onCancel={() => setCancelNewPatientModalOpen(true)}
          onSubmit={onSubmit}
          {...formProps}
          data-testid="newpatientform-4lx2"
        />
      </FormModal>
      <DuplicatePatientWarningModal
        open={duplicateWarningModalOpen}
        setShowWarningModal={setDuplicateWarningModalOpen}
        resolveFn={resolveFn}
        data-testid="warningmodal-h7av"
        data={duplicateWarningModalData}
        showCancelNewPatientModal={() => setCancelNewPatientModalOpen(true)}
      />
      <CancelNewPatientConfirmationModal
        open={cancelNewPatientModalOpen}
        onClose={() => setCancelNewPatientModalOpen(false)}
        onCancelConfirm={() => {
          setCancelNewPatientModalOpen(false);
          setDuplicateWarningModalOpen(false);
          onCancel();
        }}
      />
    </>
  );
};
