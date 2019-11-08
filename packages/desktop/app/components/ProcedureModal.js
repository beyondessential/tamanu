import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { ProcedureForm } from '../forms/ProcedureForm';

const DumbProcedureModal = React.memo(({ open, onClose, onCreateProcedure, ...rest }) => (
  <Modal width="md" title="Check in" open={open} onClose={onClose}>
    <ProcedureForm onSubmit={onCreateProcedure} onCancel={onClose} {...rest} />
  </Modal>
));

export const ProcedureModal = connectApi((api, dispatch, { visitId }) => ({
  onCreateProcedure: async data => {
    await api.post(`visit/${visitId}/procedure`, data);
    dispatch(viewVisit(visitId));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  cptCodeSuggester: new Suggester(api, 'procedure'),
  anaesthesiaSuggester: new Suggester(api, 'drug'),
}))(DumbProcedureModal);
