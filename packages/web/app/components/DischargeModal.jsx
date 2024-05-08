import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { usePatientNavigation } from '../utils/usePatientNavigation';

import { FormModal } from './FormModal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { reloadPatient } from '../store/patient';
import { TranslatedText } from './Translation/TranslatedText';
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
    const patientStatus = getPatientStatus(encounter.encounterType);

    switch (patientStatus) {
      case PATIENT_STATUS.EMERGENCY:
        if (dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_INPATIENTS_OUTPATIENTS_ONLY)) {
          return false; // Do not show discharge dispositions that are only for emergency encounters
        }
        return true;
      case PATIENT_STATUS.INPATIENT:
      case PATIENT_STATUS.OUTPATIENT:
        if (dischargeDisposition?.code?.startsWith(DISCHARGE_DISPOSITION_FOR_EMERGENCY_ONLY)) {
          return false; // Do not show discharge dispositions that are only for emergency encounters
        }
        return true;
      default:
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
    <FormModal
      title={<TranslatedText stringId="discharge.modal.title" fallback="Discharge patient" />}
      open={open}
      onClose={onClose}
    >
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
