import React from 'react';
import { useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { ContentPane } from '../../../components';
import { PatientDetailsForm } from '../../../forms/PatientDetailsForm/PatientDetailsForm';
import { reloadPatient } from '../../../store/patient';
import { invalidatePatientDataQueries, notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

// Momentary component to just display a message, will need design and
// refactor later.
const ForbiddenMessage = () => (
  <ContentPane data-testid="contentpane-ne7c">
    <Typography variant="h4" data-testid="typography-h8e1">
      <TranslatedText
        stringId="general.error.forbidden"
        fallback="Forbidden"
        data-testid="translatedtext-1ddp"
      />
    </Typography>
    <Typography variant="body2" data-testid="typography-viyk">
      <TranslatedText
        stringId="patient.detailsSidebar.error.forbiddenMessage"
        fallback="You do not have permission to read, create or write patient data."
        data-testid="translatedtext-i65m"
      />
    </Typography>
  </ContentPane>
);

export const PatientDetailsPane = React.memo(
  ({ patient, additionalData, birthData, patientFields, insurancePlans}) => {
    const api = useApi();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { ability } = useAuth();

    const handleSubmit = async (data) => {
      try {
        await api.put(`patient/${patient.id}`, data);
      } catch (e) {
        notifyError(e.message);
        return;
      }

      // invalidate the cache of patient data queries to reload the patient data
      await invalidatePatientDataQueries(queryClient, patient.id);
      dispatch(reloadPatient(patient.id));
    };

    // Display form if user can read, write or create patient additional data.
    // It's assumed that if a user got this far, they can read a patient.
    const canViewForm = ['read', 'write', 'create'].some((verb) => ability.can(verb, 'Patient'));

    if (canViewForm === false) {
      return <ForbiddenMessage data-testid="forbiddenmessage-sklx" />;
    }

    return (
      <ContentPane data-testid="contentpane-p0hd">
        <PatientDetailsForm
          patient={patient}
          additionalData={additionalData}
          birthData={birthData}
          patientFields={patientFields}
          insurancePlans={insurancePlans}
          onSubmit={handleSubmit}
          data-testid="patientdetailsform-qx47"
        />
      </ContentPane>
    );
  },
);
