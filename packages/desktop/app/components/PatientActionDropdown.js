import React from 'react';
import { connect } from 'react-redux';
import { DropdownButton } from './DropdownButton';

import { push } from 'connected-react-router';
import { getCurrentRoute } from '../store/router';
import { 
  getCurrentVisit, 
  viewPatient, 
  viewPatientVisit,
} from '../store/patient';

const DumbPatientActionDropdown = React.memo(({ 
  isOnPatientPage,
  patient,
  onView,
  onAdmit,
  onTriage,
  onDischarge,
}) => {
  const visit = patient.visits.find(x => !x.endDate);
  const isCheckedIn = !!visit;

  const actions = [
    {
      label: 'View',
      onClick: onView,
      condition: () => !isOnPatientPage,
    },
    { 
      label: 'Admit',
      onClick: onAdmit,
      condition: () => !isCheckedIn,
    },
    { 
      label: 'Discharge',
      onClick: () => onDischarge(visit._id),
      condition: () => isCheckedIn,
    },
    { 
      label: 'Triage', 
      onClick: onTriage,
      condition: () => !isCheckedIn,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <DropdownButton
      actions={actions} 
      color={isCheckedIn ? "secondary" : "primary"}
    />
  );
});

export const PatientActionDropdown = connect(
  state => ({
    isOnPatientPage: getCurrentRoute(state) === '/patients/view',
  }),
  (dispatch, { patient }) => ({
    onView: () => dispatch(viewPatient(patient._id)),
    onAdmit: () => dispatch(viewPatient(patient._id, 'checkin')),
    onDischarge: (visitId) => dispatch(viewPatientVisit(patient._id, visitId, 'discharge')),
    onTriage: () => dispatch(viewPatient(patient._id, 'triage')),
  })
)(DumbPatientActionDropdown);
