import React, { memo } from 'react';
import shortid from 'shortid';

import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

const DumbNewPatientModal = memo(({ open, ...formProps }) => (
  <Modal title="Create new patient" open={open}>
    <NewPatientForm generateId={shortid.generate} {...formProps} />
  </Modal>
));

export const NewPatientModal = connectApi(api => ({
  patientSuggester: new Suggester(api, 'patient', ({ _id, firstName, lastName }) => ({
    value: _id,
    label: `${firstName} ${lastName}`,
  })),
  facilitySuggester: new Suggester(api, 'facility'),
  onSubmit: data => api.post('patient', data),
}))(DumbNewPatientModal);
