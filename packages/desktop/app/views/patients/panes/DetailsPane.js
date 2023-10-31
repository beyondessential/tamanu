import React from 'react';
import { useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { ContentPane } from '../../../components';
import { PatientDetailsForm } from '../../../forms/PatientDetailsForm';
import { reloadPatient } from '../../../store/patient';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

// Momentary component to just display a message, will need design and
// refactor later.
const ForbiddenMessage = () => (
  <ContentPane>
    <Typography variant="h4">
      <TranslatedText stringId="error.forbidden" fallback="Forbidden" />
    </Typography>
    <Typography variant="body2">
      <TranslatedText
        stringId="patient.detailsSidebar.forbidden" // #TODO this could be better
        fallback="You do not have permission to read, create or write patient data."
      />
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

      queryClient.invalidateQueries(['additionalData', patient.id]);
      queryClient.invalidateQueries(['birthData', patient.id]);
      queryClient.invalidateQueries(['patientFields', patient.id]);
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
