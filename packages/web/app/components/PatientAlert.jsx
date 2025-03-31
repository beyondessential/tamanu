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
        data-test-id='translatedtext-10cy' />}
      open={alertVisible}
      onClose={close}
    >
      <ul data-test-id='ul-slw2'>
        {alerts.map(a => (
          <li key={a.id} data-test-id='li-l3zq'>{a.note}</li>
        ))}
      </ul>
      <ButtonRow data-test-id='buttonrow-q5z9'>
        <Button
          variant="contained"
          color="primary"
          onClick={close}
          data-test-id='button-gpil'>
          <TranslatedText
            stringId="general.action.ok"
            fallback="OK"
            data-test-id='translatedtext-er5f' />
        </Button>
      </ButtonRow>
    </Modal>
  );
});
