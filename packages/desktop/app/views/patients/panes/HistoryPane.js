import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { useEncounter } from '../../../contexts/Encounter';

import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';

export const HistoryPane = connect(
  state => ({
    currentEncounter: state.patient.currentEncounter,
    patient: state.patient,
  }),
  dispatch => ({
    onOpenCheckin: () => dispatch(push('/patients/view/checkin')),
    onOpenTriage: () => dispatch(push('/patients/view/triage')),
  }),
)(
  React.memo(({ patient, currentEncounter, onOpenCheckin, onOpenTriage, disabled }) => {
    const { encounter, loadEncounter } = useEncounter();
    const onViewEncounter = useEffect(
      id => {
        (async () => {
          await loadEncounter(id, true);
        })();
      },
      [encounter, loadEncounter],
    );
    return (
      <div>
        <PatientEncounterSummary
          encounter={currentEncounter}
          viewEncounter={onViewEncounter}
          openCheckin={onOpenCheckin}
          openTriage={onOpenTriage}
          disabled={disabled}
        />
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </div>
    );
  }),
);
