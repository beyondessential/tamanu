import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VisitForm } from '../forms/VisitForm';

export const VisitModal = connect()(
  connectApi(api => ({ api }))(
    React.memo(({ api, onClose, visitId, dispatch }) => {
      const onSubmit = async data => {
        const expandedData = {
          ...data,
          location: { _id: data.location },
          examiner: { _id: data.examiner },
        };
        const createdVisit = await api.post('visit', expandedData);
        dispatch(viewVisit(createdVisit._id));
        onClose();
      };

      return (
        <Modal title="Check in" isVisible onClose={onClose}>
          <VisitForm 
            onSubmit={onSubmit}
            onCancel={onClose} 
            locationSuggester={new Suggester("location")}
            practitionerSuggester={new Suggester("practitioner")}
          />
        </Modal>
      );
    }),
  ),
);
