import React, { useState } from 'react';
import { ButtonRow } from './ButtonRow';
import { Button } from './Button';
import { TranslatedText } from './Translation/TranslatedText';
import { Modal } from './Modal';

export const PatientAlert = React.memo(({ alerts = [] }) => {
  const [alertVisible, setAlertVisible] = useState(true);

  if (alerts.length === 0) return null;
  const close = () => setAlertVisible(false);

  return (
    <Modal
      title={<TranslatedText
        stringId="patient.warning.title"
        fallback="Patient warnings"
        data-testid='translatedtext-10cy' />}
      open={alertVisible}
      onClose={close}
    >
      <ul data-testid='ul-slw2'>
        {alerts.map(a => (
          <li key={a.id} data-testid='li-l3zq'>{a.note}</li>
        ))}
      </ul>
      <ButtonRow data-testid='buttonrow-q5z9'>
        <Button
          variant="contained"
          color="primary"
          onClick={close}
          data-testid='button-gpil'>
          <TranslatedText
            stringId="general.action.ok"
            fallback="OK"
            data-testid='translatedtext-er5f' />
        </Button>
      </ButtonRow>
    </Modal>
  );
});
