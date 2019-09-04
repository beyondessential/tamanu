import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { ReferralForm } from '../forms/ReferralForm';

const DumbReferralModal = React.memo(
  ({
    open,
    icd10Suggester,
    practitionerSuggester,
    onClose,
    onCreateReferral,
    locationSuggester,
    facilitySuggester,
  }) => {
    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <ReferralForm
          onSubmit={onCreateReferral}
          onCancel={onClose}
          practitionerSuggester={practitionerSuggester}
          icd10Suggester={icd10Suggester}
          locationSuggester={locationSuggester}
          facilitySuggester={facilitySuggester}
        />
      </Modal>
    );
  },
);

export const ReferralModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateReferral: async data => {
    await api.post(`patient/${patientId}/referral`, data);
    dispatch(reloadPatient(patientId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  facilitySuggester: new Suggester(api, 'facility'),
  locationSuggester: new Suggester(api, 'location'),
}))(DumbReferralModal);
