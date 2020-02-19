import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';

import { getCurrentDecisionSupport, POP_DECISION_SUPPORT } from 'desktop/app/store/decisionSupport';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';

import { DateDisplay } from './DateDisplay';
import { ModalActionRow } from './ButtonRow';

const RepeatDiagnosisMessage = React.memo(({ diagnosis, previousDiagnoses }) => (
  <React.Fragment>
    <p>{
      `Attention: 
      This patient has been previously diagnosed with ${diagnosis.diagnosis._id} on:
    `}</p>
    <ul>
      { previousDiagnoses.map(pd => <li><DateDisplay date={pd.date} /></li>) }
    </ul>
  </React.Fragment>
));

const DumbDecisionSupportModal = React.memo(({ message, onClose }) => {
  if(!message) {
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

