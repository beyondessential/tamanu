import React, { memo } from 'react';

import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';
import { viewPatient } from '../../../store/patient';

import { generateId } from '../../../../../shared/utils/generateId';

const DumbNewPatientModal = memo(({ open, ...formProps }) => (
  <Modal title="Create new patient" open={open}>
    <NewPatientForm generateId={generateId} {...formProps} />
  </Modal>
));

export const NewPatientModal = connectApi((api, dispatch, { onCancel }) => ({
  patientSuggester: new Suggester(api, 'patient', ({ _id, firstName, lastName }) => ({
    value: _id,
    label: `${firstName} ${lastName}`,
  })),
  facilitySuggester: new Suggester(api, 'facility'),
  onSubmit: async data => {
    const { _id: patientId } = await api.post('patient', data);
    onCancel();
    dispatch(viewPatient(patientId));
  },
}))(DumbNewPatientModal);
