import React, { useState } from 'react';
import { ButtonRow } from './ButtonRow';
import { Button } from './Button';
import { Modal } from './Modal';

export const PatientAlert = React.memo(({ alerts = [] }) => {
  const [alertVisible, setAlertVisible] = useState(true);

  if (alerts.length === 0) return null;
  const close = () => setAlertVisible(false);

  return (
    <Modal title="Patient warnings" open={alertVisible} onClose={close}>
      <ul>
        {alerts.map(a => (
          <li key={a.id}>{a.note}</li>
        ))}
      </ul>
      <ButtonRow>
        <Button variant="contained" color="primary" onClick={close}>
          OK
        </Button>
      </ButtonRow>
    </Modal>
  );
});
