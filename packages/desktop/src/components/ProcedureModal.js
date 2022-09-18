import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { ProcedureForm } from '../forms/ProcedureForm';
import { toDateTimeString } from '../utils/dateTime';

export const ProcedureModal = ({ onClose, onSaved, encounterId, editedProcedure }) => {
  const api = useApi();
  const locationSuggester = new Suggester(api, 'location', {
    baseQueryParameters: { filterByFacility: true },
  });
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
          const payload = {
            ...data,
            startTime: toDateTimeString(data.startTime),
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
