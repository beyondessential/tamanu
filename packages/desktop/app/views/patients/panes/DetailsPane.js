import React from 'react';
import { useDispatch } from 'react-redux';
import { useApi } from '../../../api';
import { ContentPane } from '../../../components';
import { PatientDetailsForm } from '../../../forms/PatientDetailsForm';
import { reloadPatient } from '../../../store/patient';

export const PatientDetailsPane = React.memo(({ patient }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const handleSubmit = async data => {
    await api.put(`patient/${patient.id}`, data);
    dispatch(reloadPatient(patient.id));
  };
  return (
    <ContentPane>
      <PatientDetailsForm patient={patient} onSubmit={handleSubmit} />
    </ContentPane>
  );
});
