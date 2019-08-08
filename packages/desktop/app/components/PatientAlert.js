import React from 'react';
import { Modal } from './Modal';
import { ButtonRow } from './ButtonRow';
import { Button } from './Button';

export const PatientAlert = React.memo(({ alerts }) => {
  const alertExists = alerts.length > 0;
  const [alertVisible, setAlertVisible] = React.useState(alertExists);
  const close = () => setAlertVisible(false);

  return (
    <Modal title="Patient warnings" isVisible={alertVisible}>
      <ul>
        {alerts.map(a => (
          <li key={a}>{a}</li>
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
