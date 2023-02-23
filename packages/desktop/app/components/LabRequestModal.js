import React from 'react';
import { customAlphabet } from 'nanoid';
import { useApi, useSuggester } from '../api';
import { Modal } from './Modal';
import { LabRequestForm } from '../forms/LabRequestForm';
import { ALPHABET_FOR_ID } from '../constants';

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');

  return (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
      <LabRequestForm
        onSubmit={async data =>
          api.post(`labRequest`, {
            ...data,
            encounterId: encounter.id,
          })
        }
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        departmentSuggester={departmentSuggester}
        generateDisplayId={customAlphabet(ALPHABET_FOR_ID, 7)}
      />
    </Modal>
  );
};
