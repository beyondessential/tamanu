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
const DISCHARGE_DISPOSITION_FOR_INPATIENTS_ONLY = 'IN-';
const DISCHARGE_DISPOSITION_FOR_OUTPATIENTS_ONLY = 'OP-';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { getLocalisation } = useLocalisation();
  const allowFilterDischargeDisposition = getLocalisation('features.filterDischargeDispositions');
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');

  const dischargeDispositionFilterer = dischargeDisposition => {
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
