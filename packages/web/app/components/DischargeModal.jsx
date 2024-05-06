import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { usePatientNavigation } from '../utils/usePatientNavigation';

import { FormModal } from './FormModal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { reloadPatient } from '../store/patient';
import { getPatientStatus } from '../utils/getPatientStatus';
import { PATIENT_STATUS } from '../constants';
import { useLocalisation } from '../contexts/Localisation';

const DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY = 'AE-';
const DISCHARGE_DISPOSITION_FOR_INPATIENTS_OUTPATIENTS_ONLY = 'IN-';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { getLocalisation } = useLocalisation();
  const allowFilterDischargeDisposition = getLocalisation('features.filterDischargeDispositions');
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');

  const dischargeDispositionFilterer = dischargeDisposition => {
    // This is an emergency encounter
    if (getPatientStatus(encounter.encounterType) === PATIENT_STATUS.EMERGENCY) {
      if (
        dischargeDisposition?.code?.startsWith(
          DISCHARGE_DISPOSITION_FOR_INPATIENTS_OUTPATIENTS_ONLY,
        )
      ) {
        return false; // Do not show discharge dispositions that are only for inpatient and outpatient encounter
      }

      // Otherwise shows everything
      return true;
    }

    // This is an inpatient or outpatient encounter
    if (
      [PATIENT_STATUS.INPATIENT, PATIENT_STATUS.OUTPATIENT].includes(
        getPatientStatus(encounter.encounterType),
      )
    ) {
      if (dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY)) {
        return false; // Do not show discharge dispositions that are only for emergency encounters
      }

      // Otherwise shows everything
      return true;
    }
  };

  const dispositionSuggester = useSuggester('dischargeDisposition', {
    filterer: allowFilterDischargeDisposition ? dischargeDispositionFilterer : undefined,
  });

  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      await dispatch(reloadPatient(patient.id));
      navigateToPatient(patient.id);
      onClose();
    },
    [writeAndViewEncounter, encounter.id, dispatch, patient.id, onClose, navigateToPatient],
  );

  return (
    <FormModal title="Discharge patient" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        dispositionSuggester={dispositionSuggester}
      />
    </FormModal>
  );
});
