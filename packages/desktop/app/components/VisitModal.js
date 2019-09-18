import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VisitForm } from '../forms/VisitForm';

const DumbVisitModal = React.memo(
  ({ open, locationSuggester, practitionerSuggester, onClose, onCreateVisit, referrals }) => (
    <Modal title="Check in" open={open} onClose={onClose}>
      <VisitForm
        onSubmit={onCreateVisit}
        onCancel={onClose}
        locationSuggester={locationSuggester}
        practitionerSuggester={practitionerSuggester}
        referrals={referrals}
      />
    </Modal>
  ),
);

export const VisitModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateVisit: async data => {
    const createdVisit = await api.post(`patient/${patientId}/visits`, data);
    dispatch(viewVisit(createdVisit._id));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbVisitModal);
