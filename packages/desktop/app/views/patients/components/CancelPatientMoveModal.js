import React from 'react';
import PropTypes from 'prop-types';
import { usePatientMove } from '../../../api/mutations';
import { ConfirmCancelRow, Form, FormGrid, Modal, LargeBodyText } from '../../../components';

export const CancelPatientMoveModal = React.memo(({ encounter, open, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  return (
    <Modal title="Cancel move" endpoint="plannedLocation" open={open}>
      <Form
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

CancelPatientMoveModal.propTypes = {
  encounter: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

CancelPatientMoveModal.defaultProps = {
  open: false,
  onClose: null,
};
