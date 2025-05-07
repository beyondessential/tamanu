import React, { useState } from 'react';
import styled from 'styled-components';
import AddRoundedIcon from '@material-ui/icons/AddRounded';
import PrintIcon from '@material-ui/icons/Print';

import { useEncounter } from '../../../contexts/Encounter';
import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/Medication/MedicationTable';
import { Button, ButtonWithPermissionCheck, TextButton } from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors } from '../../../constants';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';

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
  const { navigateToMar } = usePatientNavigation();

  const { loadEncounter } = useEncounter();

  return (
    <TabPane data-testid="tabpane-u787">
      <TableContainer>
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
        <TableButtonRow data-testid="tablebuttonrow-dl51">
          <ButtonGroup>
            <StyledTextButton disabled={readonly}>
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
              data-testid="styledtextbutton-hbja"
            >
              <PrintIcon />
              <TranslatedText
                stringId="general.action.print"
                fallback="Print"
                data-testid="translatedtext-pikt"
              />
            </StyledTextButton>
          </ButtonGroup>
          <ButtonGroup>
            <StyledButton
              disabled={readonly}
              variant="outlined"
              color="primary"
              onClick={navigateToMar}
            >
              <TranslatedText
                stringId="medication.action.medicationAdminRecord"
                fallback="Medication admin record"
              />
            </StyledButton>
            <StyledButtonWithPermissionCheck
              onClick={() => setCreateMedicationModalOpen(true)}
              disabled={readonly}
              verb="create"
              noun="Prescription"
              data-testid="styledbuttonwithpermissioncheck-cagj"
            >
              <TranslatedText
                stringId="medication.action.newPrescription"
                fallback="New prescription"
                data-testid="translatedtext-pikt"
              />
            </StyledButtonWithPermissionCheck>
          </ButtonGroup>
        </TableButtonRow>
        <EncounterMedicationTable
          encounterId={encounter.id}
          data-testid="encountermedicationtable-gs0p"
        />
      </TableContainer>
    </TabPane>
  );
});
