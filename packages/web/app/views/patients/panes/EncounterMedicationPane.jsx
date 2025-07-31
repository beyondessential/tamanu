import React, { useState } from 'react';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import ShoppingCart from '@material-ui/icons/ShoppingCart';
import { Box } from '@mui/material';

import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { PharmacyOrderModal } from '../../../components/Medication/PharmacyOrderModal';
import { PrintMultipleMedicationSelectionModal } from '../../../components/PatientPrinting';
import { EncounterMedicationTable } from '../../../components/Medication/MedicationTable';
import {
  ButtonWithPermissionCheck,
  NoteModalActionBlocker,
  Button,
  TextButton,
} from '../../../components';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors, PRESCRIPTION_TYPES } from '../../../constants';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { PrescriptionTypeModal } from '../../../components/Medication/PrescriptionTypeModal';
import { MedicationSetModal } from '../../../components/Medication/MedicationSetModal';
import { ThemedTooltip } from '../../../components/Tooltip';
import { AddMedicationIcon } from '../../../assets/icons/AddMedicationIcon';
import { usePatientOngoingPrescriptionsQuery } from '../../../api/queries/usePatientOngoingPrescriptionsQuery';
import { MedicationImportModal } from '../../../components/Medication/MedicationImportModal';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { useSuggestionsQuery } from '../../../api/queries/useSuggestionsQuery';
import { useAuth } from '../../../contexts/Auth';
import { ENCOUNTER_TAB_NAMES } from '../../../constants/encounterTabNames';
import { useSettings } from '../../../contexts/Settings';

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
  const { ability } = useAuth();
  const { getSetting } = useSettings();

  const pharmacyOrderEnabled = getSetting('features.pharmacyOrder.enabled');

  const [printMedicationModalOpen, setPrintMedicationModalOpen] = useState(false);
  const [pharmacyOrderModalOpen, setPharmacyOrderModalOpen] = useState(false);
  const [medicationImportModalOpen, setMedicationImportModalOpen] = useState(false);
  const [refreshEncounterMedications, setRefreshEncounterMedications] = useState(0);
  const { navigateToMar, navigateToEncounter } = usePatientNavigation();
  const [prescriptionTypeModalOpen, setPrescriptionTypeModalOpen] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState(null);

  const { data: medicationSets, isLoading: medicationSetsLoading } = useSuggestionsQuery(
    'medicationSet',
  );

  const handleContinue = prescriptionType => {
    setPrescriptionType(prescriptionType);
    setPrescriptionTypeModalOpen(false);
  };

  const handleNewPrescription = () => {
    if (!medicationSets?.length) {
      setPrescriptionType(PRESCRIPTION_TYPES.SINGLE_MEDICATION);
      return;
    }
    setPrescriptionTypeModalOpen(true);
  };

  const { data: encounterPrescriptionsData } = useEncounterMedicationQuery(encounter.id);
  const { data: patientOngoingPrescriptions } = usePatientOngoingPrescriptionsQuery(
    encounter.patientId,
  );

  const importableOngoingPrescriptions = patientOngoingPrescriptions?.data?.filter(
    p => !p.discontinued,
  );
  const encounterPrescriptions = encounterPrescriptionsData?.data;
  const canOrderPrescription = ability.can('read', 'Medication');
  const canCreatePrescription = ability.can('create', 'Medication');
  const canImportOngoingPrescriptions =
    !!importableOngoingPrescriptions?.length && !encounter.endDate;
  const canAccessMar = ability.can('read', 'MedicationAdministration');

  const handleNavigateToMar = () => {
    // Navigate to the medication tab first to ensure it will be back to the same tab after navigating to the MAR
    navigateToEncounter(encounter.id, { tab: ENCOUNTER_TAB_NAMES.MEDICATION }, true);
    navigateToMar();
  };

  return (
    <TabPane data-testid="tabpane-u787">
      <TableContainer>
        {prescriptionTypeModalOpen && (
          <PrescriptionTypeModal
            open
            onClose={() => setPrescriptionTypeModalOpen(false)}
            onContinue={handleContinue}
          />
        )}
        {prescriptionType === PRESCRIPTION_TYPES.MEDICATION_SET && (
          <MedicationSetModal
            open
            onClose={() => setPrescriptionType(null)}
            openPrescriptionTypeModal={() => setPrescriptionTypeModalOpen(true)}
            onReloadTable={() => setRefreshEncounterMedications(prev => prev + 1)}
          />
        )}
        <MedicationModal
          open={prescriptionType === PRESCRIPTION_TYPES.SINGLE_MEDICATION}
          encounterId={encounter.id}
          onClose={() => setPrescriptionType(null)}
          onSaved={async () => {
            setPrescriptionType(null);
            setRefreshEncounterMedications(prev => prev + 1);
          }}
          data-testid="medicationmodal-s2hv"
        />
        <PharmacyOrderModal
          encounter={encounter}
          open={pharmacyOrderModalOpen}
          onClose={() => setPharmacyOrderModalOpen(false)}
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
            onSaved={() => {
              setRefreshEncounterMedications(prev => prev + 1);
            }}
            data-testid="medicationimportmodal-1zpq"
          />
        )}
        <TableButtonRow data-testid="tablebuttonrow-dl51">
          <ButtonGroup gap={'16px'}>
            {!!encounterPrescriptions?.length && (
              <>
                {canImportOngoingPrescriptions && canCreatePrescription && (
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
                {canOrderPrescription && (
                  <>
                    <NoteModalActionBlocker>
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
                    </NoteModalActionBlocker>
                    {pharmacyOrderEnabled && (
                      <NoteModalActionBlocker>
                        <StyledTextButton
                          onClick={() => setPharmacyOrderModalOpen(true)}
                          disabled={readonly}
                          color="primary"
                          data-testid="styledtextbutton-uhgj"
                        >
                          <ThemedTooltip
                            title={
                              <Box width="60px" fontWeight={400}>
                                <TranslatedText
                                  stringId="medication.action.pharmacyOrder"
                                  fallback="Order medication from pharmacy"
                                />
                              </Box>
                            }
                          >
                            <Box display={'flex'}>
                              <ShoppingCart />
                            </Box>
                          </ThemedTooltip>
                        </StyledTextButton>
                      </NoteModalActionBlocker>
                    )}
                  </>
                )}
              </>
            )}
          </ButtonGroup>
          <ButtonGroup>
            {canAccessMar && (
              <StyledButton
                disabled={readonly}
                variant="outlined"
                color="primary"
                onClick={handleNavigateToMar}
              >
                <TranslatedText
                  stringId="medication.action.medicationAdminRecord"
                  fallback="Medication admin record"
                />
              </StyledButton>
            )}
            {canCreatePrescription && (
              <NoteModalActionBlocker>
                <StyledButtonWithPermissionCheck
                  onClick={handleNewPrescription}
                  disabled={readonly || medicationSetsLoading}
                  verb="create"
                  noun="Medication"
                  data-testid="styledbuttonwithpermissioncheck-cagj"
                  isLoading={medicationSetsLoading}
                >
                  <TranslatedText
                    stringId="medication.action.newPrescription"
                    fallback="New prescription"
                    data-testid="translatedtext-pikt"
                  />
                </StyledButtonWithPermissionCheck>
              </NoteModalActionBlocker>
            )}
          </ButtonGroup>
        </TableButtonRow>
        <EncounterMedicationTable
          key={refreshEncounterMedications}
          encounter={encounter}
          data-testid="encountermedicationtable-gs0p"
          canImportOngoingPrescriptions={canImportOngoingPrescriptions}
          onImportOngoingPrescriptions={() => setMedicationImportModalOpen(true)}
        />
      </TableContainer>
    </TabPane>
  );
});
