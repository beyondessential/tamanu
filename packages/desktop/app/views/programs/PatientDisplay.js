import React, { memo } from 'react';

import { connect } from 'react-redux';

import { clearPatient } from 'desktop/app/store/patient';
import { Button } from 'desktop/app/components/Button';

export const PatientDisplay = connect(
  state => ({ patient: state.patient }),
  dispatch => ({ onClearPatient: () => dispatch(clearPatient()) }),
)(
  memo(({ patient, onClearPatient }) => {
    const forInfo = `For ${patient.firstName} ${patient.lastName} (${patient.displayId})`;

    return (
      <p>
        {forInfo}
        <Button onClick={onClearPatient} variant="contained">Change patient</Button>
      </p>
    );
  }),
);
