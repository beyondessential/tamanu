import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { FormModal } from './FormModal';
import { ProcedureForm } from '../forms/ProcedureForm';
import { TranslatedText } from './Translation/TranslatedText';

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
      title={
        <TranslatedText
          stringId="procedure.modal.title"
          fallback=":action procedure"
          replacements={{
            action: editedProcedure?.id ? (
              <TranslatedText stringId="general.action.edit" fallback="Edit" />
            ) : (
              <TranslatedText stringId="general.action.new" fallback="New" />
            ),
          }}
        />
      }
      open={!!editedProcedure}
      onClose={onClose}
    >
      <ProcedureForm
        onSubmit={async data => {
          if (data.id) {
            await api.put(`procedure/${data.id}`, data);
          } else {
            await api.post('procedure', {
              ...data,
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
    </FormModal>
  );
};
