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
    departmentSuggester,
    facilitySuggester,
  }) => (
    <Modal title="New referral" open={open} onClose={onClose}>
      <ReferralForm
        onSubmit={onCreateReferral}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        icd10Suggester={icd10Suggester}
        departmentSuggester={departmentSuggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  ),
);

export const ReferralModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateReferral: async data => {
    await api.post(`referral`, { ...data, patientId });
    dispatch(reloadPatient(patientId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  facilitySuggester: new Suggester(api, 'facility'),
  departmentSuggester: new Suggester(api, 'department', {
    baseQueryParameters: { filterByFacility: true },
  }),
}))(DumbReferralModal);
