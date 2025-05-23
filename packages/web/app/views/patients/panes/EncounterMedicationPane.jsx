import React, { useState } from 'react';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import { Box } from '@mui/material';

import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/Medication/MedicationTable';
import { Button, ButtonWithPermissionCheck, TextButton } from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors, PRESCRIPTION_TYPES } from '../../../constants';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { PrescriptionTypeModal } from '../../../components/Medication/PrescriptionTypeModal';
import { MedicationSetModal } from '../../../components/Medication/MedicationSetModal';
import { ThemedTooltip } from '../../../components/Tooltip';
import { AddMedicationIcon } from '../../../assets/icons/AddMedicationIcon';
import { useEncounter } from '../../../contexts/Encounter';

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
    width: 20px;
    height: 20px;
    vertical-align: middle;
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
  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);
  const { navigateToMar } = usePatientNavigation();
  const [prescriptionTypeModalOpen, setPrescriptionTypeModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [prescriptionType, setPrescriptionType] = useState(null);
  const { loadEncounter } = useEncounter();

  const handleContinue = prescriptionType => {
    setPrescriptionType(prescriptionType);
    setPrescriptionTypeModalOpen(false);
  };

  return (
    <TabPane data-testid="tabpane-u787">
      <TableContainer>
        <PrescriptionTypeModal
          open={prescriptionTypeModalOpen}
          onClose={() => setPrescriptionTypeModalOpen(false)}
          onContinue={handleContinue}
        />
        {prescriptionType === PRESCRIPTION_TYPES.MEDICATION_SET && (
          <MedicationSetModal
            open={true}
            onClose={() => setPrescriptionType(null)}
            openPrescriptionTypeModal={() => setPrescriptionTypeModalOpen(true)}
            onReloadTable={() => setRefreshCount(refreshCount + 1)}
          />
        )}
        <MedicationModal
          open={prescriptionType === PRESCRIPTION_TYPES.SINGLE_MEDICATION}
          encounterId={encounter.id}
          onClose={() => setPrescriptionType(null)}
          onSaved={async () => {
            setPrescriptionType(null);
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
              <ThemedTooltip
                title={
                  <Box width="147px" fontWeight={400}>
                    <TranslatedText
                      stringId="medication.action.addOngoingMedications.tooltip"
                      fallback="Add existing ongoing medication to encounter"
                    />
                  </Box>
                }
              >
                <div>
                  <AddMedicationIcon />
                </div>
              </ThemedTooltip>
            </StyledTextButton>
            <div />
            <StyledTextButton
              onClick={() => setPrintMedicationModalOpen(true)}
              disabled={readonly}
              color="primary"
              data-testid="styledtextbutton-hbja"
            >
              <ThemedTooltip
                title={
                  <Box width="60px" fontWeight={400}>
                    <TranslatedText
                      stringId="medication.action.printPrescription"
                      fallback="Print prescription"
                    />
                  </Box>
                }
              >
                <div>
                  <PrintIcon />
                </div>
              </ThemedTooltip>
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
              onClick={() => setPrescriptionTypeModalOpen(true)}
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
          onReloadTable={() => setRefreshCount(refreshCount + 1)}
          refreshCount={refreshCount}
          data-testid="encountermedicationtable-gs0p"
        />
      </TableContainer>
    </TabPane>
  );
});
