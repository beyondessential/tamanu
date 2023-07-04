import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const EncounterMedicationPane = React.memo(({ encounter, readonly }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);

  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <MedicationModal
        open={createMedicationModalOpen}
        encounterId={encounter.id}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={async () => {
          setCreateMedicationModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <PrintMultipleMedicationSelectionModal
        encounter={encounter}
        open={printMedicationModalOpen}
        onClose={() => setPrintMedicationModalOpen(false)}
      />
      <TableButtonRow variant="small">
        <ButtonWithPermissionCheck
          onClick={() => setPrintMedicationModalOpen(true)}
          disabled={readonly}
          verb="read"
          noun="EncounterMedication"
          variant="outlined"
          color="primary"
        >
          Print
        </ButtonWithPermissionCheck>
        <ButtonWithPermissionCheck
          onClick={() => setCreateMedicationModalOpen(true)}
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
