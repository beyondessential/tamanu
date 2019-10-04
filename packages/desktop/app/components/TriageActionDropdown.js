import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { FullWidthDropdownButton } from './DropdownButton';

import { getCurrentRoute } from '../store/router';
import { viewPatient } from '../store/patient';
import { viewVisit } from '../store/visit';

const DumbTriageActionDropdown = React.memo(({ triage, onDischarge, onAdmit, onViewVisit }) => {
  if (triage.visit) {
    return <FullWidthDropdownButton actions={[{ label: 'View visit', onClick: onViewVisit }]} />;
  }

  const actions = [
    {
      label: 'See patient',
      onClick: () => onAdmit(),
    },
    {
      label: 'Discharge',
      onClick: onDischarge,
    },
  ];

  return <FullWidthDropdownButton actions={actions} color="primary" />;
});

export const TriageActionDropdown = connect(
  null,
  (dispatch, { triage }) => ({
    onAdmit: () => dispatch(viewPatient(triage.patient[0]._id, `checkin/triage`)),
    onViewVisit: () => dispatch(viewVisit(triage.visit._id)),
    onDischarge: () => console.log('TODO: cancel triage without visit'),
  }),
)(DumbTriageActionDropdown);
