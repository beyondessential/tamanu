import React, { useState, useCallback } from 'react';

import { FormModal } from '../../FormModal';
import { IPSQRCodeForm } from '../../../forms/IPSQRCodeForm';
import { useApi } from '../../../api';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';

export const IPSQRCodeModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const api = useApi();
  const { navigateToPatient } = usePatientNavigation();

  const createIPSRequest = useCallback(
    async data => {
      await api.post(`patient/${patient.id}/ipsRequest`, {
        email: data.email,
      });
      setOpen(false);
      navigateToPatient(patient.id);
    },
    [api, patient.id, navigateToPatient],
  );

  return (
    <FormModal title="International Patient Summary" open={open} onClose={() => setOpen(false)}>
      <IPSQRCodeForm
        patient={patient}
        onSubmit={createIPSRequest}
        onCancel={() => setOpen(false)}
      />
    </FormModal>
  );
});
