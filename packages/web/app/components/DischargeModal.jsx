import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSettings, useSuggester } from '@tamanu/ui-components';
import { PATIENT_STATUS } from '../constants';
import { useEncounter } from '../contexts/Encounter';
import { usePatient } from '../contexts/Patient';
import { DischargeForm } from '../forms/DischargeForm';
import { ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY } from '../api/queries/useEncounterDischargeDraftQuery';
import { getPatientStatus } from '../utils/getPatientStatus';
import { invalidatePatientDataQueries } from '../utils/invalidatePatientDataQueries';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { FormModal } from './FormModal';

const DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY = 'AE-';
const DISCHARGE_DISPOSITION_FOR_INPATIENTS_ONLY = 'IN-';
const DISCHARGE_DISPOSITION_FOR_OUTPATIENTS_ONLY = 'OP-';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { navigateToPatient } = usePatientNavigation();
  const { patient } = usePatient();
  const { getSetting } = useSettings();
  const allowFilterDischargeDisposition = getSetting('features.filterDischargeDispositions');
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');
  const { facility } = encounter.location;

  const [title, setTitle] = useState('');
  const handleTitleChange = useCallback((title) => setTitle(title), []);

  const dischargeDispositionFilterer = (dischargeDisposition) => {
    switch (getPatientStatus(encounter.encounterType)) {
      case PATIENT_STATUS.EMERGENCY:
        // This is an emergency encounter
        if (
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_INPATIENTS_ONLY) ||
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_OUTPATIENTS_ONLY)
        ) {
          return false; // Do not show discharge dispositions that are only for inpatient or outpatient encounters
        }
        // Otherwise show everything
        return true;
      case PATIENT_STATUS.OUTPATIENT:
        // This is an outpatient encounter
        if (
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY) ||
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_INPATIENTS_ONLY)
        ) {
          return false; // Do not show discharge dispositions that are only for emergency and inpatient encounters
        }
        // Otherwise show everything
        return true;
      case PATIENT_STATUS.INPATIENT:
        // This is an inpatient encounter
        if (
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY) ||
          dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_OUTPATIENTS_ONLY)
        ) {
          return false; // Do not show discharge dispositions that are only for emergency and outpatient encounters
        }
        // Otherwise show everything
        return true;
      default:
        throw new Error('Unsupported encounter type for discharge disposition');
    }
  };

  const dispositionSuggester = useSuggester('dischargeDisposition', {
    filterer: allowFilterDischargeDisposition ? dischargeDispositionFilterer : undefined,
  });

  const handleDischarge = useCallback(
    async (data) => {
      // add facility details to discharge details
      data.discharge = {
        ...data.discharge,
        facilityName: facility.name,
        facilityAddress: facility.streetAddress,
        facilityTown: facility.cityTown,
      };
      await writeAndViewEncounter(encounter.id, data);
      // The encounter is now discharged: refresh the queries that decide whether "Prepare
      // discharge" or "Discharge summary" is shown, otherwise re-entering the encounter can still
      // read the pre-discharge cache until something else forces a refetch.
      invalidatePatientDataQueries(queryClient, patient?.id);
      queryClient.invalidateQueries(['encounterDischarge', encounter.id]);
      queryClient.invalidateQueries([ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY, encounter.id]);
      navigateToPatient(patient?.id);
      onClose();
    },
    [
      writeAndViewEncounter,
      encounter.id,
      queryClient,
      patient?.id,
      onClose,
      navigateToPatient,
      facility,
    ],
  );

  if (!patient) return null;

  return (
    <FormModal
      title={title}
      open={open}
      onClose={onClose}
      cornerExitButton={false}
      data-testid="formmodal-ti1m"
      width="lg"
    >
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        onTitleChange={handleTitleChange}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        dispositionSuggester={dispositionSuggester}
        data-testid="dischargeform-xolc"
      />
    </FormModal>
  );
});
