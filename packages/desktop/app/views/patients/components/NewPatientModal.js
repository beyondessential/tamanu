import React, { memo } from 'react';

import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

import { generateId } from '../../../../../shared/utils/generateId';

const DumbNewPatientModal = memo(({ open, onCancel, isBirth, ...formProps }) => (
  <Modal title={isBirth ? 'Record new birth' : 'Create new patient'} onClose={onCancel} open={open}>
    <NewPatientForm generateId={generateId} onCancel={onCancel} isBirth={isBirth} {...formProps} />
  </Modal>
));

export const NewPatientModal = connectApi((api, dispatch, { onCreateNewPatient }) => ({
  patientSuggester: new Suggester(api, 'patient', ({ id, firstName, lastName }) => ({
    value: id,
    label: `${firstName} ${lastName}`,
  })),
  facilitySuggester: new Suggester(api, 'facility'),
  villageSuggester: new Suggester(api, 'village'),
  ethnicitySuggester: new Suggester(api, 'ethnicity'),
  onSubmit: async data => {
    const newPatient = await api.post('patient', data);
    onCreateNewPatient(newPatient);
  },
}))(DumbNewPatientModal);
