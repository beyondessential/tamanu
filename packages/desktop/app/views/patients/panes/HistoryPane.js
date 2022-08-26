import React, { useCallback, useState } from 'react';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { useEncounter } from '../../../contexts/Encounter';

import { ContentPane } from '../../../components';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';
import { EncounterModal } from '../../../components/EncounterModal';
import { TriageModal } from '../../../components/TriageModal';
import { SelectEncounterTypeModal } from '../../../components/SelectEncounterTypeModal';

const MODAL_STATES = {
  CLOSED: 'closed',
  SELECT_OPEN: 'select',
  ENCOUNTER_OPEN: 'encounter',
  TRIAGE_OPEN: 'triage',
};

export const HistoryPane = React.memo(({ patient, additionalData, disabled }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [encounterType, setEncounterType] = useState(null);
  const { navigateToEncounter } = usePatientNavigation();
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

  const onCloseModal = useCallback(() => setModalStatus(MODAL_STATES.CLOSED), []);
  const onSelectEncounterType = useCallback(value => {
    if (value === ENCOUNTER_TYPES.TRIAGE) {
      setModalStatus(MODAL_STATES.TRIAGE_OPEN);
      return;
    }

    setEncounterType(value);
    setModalStatus(MODAL_STATES.ENCOUNTER_OPEN);
  }, []);

  return (
    <>
      <ContentPane>
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckin={() => setModalStatus(MODAL_STATES.SELECT_OPEN)}
          patient={patient}
          disabled={disabled}
        />
      </ContentPane>
      <ContentPane>
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </ContentPane>
      <SelectEncounterTypeModal
        open={modalStatus === MODAL_STATES.SELECT_OPEN}
        onClose={onCloseModal}
        onSelectEncounterType={onSelectEncounterType}
      />
      <EncounterModal
        open={modalStatus === MODAL_STATES.ENCOUNTER_OPEN}
        onClose={onCloseModal}
        patientId={patient.id}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
        encounterType={encounterType}
      />
      <TriageModal
        open={modalStatus === MODAL_STATES.TRIAGE_OPEN}
        onClose={onCloseModal}
        patient={patient}
      />
    </>
  );
});
