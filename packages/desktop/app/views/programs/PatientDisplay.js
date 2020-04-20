import React, { useEffect, useCallback } from 'react';

import { connect } from 'react-redux';

import { clearPatient } from 'desktop/app/store/patient';

export const PatientDisplay = connect(
  state => ({ patient: state.patient, }),
  dispatch => ({ onClearPatient: () => dispatch(clearPatient()) }),
)(React.memo(({ patient, onClearPatient }) => {
  const forInfo = `For ${patient.firstName} ${patient.lastName} (${patient.displayId})`;

  return (<p>{forInfo}<button onClick={onClearPatient}>change patient</button></p>);
}));

