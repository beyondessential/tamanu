import React from 'react';
import { connect } from 'react-redux';

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

const DumbDecisionSupportModal = React.memo(({ message, onClose }) => {
  if (!message) {
    return null;
  }
  return (
    <Modal title="Decision support" open onClose={onClose}>
      <RepeatDiagnosisMessage {...message.extraInfo} />
      <ModalActionRow onConfirm={onClose} confirmText="OK" />
    </Modal>
  );
});

export const DecisionSupportModal = connect(
  state => ({
    message: getCurrentDecisionSupport(state),
  }),
  dispatch => ({
    onClose: () => dispatch({ type: POP_DECISION_SUPPORT }),
  }),
)(DumbDecisionSupportModal);
