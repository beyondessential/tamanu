import React from 'react';
import { connectApi } from '../../../api';

import { ContentPane } from '../../../components/ContentPane';
import { PatientDetailsForm } from '../../../forms/PatientDetailsForm';
import { reloadPatient } from '../../../store/patient';

export const ConnectedPatientDetailsForm = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.put(`patient/${patient.id}`, data);
    dispatch(reloadPatient(patient.id));
  },
}))(
  React.memo(props => (
    <ContentPane>
      <PatientDetailsForm {...props} />
    </ContentPane>
  )),
);
