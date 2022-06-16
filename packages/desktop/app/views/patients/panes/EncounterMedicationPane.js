import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { ContentPane } from '../../../components/ContentPane';
import { Button } from '../../../components';

export const EncounterMedicationPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <MedicationModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <EncounterMedicationTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New prescription
        </Button>
      </ContentPane>
    </div>
  );
});
