import React, { useCallback, useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';

import { ContentPane } from '../../../components';
import { EncounterModal } from '../../../components/EncounterModal';
import { PatientHistory } from '../../../components/PatientHistory';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';

export const HistoryPane = React.memo(({ patient, additionalData, disabled }) => {
  const [isModalOpen, setModalOpen] = useState(false);
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

  const onCloseModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <ContentPane>
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckin={() => setModalOpen(true)}
          patient={patient}
          disabled={disabled}
        />
      </ContentPane>
      <ContentPane>
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </ContentPane>
      <EncounterModal
        open={isModalOpen}
        onClose={onCloseModal}
        patient={patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
    </>
  );
});
