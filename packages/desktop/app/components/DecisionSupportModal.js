import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getCurrentDecisionSupport, POP_DECISION_SUPPORT } from '../store/specialModals';
import { Modal } from './Modal';

import { DateDisplay } from './DateDisplay';
import { ModalActionRow } from './ModalActionRow';

const RepeatDiagnosisMessage = React.memo(({ previousDiagnoses }) => (
  <>
    <p>
      {`Attention: 
      This patient has been previously diagnosed with ${previousDiagnoses[0].diagnosis.name} on:
    `}
    </p>
    <ul>
      {previousDiagnoses.map(pd => (
        <li>
          <DateDisplay date={pd.date} />
        </li>
      ))}
    </ul>
  </>
));

export const DecisionSupportModal = () => {
  const message = useSelector(getCurrentDecisionSupport);
  const dispatch = useDispatch();
  const onClose = () => dispatch({ type: POP_DECISION_SUPPORT });

  if (!message) {
    return null;
  }
  return (
    <Modal title="Decision support" open onClose={onClose}>
      <RepeatDiagnosisMessage {...message.extraInfo} />
      <ModalActionRow onConfirm={onClose} confirmText="OK" />
    </Modal>
  );
};
