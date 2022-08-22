import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { useEncounter } from '../../../contexts/Encounter';

import { ContentPane } from '../../../components';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';

export const HistoryPane = React.memo(({ disabled }) => {
  const { navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);

  const { loadEncounter } = useEncounter();

  const onViewEncounter = useCallback(
    id => {
      (async () => {
        await loadEncounter(id);
        navigateToEncounter(id);
      })();
    },
    [loadEncounter, navigateToEncounter],
  );

  const onOpenCheckin = () => navigateToPatient(patient.id, 'checkin');
  const onOpenTriage = () => navigateToPatient(patient.id, 'triage');

  return (
    <>
      <ContentPane>
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckin={onOpenCheckin}
          openTriage={onOpenTriage}
          patient={patient}
          disabled={disabled}
        />
      </ContentPane>
      <ContentPane>
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </ContentPane>
    </>
  );
});
