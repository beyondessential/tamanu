import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { ProcedureForm } from '../forms/ProcedureForm';

const DumbProcedureModal = React.memo(
  ({ onClose, editedProcedure, onSaveProcedure }) => (
    <Modal width="md" title="New procedure" open={!!editedProcedure} onClose={onClose}>
      <ProcedureForm
        onSubmit={onSaveProcedure}
        onCancel={onClose}
        editedObject={editedProcedure}
      />
    </Modal>
  ),
);

export const ProcedureModal = connectApi((api, dispatch, { visitId }) => ({
  onSaveProcedure: async data => {
    if (data.id) {
      await api.put(`procedure/${data.id}`, data);
    } else {
      await api.post('procedure', {
        ...data,
        visitId,
      });
    }
    dispatch(viewVisit(visitId));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  procedureSuggester: new Suggester(api, 'procedureType'),
  anaestheticSuggester: new Suggester(api, 'drug'),
}))(DumbProcedureModal);
