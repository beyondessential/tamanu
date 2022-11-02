import React from 'react';
import { usePatientMove } from '../../../api/mutations';
import { ConfirmCancelRow, Form, FormGrid, Modal, LargeBodyText } from '../../../components';

export const CancelPatientMoveModal = React.memo(({ encounter, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  return (
    <Modal title="Cancel move" endpoint="plannedLocation">
      <Form
        initialValues={{ plannedLocation: encounter.plannedLocation }}
        onSubmit={submit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <LargeBodyText>Are you sure you want to cancel the planned patient move?</LargeBodyText>
            <ConfirmCancelRow
              onConfirm={submitForm}
              confirmText="Yes, cancel"
              cancelText="Keep it"
              onCancel={onClose}
            />
          </FormGrid>
        )}
      />
    </Modal>
  );
});
