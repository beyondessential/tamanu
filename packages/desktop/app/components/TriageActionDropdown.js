import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { DropdownButton } from './DropdownButton';

import { getCurrentRoute } from '../store/router';
import { viewPatient } from '../store/patient';
import { viewVisit } from '../store/visit';

const StyledDropdownButton = styled(DropdownButton)`
  width: 100%; /* targets single action button */

  div:first-of-type {
    /* targets dropdown button container, ignoring actions container */
    width: 100%;

    button:first-of-type {
      /* targets action button, ignoring dropdown button */
      width: 100%;
    }
  }
`;

const DumbTriageActionDropdown = React.memo(({ triage, onDischarge, onAdmit, onViewVisit }) => {
  if (triage.visit) {
    return <StyledDropdownButton actions={[{ label: 'View visit', onClick: onViewVisit }]} />;
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

  return <StyledDropdownButton actions={actions} color="primary" />;
});

export const TriageActionDropdown = connect(
  null,
  (dispatch, { triage }) => ({
    onAdmit: () => dispatch(viewPatient(triage.patient[0]._id, `checkin/triage`)),
    onViewVisit: () => dispatch(viewVisit(triage.visit._id)),
    onDischarge: () => console.log('TODO: cancel triage without visit'),
  }),
)(DumbTriageActionDropdown);
