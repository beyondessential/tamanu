import React from 'react';
import { connect } from 'react-redux';
import { DropdownButton } from './DropdownButton';

import { getCurrentRoute } from '../store/router';
import { viewPatient } from '../store/patient';

const DumbTriageActionDropdown = React.memo(
  ({ onDischarge, onAdmit }) => {
    const actions = [
      {
        label: 'See patient',
        onClick: () => onAdmit(),
      },
      {
        label: 'Discharge',
        onClick: onDischarge,
      }
    ];

    return <DropdownButton actions={actions} color="primary" />;
  },
);

export const TriageActionDropdown = connect(
  state => ({
    isOnPatientPage: getCurrentRoute(state) === '/patients/view',
  }),
  (dispatch, { triage }) => ({
    onAdmit: () => dispatch(viewPatient(triage.patient[0]._id, `checkin/triage`)),
    onDischarge: () => console.log("TODO: cancel triage without visit"),
  }),
)(DumbTriageActionDropdown);
