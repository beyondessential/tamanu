import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { reloadVisit } from '../store/visit';

import { ReferralForm } from '../forms/ReferralForm';

const DumbReferralModal = React.memo(
  ({ open, icd10Suggester, practitionerSuggester, onClose, onCreateReferral }) => {
    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <ReferralForm
          onSubmit={onCreateReferral}
          onCancel={onClose}
          practitionerSuggester={practitionerSuggester}
          icd10Suggester={icd10Suggester}
        />
      </Modal>
    );
  },
);

export const ReferralModal = connectApi((api, dispatch, { visitId }) => ({
  onCreateReferral: async data => {
    await api.post(`visit/${visitId}/referral`, data);
    dispatch(reloadVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbReferralModal);
