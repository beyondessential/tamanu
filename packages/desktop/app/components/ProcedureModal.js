import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { ProcedureForm } from '../forms/ProcedureForm';
import { useEncounter } from '../contexts/Encounter';

const DumbProcedureModal = React.memo(
  ({
    onClose,
    editedProcedure,
    onSaveProcedure,
    locationSuggester,
    practitionerSuggester,
    procedureSuggester,
    anaestheticSuggester,
    encounterId,
  }) => {
    const { loadEncounter } = useEncounter();
    const saveProcedure = useCallback(async data => {
      await onSaveProcedure(data);
      await loadEncounter(encounterId);
      onClose();
    }, []);

    return (
      <Modal width="md" title="New procedure" open={!!editedProcedure} onClose={onClose}>
        <ProcedureForm
          onSubmit={saveProcedure}
          onCancel={onClose}
          editedObject={editedProcedure}
          locationSuggester={locationSuggester}
          practitionerSuggester={practitionerSuggester}
          procedureSuggester={procedureSuggester}
          anaestheticSuggester={anaestheticSuggester}
        />
      </Modal>
    );
  },
);

export const ProcedureModal = connectApi((api, dispatch, { encounterId }) => ({
  onSaveProcedure: async data => {
    if (data.id) {
      await api.put(`procedure/${data.id}`, data);
    } else {
      await api.post('procedure', {
        ...data,
        encounterId,
      });
    }
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  procedureSuggester: new Suggester(api, 'procedureType'),
  anaestheticSuggester: new Suggester(api, 'drug'),
}))(DumbProcedureModal);
