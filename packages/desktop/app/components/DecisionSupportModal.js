import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';

import { getCurrentDecisionSupport, POP_DECISION_SUPPORT } from 'desktop/app/store/decisionSupport';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';

const DumbDecisionSupportModal = React.memo(({ message, onClose }) => (
  <Modal title="Decision support" open={!!message} onClose={onClose}>
    {JSON.stringify(message, null, 2)}
  </Modal>
));

export const DecisionSupportModal = connect(
  state => ({
    message: getCurrentDecisionSupport(state),
  }),
  dispatch => ({
    onClose: () => dispatch({ type: POP_DECISION_SUPPORT }),
  }),
)(DumbDecisionSupportModal);

