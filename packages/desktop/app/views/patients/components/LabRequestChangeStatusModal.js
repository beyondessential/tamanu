import React, { useState } from 'react';
import { ConfirmCancelRow, FormGrid, Modal, SelectInput } from '../../../components';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../../constants';

export const LabRequestChangeStatusModal = React.memo(
  ({ status: currentStatus, updateLabReq, open, onClose }) => {
    const [status, setStatus] = useState(currentStatus);

    const updateLabStatus = async () => {
      await updateLabReq({ status });
      onClose();
    };

    return (
      <>
        <Modal open={open} onClose={onClose} title="Change lab request status">
          <FormGrid columns={1}>
            <SelectInput
              label="Status"
              name="status"
              options={LAB_REQUEST_STATUS_OPTIONS}
              value={status}
              onChange={({ target: { value } }) => setStatus(value)}
            />
            <ConfirmCancelRow onConfirm={updateLabStatus} confirmText="Save" onCancel={onClose} />
          </FormGrid>
        </Modal>
      </>
    );
  },
);
