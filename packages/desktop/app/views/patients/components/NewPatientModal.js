import React, { memo, useMemo } from 'react';
import shortid from 'shortid';

import { Modal, ModalActions, ModalContent, ConfirmCancelRow } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

const FormContainer = memo(({ onSubmit, children: form, open, onCancel }) => (
  <Modal title="Create new patient" open={open}>
    <ModalContent>{form}</ModalContent>
    <ModalActions>
      <ConfirmCancelRow
        style={{ gridColumn: 2 }}
        onCancel={onCancel}
        onConfirm={onSubmit}
        confirmText="Create patient"
      />
    </ModalActions>
  </Modal>
));

const DumbNewPatientModal = memo(({ open, onCancel, ...restOfProps }) => {
  const Container = useMemo(
    () => props => <FormContainer open={open} onCancel={onCancel} {...props} />,
    [open, onCancel],
  );
  return <NewPatientForm Container={Container} generateId={shortid.generate} {...restOfProps} />;
});

export const NewPatientModal = connectApi(api => ({
  patientSuggester: new Suggester(api, 'patient', ({ _id, firstName, lastName }) => ({
    value: _id,
    label: `${firstName} ${lastName}`,
  })),
  facilitySuggester: new Suggester(api, 'facility'),
  onSubmit: data => api.post('patient', data),
}))(DumbNewPatientModal);
