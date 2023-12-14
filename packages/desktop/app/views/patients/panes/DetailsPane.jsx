import React from 'react';
import { useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { ContentPane } from '../../../components';
import { PatientDetailsForm } from '../../../forms/PatientDetailsForm';
import { reloadPatient } from '../../../store/patient';
import { notifyError, invalidatePatientDataQueries } from '../../../utils';

// Momentary component to just display a message, will need design and
// refactor later.
const ForbiddenMessage = () => (
  <ContentPane>
    <Typography variant="h4">Forbidden</Typography>
    <Typography variant="body2">
      You do not have permission to read, create or write patient data.
    </Typography>
  </ContentPane>
);

export const PatientDetailsPane = React.memo(
  ({ patient, additionalData, birthData, patientFields }) => {
    const api = useApi();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { ability } = useAuth();

    const handleSubmit = async data => {
      try {
        await api.put(`patient/${patient.id}`, data);
      } catch (e) {
        notifyError(e.message);
        return;
      }

      // invalidate the cache of patient data queries to reload the patient data
      invalidatePatientDataQueries(queryClient, patient.id);
      dispatch(reloadPatient(patient.id));
    };

    // Display form if user can read, write or create patient additional data.
    // It's assumed that if a user got this far, they can read a patient.
    const canViewForm = ['read', 'write', 'create'].some(verb => ability.can(verb, 'Patient'));

    if (canViewForm === false) {
      return <ForbiddenMessage />;
    }

    return (
      <ContentPane>
        <PatientDetailsForm
          patient={patient}
          additionalData={additionalData}
          birthData={birthData}
          patientFields={patientFields}
          onSubmit={handleSubmit}
        />
      </ContentPane>
    );
  },
);
