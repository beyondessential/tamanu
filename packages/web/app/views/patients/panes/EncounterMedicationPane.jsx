import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { ButtonWithPermissionCheck, TableButtonRow, NoteBlock } from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const EncounterMedicationPane = React.memo(({ encounter, readonly }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);

  const { loadEncounter } = useEncounter();

  return (
    <TabPane data-testid="tabpane-u787">
      <MedicationModal
        open={createMedicationModalOpen}
        encounterId={encounter.id}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={async () => {
          setCreateMedicationModalOpen(false);
          await loadEncounter(encounter.id);
        }}
        data-testid="medicationmodal-s2hv"
      />
      <PrintMultipleMedicationSelectionModal
        encounter={encounter}
        open={printMedicationModalOpen}
        onClose={() => setPrintMedicationModalOpen(false)}
        data-testid="printmultiplemedicationselectionmodal-1zpq"
      />
      <TableButtonRow variant="small" data-testid="tablebuttonrow-dl51">
        <ButtonWithPermissionCheck
          onClick={() => setPrintMedicationModalOpen(true)}
          disabled={readonly}
          verb="read"
          noun="EncounterMedication"
          variant="outlined"
          color="primary"
          data-testid="buttonwithpermissioncheck-hbja"
        >
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-testid="translatedtext-1vxa"
          />
        </ButtonWithPermissionCheck>
        <NoteBlock>
          <ButtonWithPermissionCheck
            onClick={() => setCreateMedicationModalOpen(true)}
            disabled={readonly}
            verb="create"
            noun="EncounterMedication"
            data-testid="buttonwithpermissioncheck-cagj"
          >
            <TranslatedText
              stringId="medication.action.newPrescription"
              fallback="New prescription"
              data-testid="translatedtext-pikt"
            />
          </ButtonWithPermissionCheck>
        </NoteBlock>
      </TableButtonRow>
      <EncounterMedicationTable
        encounterId={encounter.id}
        data-testid="encountermedicationtable-gs0p"
      />
    </TabPane>
  );
});
