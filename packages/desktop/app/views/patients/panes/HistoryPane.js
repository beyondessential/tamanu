import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { useEncounter } from '../../../contexts/Encounter';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';

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

  const onOpenCheckin = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/checkin`));
  const onOpenTriage = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/triage`));

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
