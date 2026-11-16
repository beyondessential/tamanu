import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { invalidatePatientDataQueries, notifyError, notifySuccess } from '../../utils';
import { TranslatedText } from '../../components/Translation';

/**
 * Saving the patient details form, wherever it is shown — the patient's Details tab and the
 * invoicing patient details modal. Reports its own success and failure, and refreshes the patient's
 * data, so the two agree on what saving a patient looks like.
 *
 * Resolves to whether the save went through, for a caller that does something next.
 */
export const useSavePatientDetails = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();

  return async data => {
    try {
      await api.put(route('patient/:patientId', { patientId }), { ...data, facilityId });
    } catch (error) {
      notifyError(error.message);
      return false;
    }

    await invalidatePatientDataQueries(queryClient, patientId);
    notifySuccess(
      <TranslatedText
        stringId="patient.details.notification.saveSuccess"
        fallback="Patient details successfully updated"
      />,
    );
    return true;
  };
};
