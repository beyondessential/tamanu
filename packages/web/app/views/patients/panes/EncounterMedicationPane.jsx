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
import { Colors } from '../../../constants';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { ThemedTooltip } from '../../../components/Tooltip';
import { AddMedicationIcon } from '../../../assets/icons/AddMedicationIcon';
import { useEncounterPrescriptionsQuery } from '../../../api/queries/useEncounterPrescriptionsQuery';
import { useQueryClient } from '@tanstack/react-query';
import { usePatientOngoingPrescriptionsQuery } from '../../../api/queries/usePatientOngoingPrescriptionsQuery';
import { MedicationImportModal } from '../../../components/Medication/MedicationImportModal';

const TableButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ButtonGroup = styled(Box)`
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
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);
  const [medicationImportModalOpen, setMedicationImportModalOpen] = useState(false);
  const { navigateToMar } = usePatientNavigation();
  const queryClient = useQueryClient();

  const { data: encounterPrescriptionsData } = useEncounterPrescriptionsQuery(encounter.id);
  const { data: patientOngoingPrescriptions } = usePatientOngoingPrescriptionsQuery(
    encounter.patientId,
  );
  const importableOngoingPrescriptions = patientOngoingPrescriptions?.data
    ?.map(p => p.prescription)
    ?.filter(p => !p.discontinued);
  const encounterPrescriptions = encounterPrescriptionsData?.data;
  const canImportOngoingPrescriptions = !!importableOngoingPrescriptions?.length;

  return (
    <TabPane data-testid="tabpane-u787">
      <TableContainer>
        <MedicationModal
          open={createMedicationModalOpen}
          encounterId={encounter.id}
          onClose={() => setCreateMedicationModalOpen(false)}
          onSaved={async () => {
            setCreateMedicationModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['encounter-medications', encounter.id] });
          }}
          data-testid="medicationmodal-s2hv"
        />
        <PrintMultipleMedicationSelectionModal
          encounter={encounter}
          open={printMedicationModalOpen}
          onClose={() => setPrintMedicationModalOpen(false)}
          data-testid="printmultiplemedicationselectionmodal-1zpq"
        />
        {medicationImportModalOpen && (
          <MedicationImportModal
            encounter={encounter}
            open={medicationImportModalOpen}
            onClose={() => setMedicationImportModalOpen(false)}
            data-testid="medicationimportmodal-1zpq"
          />
        )}
        <TableButtonRow data-testid="tablebuttonrow-dl51">
          <ButtonGroup gap={'16px'}>
            {!!encounterPrescriptions?.length && (
              <>
                {canImportOngoingPrescriptions && (
                  <StyledTextButton
                    disabled={readonly}
                    onClick={() => setMedicationImportModalOpen(true)}
                  >
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
                      <Box display={'flex'}>
                        <AddMedicationIcon />
                      </Box>
                    </ThemedTooltip>
                  </StyledTextButton>
                )}
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
                    <Box display={'flex'}>
                      <PrintIcon />
                    </Box>
                  </ThemedTooltip>
                </StyledTextButton>
              </>
            )}
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
          key={`${createMedicationModalOpen}-${medicationImportModalOpen}`}
          encounter={encounter}
          data-testid="encountermedicationtable-gs0p"
          canImportOngoingPrescriptions={canImportOngoingPrescriptions}
          onImportOngoingPrescriptions={() => setMedicationImportModalOpen(true)}
        />
      </TableContainer>
    </TabPane>
  );
});
