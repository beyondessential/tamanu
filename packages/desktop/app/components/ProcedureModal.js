import React from 'react';

import { formatISO9075 } from 'date-fns';
import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { ProcedureForm } from '../forms/ProcedureForm';

export const ProcedureModal = ({ onClose, onSaved, encounterId, editedProcedure }) => {
  const api = useApi();
  const locationSuggester = new Suggester(api, 'location');
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const procedureSuggester = new Suggester(api, 'procedureType');
  const anaestheticSuggester = new Suggester(api, 'drug');

  return (
    <Modal
      width="md"
      title={`${editedProcedure?.id ? 'Edit' : 'New'} procedure`}
      open={!!editedProcedure}
      onClose={onClose}
    >
      <ProcedureForm
        onSubmit={async data => {
          // Standardize this once we fully implement ISO9075 dates
          const payload = {
            ...data,
            startTime: formatISO9075(new Date(data.startTime)),
          };
          if (payload.id) {
            await api.put(`procedure/${payload.id}`, payload);
          } else {
            await api.post('procedure', {
              ...payload,
              encounterId,
            });
          }
          onSaved();
        }}
        onCancel={onClose}
        editedObject={editedProcedure}
        locationSuggester={locationSuggester}
        practitionerSuggester={practitionerSuggester}
        procedureSuggester={procedureSuggester}
        anaestheticSuggester={anaestheticSuggester}
      />
    </Modal>
  );
};
