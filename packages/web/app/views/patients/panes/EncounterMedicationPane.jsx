import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

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
          data-test-id='buttonwithpermissioncheck-dn0a'>
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-test-id='translatedtext-c0kp' />
        </ButtonWithPermissionCheck>
        <ButtonWithPermissionCheck
          onClick={() => setCreateMedicationModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="EncounterMedication"
          data-test-id='buttonwithpermissioncheck-nzzw'>
          <TranslatedText
            stringId="medication.action.newPrescription"
            fallback="New prescription"
            data-test-id='translatedtext-glep' />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <EncounterMedicationTable encounterId={encounter.id} />
    </TabPane>
  );
});
