import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FormModal } from '../../FormModal';
import { IPSQRCodeForm } from '../../../forms/IPSQRCodeForm';
import { getCurrentUser } from '../../../store';
import { useApi } from '../../../api';

export const IPSQRCodeModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const currentUser = useSelector(getCurrentUser);
  const api = useApi();

  const createIPSNotification = useCallback(
    data =>
      api.post('ipsNotification', {
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: currentUser.id,
      }),
    [api, patient.id, currentUser.id],
  );

  return (
    <FormModal title="IPS QR Code" open={open} onClose={() => setOpen(false)}>
      <IPSQRCodeForm
        patient={patient}
        onSubmit={createIPSNotification}
        onCancel={() => setOpen(false)}
      />
    </FormModal>
  );
});
