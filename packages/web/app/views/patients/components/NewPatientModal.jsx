import React, { useCallback, useState } from 'react';

import { generateId } from '@tamanu/utils/generateId';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useAuth } from '../../../contexts/Auth';
import { DuplicatePatientWarningModal } from './DuplicatePatientWarningModal';
import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const { facilityId } = useAuth();

  const [proposedPatient, setProposedPatient] = useState({});
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const onSubmit = useCallback(
    async data => {
      try {
        const params = new URLSearchParams({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
        });

        const { data: potentialDuplicates } = await api.get(
          `patient/checkDuplicates?${params.toString()}`,
        );

        // TODO: maybe this should be done in the function
        const transformedDuplicates = potentialDuplicates.map(renameObjectKeys);

        if (potentialDuplicates.length > 0) {
          setPotentialDuplicates(transformedDuplicates);
          setProposedPatient(data);
          const confirmedNotDuplicate = await handleShowWarningModal();
          if (!confirmedNotDuplicate) return;
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
        proposedPatient={proposedPatient}
        potentialDuplicates={potentialDuplicates}
      />
    </>
  );
};
