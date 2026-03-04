import React, { useState } from 'react';

import { ButtonRow, Button, Modal, TranslatedText } from '@tamanu/ui-components';

export const PatientAlert = React.memo(({ alerts = [] }) => {
  const [alertVisible, setAlertVisible] = useState(true);

  if (alerts.length === 0) return null;
  const close = () => setAlertVisible(false);

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.warning.title"
          fallback="Patient warnings"
          data-testid="translatedtext-s19r"
        />
      }
      open={alertVisible}
      onClose={close}
      data-testid="modal-on8s"
    >
      <ul>
        {alerts.map((a) => (
          <li key={a.id}>{a.note}</li>
        ))}
      </ul>
      <ButtonRow data-testid="buttonrow-us9q">
        <Button variant="contained" color="primary" onClick={close} data-testid="button-3i9s">
          <TranslatedText
            stringId="general.action.ok"
            fallback="OK"
            data-testid="translatedtext-xjk1"
          />
        </Button>
      </ButtonRow>
    </Modal>
  );
});
