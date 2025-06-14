import React, { useState, useCallback } from 'react';

import { FormModal } from '../../FormModal';
import { IPSQRCodeForm } from '../../../forms/IPSQRCodeForm';
import { useApi } from '../../../api';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { TranslatedText } from '../../Translation/TranslatedText';

export const IPSQRCodeModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const api = useApi();
  const { navigateToPatient } = usePatientNavigation();

  const createIPSRequest = useCallback(
    async data => {
      try {
        setConfirmDisabled(true);
        await api.post(`patient/${patient.id}/ipsRequest`, {
          email: data.email,
        });
        setOpen(false);
        navigateToPatient(patient.id);
      } finally {
        setConfirmDisabled(false);
      }
    },
    [api, patient.id, navigateToPatient],
  );

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patient.modal.ips.title"
          fallback="International Patient Summary"
          data-testid="translatedtext-ips-title"
        />
      }
      open={open}
      onClose={() => setOpen(false)}
      data-testid="formmodal-iuvu"
    >
      <IPSQRCodeForm
        patient={patient}
        onSubmit={createIPSRequest}
        confirmDisabled={confirmDisabled}
        onCancel={() => setOpen(false)}
        data-testid="ipsqrcodeform-36mj"
      />
    </FormModal>
  );
});
