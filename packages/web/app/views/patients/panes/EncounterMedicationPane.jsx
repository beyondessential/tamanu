import React, { useState } from 'react';
import styled from 'styled-components';
import AddRoundedIcon from '@material-ui/icons/AddRounded';
import PrintIcon from '@material-ui/icons/Print';

import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/MedicationTable';
import { Button, ButtonWithPermissionCheck, TextButton } from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors } from '../../../constants';

const TableButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const StyledTextButton = styled(TextButton)`
  font-size: 12px;
  font-weight: 500;
  .MuiSvgIcon-root {
    margin-right: 4px;
    width: 16px;
    height: 16px;
  }
`;

const StyledButton = styled(Button)`
  font-size: 12px;
  height: 36px;
`;

const StyledButtonWithPermissionCheck = styled(ButtonWithPermissionCheck)`
  font-size: 12px;
  height: 36px;
`;

const TableContainer = styled.div`
  border: 1px solid ${Colors.outline};
  padding: 8px 10px;
  border-radius: 3px;
`;

export const EncounterMedicationPane = React.memo(({ encounter, readonly }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);

  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <TableContainer>
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
      <TableButtonRow>
        <ButtonGroup>
          <StyledTextButton
            disabled={readonly}
          >
            <AddRoundedIcon />
            <TranslatedText
              stringId="medication.action.addOngoingMedications"
              fallback="Add ongoing medications"
            />
          </StyledTextButton>
          <div />
          <StyledTextButton
            onClick={() => setPrintMedicationModalOpen(true)}
            disabled={readonly}
            color="primary"
          >
            <PrintIcon />
            <TranslatedText stringId="general.action.print" fallback="Print" />
          </StyledTextButton>
        </ButtonGroup>
        <ButtonGroup>
          <StyledButton
            disabled={readonly}
            variant="outlined"
            color="primary"
          >
            <TranslatedText stringId="medication.action.medicationAdminRecord" fallback="Medication admin record" />
          </StyledButton>
          <StyledButtonWithPermissionCheck
            onClick={() => setCreateMedicationModalOpen(true)}
            disabled={readonly}
            verb="create"
            noun="Prescription"
          >
            <TranslatedText
              stringId="medication.action.newPrescription"
              fallback="New prescription"
            />
          </StyledButtonWithPermissionCheck>
        </ButtonGroup>
      </TableButtonRow>
      <EncounterMedicationTable encounterId={encounter.id} />
      </TableContainer>
    </TabPane>
  );
});
