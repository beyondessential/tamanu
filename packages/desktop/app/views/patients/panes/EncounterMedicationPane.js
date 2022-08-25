import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const EncounterMedicationPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <MedicationModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <TableButtonRow variant="small">
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="EncounterMedication"
        >
          New prescription
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <EncounterMedicationTable encounterId={encounter.id} />
    </TabPane>
  );
});
