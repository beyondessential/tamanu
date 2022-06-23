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
        await loadEncounter(id);
        dispatch(push(`/patients/${params.category}/${patient.id}/encounter/${id}`));
      })();
    },
    [loadEncounter, params.category, patient.id, dispatch],
  );

  const onOpenCheckin = () => dispatch(push(`/patients/${params.category}/${patient.id}/checkin`));
  const onOpenTriage = () => dispatch(push(`/patients/${params.category}/${patient.id}/triage`));

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
