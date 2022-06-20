import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useEncounter } from '../../../contexts/Encounter';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';
import { useParams } from 'react-router-dom';

export const HistoryPane = React.memo(({ disabled }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const { currentEncounter } = patient;

  const { loadEncounter } = useEncounter();

  const onViewEncounter = useCallback(
    id => {
      (async () => {
        await loadEncounter(id, true, params.category);
      })();
    },
    [loadEncounter, params.category],
  );

  const onOpenCheckin = () => dispatch(push('/patients/view/checkin'));
  const onOpenTriage = () => dispatch(push('/patients/view/triage'));

  return (
    <>
      <PatientEncounterSummary
        encounter={currentEncounter}
        viewEncounter={onViewEncounter}
        openCheckin={onOpenCheckin}
        openTriage={onOpenTriage}
        patient={patient}
        disabled={disabled}
      />
      <PatientHistory patient={patient} onItemClick={onViewEncounter} />
    </>
  );
});
