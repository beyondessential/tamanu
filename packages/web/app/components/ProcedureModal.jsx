import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { FormModal } from './FormModal';
import { ProcedureForm } from '../forms/ProcedureForm';

// Both date and startTime only keep track of either date or time, accordingly.
// This grabs both relevant parts for the table.
const getActualDateTime = ({ date, startTime }) => {
  return `${date.slice(0, 10)} ${startTime.slice(-8)}`;
};

export const ProcedureModal = ({ onClose, onSaved, encounterId, editedProcedure }) => {
  const api = useApi();
  const locationSuggester = new Suggester(api, 'location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const procedureSuggester = new Suggester(api, 'procedureType');
  const anaestheticSuggester = new Suggester(api, 'drug');

  return (
    <FormModal
      width="md"
      title={`${editedProcedure?.id ? 'Edit' : 'New'} procedure`}
      open={!!editedProcedure}
      onClose={onClose}
    >
      <ProcedureForm
        onSubmit={async data => {
          const actualDateTime = getActualDateTime(data);
          const updatedData = {
            ...data,
            date: actualDateTime,
            startTime: actualDateTime,
            encounterId
          };

          if (updatedData.id) {
            await api.put(`procedure/${updatedData.id}`, updatedData);
          } else {
            await api.post('procedure', updatedData);
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
    </FormModal>
  );
};
