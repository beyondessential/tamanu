import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';

import {
  Button,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  DateDisplay,
  useDateTime,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { PATIENT_STATUS_COLORS } from '../../../constants';
import { DataFetchingTable } from '../../../components/Table';

import { usePatientCurrentEncounterQuery, useFacilityQuery } from '../../../api/queries';
import { getPatientStatus } from '../../../utils/getPatientStatus';

import { ConditionalTooltip, ThemedTooltip } from '../../../components/Tooltip';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../../contexts/Translation';
import { DRUG_ROUTE_LABELS, DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { MedicationDetails } from '../../../components/Medication/MedicationDetails';
import { PharmacyOrderModal } from '../../../components/Medication/PharmacyOrderModal';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { MenuButton } from '../../../components/MenuButton';
import { MedicationLabelPrintModal } from '../../../components/PatientPrinting/modals/MedicationLabelPrintModal';
import { CancelDispensedMedicationModal } from '../../../components/Medication/CancelDispensedMedicationModal';
import { EditMedicationDispenseModal } from '../../../components/Medication/EditMedicationDispenseModal';
import { DispensedMedicationDetailsModal } from '../../../components/Medication/DispensedMedicationDetailsModal';
import { getMedicationLabelData, getTranslatedMedicationName } from '../../../utils/medications';
import { useApi } from '../../../api';
import { SendToPharmacyIcon } from '../../../assets/icons/SendToPharmacyIcon';
import { useSettings } from '../../../contexts/Settings';
import { trimToDate } from '@tamanu/utils/dateTime';

const NotifyBanner = styled(Box)`
  padding: 13px 22px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background-color: ${Colors.white};
  font-size: 14px;
  font-weight: 400;
  color: ${Colors.darkestText};
  position: relative;
  margin-top: 10px;
  margin-bottom: -10px;
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 10px;
    height: calc(100% + 2px);
    background-color: ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
    border-radius: 5px 0 0 5px;
  }
`;

const TableContainer = styled(Box)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  margin-top: 20px;
`;

const TableTitle = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.outline};
`;

const TableTitleText = styled(Box)`
  font-size: 16px;
  font-weight: 500;
  line-height: 21px;
  color: ${Colors.darkestText};
`;

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  .MuiTooltip-tooltip {
    max-width: 180px;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 400;
  }
`;

const ButtonGroup = styled(Box)`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const SendToPharmacyButton = styled.div`
  cursor: pointer;
  ${props => props.disabled && 'opacity: 0.3; cursor: default;'}
`;
const NoMedicationTooltip = styled(ConditionalTooltip)`
  width: fit-content;
  .MuiTooltip-tooltip {
    max-width: 150px;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 400;
  }
`;

const NoDataContainer = styled.div`
  height: 230px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 20px;
  margin-bottom: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

const CellText = styled.div`
  text-decoration: ${props => (props.discontinued ? 'line-through' : 'none')};
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  padding-left: 20px;
  padding-right: 20px;
  border: none;
  box-shadow: none;
  max-height: ${props => (props.$noData ? '270px' : props.$maxHeight)};
  .MuiTableHead-root {
    ${props => props.$noData && 'display: none;'}
    .MuiTableRow-root .MuiTableCell-head {
      &:first-child {
        padding-left: 10px;
      }
      background-color: ${Colors.white};
      padding-top: 8px;
      padding-bottom: 8px;
      font-weight: 400;
      color: ${Colors.midText};
      position: sticky;
      top: 0;
      z-index: 1;
      & .MuiTableSortLabel-root {
        color: ${Colors.midText};
      }
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root .MuiTableCell-body {
      &:first-child {
        padding-left: ${props => (props.$noData ? '0' : '10px')};
      }
      ${props => props.$compact && 'padding-top: 11px; padding-bottom: 11px;'}
      ${props => props.$noData && 'padding: 0;'}
    }
    .MuiTableRow-root:last-child .MuiTableCell-body {
      border-bottom: none;
    }
    .MuiTableRow-root {
      cursor: ${props => (props.$noData ? 'default' : 'pointer')};
      &:hover {
        background-color: ${props => (props.$noData ? 'transparent' : Colors.veryLightBlue)};
      }
    }
  }
  .MuiTableFooter-root {
    position: sticky;
    bottom: 0;
    background-color: ${Colors.white};
    .MuiPagination-root {
      padding-top: 10px;
      padding-bottom: 10px;
    }
    td {
      border-top: 1px solid ${Colors.outline};
    }
  }
`;

const isUnavailableAtFacility = medication =>
  medication?.referenceDrug?.facilities?.[0]?.stockStatus === DRUG_STOCK_STATUSES.UNAVAILABLE;

const ONGOING_MEDICATION_COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: true,
    accessor: data => {
      return (
        <NoMedicationTooltip
          visible={isUnavailableAtFacility(data?.medication)}
          title={
            <TranslatedText
              stringId="patient.medication.unavailable.tooltip"
              fallback="This medication is not available at this facility"
            />
          }
        >
          <CellText discontinued={data?.discontinued}>
            <TranslatedReferenceData
              fallback={data?.medication?.name}
              value={data?.medication?.id}
              category={data?.medication?.type}
            />
          </CellText>
        </NoMedicationTooltip>
      );
    },
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="patient.medication.table.column.dose" fallback="Dose" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        {getMedicationDoseDisplay(data, getTranslation, getEnumTranslation)}
        {data.isPrn && ` ${getTranslation('patient.medication.table.prn', 'PRN')}`}
      </CellText>
    ),
    sortable: false,
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText stringId="patient.medication.table.column.frequency" fallback="Frequency" />
    ),
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        {data.frequency ? getTranslatedFrequency(data.frequency, getTranslation) : ''}
      </CellText>
    ),
    sortable: false,
  },
  {
    key: 'route',
    title: <TranslatedText stringId="patient.medication.table.column.route" fallback="Route" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        <TranslatedEnum value={data.route} enumValues={DRUG_ROUTE_LABELS} />
      </CellText>
    ),
    sortable: true,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="patient.medication.table.column.date" fallback="Date" />,
    accessor: data => (
      <CellText discontinued={data?.discontinued}><DateDisplay date={trimToDate(data.date)} format="shortest" /></CellText>
    ),
    sortable: true,
  },
  {
    key: 'prescriber.displayName',
    title: (
      <TranslatedText stringId="patient.medication.table.column.prescriber" fallback="Prescriber" />
    ),
    accessor: data => (
      <CellText discontinued={data?.discontinued}>{data?.prescriber?.displayName ?? ''}</CellText>
    ),
    sortable: true,
  },
];

const DISPENSED_MEDICATION_COLUMNS = (
  getTranslation,
  getEnumTranslation,
  hoveredRow,
  setHoveredRow,
  handlePrintLabel,
  handleEdit,
  handleCancelClick,
) => [
  {
    key: 'pharmacyOrderPrescription.prescription.medication.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: true,
    accessor: data => (
      <TranslatedReferenceData
        fallback={data?.pharmacyOrderPrescription?.prescription?.medication?.name}
        value={data?.pharmacyOrderPrescription?.prescription?.medication?.id}
        category={data?.pharmacyOrderPrescription?.prescription?.medication?.type}
      />
    ),
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="patient.medication.table.column.dose" fallback="Dose" />,
    accessor: data => {
      const prescription = data?.pharmacyOrderPrescription?.prescription;
      if (!prescription) return '';
      return (
        <>
          {getMedicationDoseDisplay(prescription, getTranslation, getEnumTranslation)}
          {prescription.isPrn && ` ${getTranslation('patient.medication.table.prn', 'PRN')}`}
        </>
      );
    },
    sortable: false,
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText stringId="patient.medication.table.column.frequency" fallback="Frequency" />
    ),
    accessor: data => {
      const frequency = data?.pharmacyOrderPrescription?.prescription?.frequency;
      return frequency ? getTranslatedFrequency(frequency, getTranslation) : '';
    },
    sortable: false,
  },
  {
    key: 'dispensedAt',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.dateDispensed"
        fallback="Date dispensed"
      />
    ),
    accessor: data => <DateDisplay date={data?.dispensedAt} timeOnlyTooltip shortYear />,
    sortable: true,
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.qtyDispensed"
        fallback="Qty dispensed"
      />
    ),
    sortable: false,
    accessor: data => data?.quantity,
  },
  {
    key: 'dispensedBy.displayName',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.dispensedBy"
        fallback="Dispensed by"
      />
    ),
    accessor: data => data?.dispensedBy?.displayName ?? '',
    sortable: true,
  },
  {
    key: 'actions',
    title: '',
    allowExport: false,
    accessor: row => {
      const actions = [
        {
          label: <TranslatedText stringId="general.action.printLabel" fallback="Print label" />,
          action: () => handlePrintLabel(row),
        },
        {
          label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
          action: () => handleEdit(row),
        },
        {
          label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
          action: () => handleCancelClick(row.id),
        },
      ];
      return (
        <div onMouseEnter={() => hoveredRow !== row && setHoveredRow(row.id)}>
          <MenuButton actions={actions} />
        </div>
      );
    },
    sortable: false,
    dontCallRowInput: true,
  },
];

export const PatientMedicationPane = ({ patient }) => {
  const api = useApi();
  const { ability, facilityId } = useAuth();
  const { getSetting } = useSettings();
  const { data: currentEncounter } = usePatientCurrentEncounterQuery(patient.id);
  const { data: facility } = useFacilityQuery(facilityId);
  const patientStatus = getPatientStatus(currentEncounter?.encounterType);

  const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { getCurrentDateTime } = useDateTime();

  const [ongoingPrescriptions, setOngoingPrescriptions] = useState([]);
  const [dispensedMedications, setDispensedMedications] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [sendToPharmacyModalOpen, setSendToPharmacyModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [allowDiscontinue, setAllowDiscontinue] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Print label modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedLabelData, setSelectedLabelData] = useState([]);

  // Cancel dispense modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDispenseId, setSelectedDispenseId] = useState(null);

  // Edit dispense modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDispense, setSelectedDispense] = useState(null);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const canCreateOngoingPrescription = ability.can('create', 'Medication');
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');
  const pharmacyOrderEnabled = getSetting('features.pharmacyOrder.enabled');
  const canRequestPharmacyOrder = ability.can('create', 'MedicationRequest');
  const canReadDispensedMedications = ability.can('read', 'MedicationDispense');

  // Filter active (non-discontinued) ongoing prescriptions for send to pharmacy
  const activeOngoingPrescriptions = ongoingPrescriptions.filter(p => !p.discontinued);

  const onOngoingPrescriptionsFetched = useCallback(({ data }) => {
    setOngoingPrescriptions(data);
  }, []);

  const onDispensedMedicationsFetched = useCallback(({ data }) => {
    setDispensedMedications(data);
  }, []);

  const handleSavedOngoingPrescription = () => {
    setRefreshCount(prev => prev + 1);
    setCreateMedicationModalOpen(false);
  };

  const handleReloadOngoingPrescriptions = () => {
    setRefreshCount(prev => prev + 1);
    setSelectedMedication(null);
  };

  const handleSendToPharmacySubmit = () => {
    setRefreshCount(prev => prev + 1);
  };

  const handleOngoingPrescriptionClick = (_, data) => {
    const isSensitive = data?.medication?.referenceDrug?.isSensitive;
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    if (isUnavailableAtFacility(data?.medication)) {
      return;
    }
    setSelectedMedication(data);
    setAllowDiscontinue(true);
  };

  // Dispensed medication actions
  const handlePrintLabel = useCallback(
    item => {
      const { pharmacyOrderPrescription, quantity, dispensedAt, id, instructions = '' } = item;
      const prescription = pharmacyOrderPrescription?.prescription;

      const medication = prescription?.medication;
      const labelItems = [
        {
          id,
          medicationName: getTranslatedMedicationName(medication, getReferenceDataTranslation),
          instructions,
          quantity,
          units: prescription?.units,
          remainingRepeats: pharmacyOrderPrescription?.remainingRepeats,
          prescriberName: prescription?.prescriber?.displayName,
          requestNumber: pharmacyOrderPrescription?.displayId,
          dispensedAt,
        },
      ];

      const labelData = getMedicationLabelData({ items: labelItems, patient, facility, currentDateTime: getCurrentDateTime() });
      setSelectedLabelData(labelData);
      setPrintModalOpen(true);
    },
    [patient, facility, getReferenceDataTranslation, getCurrentDateTime],
  );

  const handleEdit = useCallback(dispense => {
    setSelectedDispense(dispense);
    setIsEditModalOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedDispense(null);
  }, []);

  const handleEditConfirm = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedDispense(null);
    // Trigger table refresh
    setRefreshCount(prev => prev + 1);
  }, []);

  const handleCancelClick = useCallback(dispenseId => {
    setSelectedDispenseId(dispenseId);
    setIsCancelModalOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    await api.delete(`medication/medication-dispenses/${selectedDispenseId}`);
    setIsCancelModalOpen(false);
    setSelectedDispenseId(null);
    // Trigger table refresh
    setRefreshCount(prev => prev + 1);
  }, [api, selectedDispenseId]);

  const handleCancelCancel = useCallback(() => {
    setIsCancelModalOpen(false);
    setSelectedDispenseId(null);
  }, []);

  const handleDispensedMedicationClick = useCallback(
    (_, dispenseData) => {
      const {
        id,
        pharmacyOrderPrescription,
        quantity,
        instructions,
        dispensedAt,
        dispensedBy,
      } = dispenseData;
      const mappedItem = {
        id,
        displayId: pharmacyOrderPrescription?.displayId,
        quantity,
        instructions,
        remainingRepeats: pharmacyOrderPrescription?.remainingRepeats,
        dispensedAt,
        dispensedBy,
        prescription: {
          date: pharmacyOrderPrescription?.prescription?.date,
          medication: pharmacyOrderPrescription?.prescription?.medication,
        },
        patient,
      };
      setSelectedDetailItem(mappedItem);
      setIsDetailModalOpen(true);
    },
    [patient],
  );

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedDetailItem(null);
  }, []);

  const rowStyle = ({ medication }) => `
    ${
      medication?.referenceDrug?.isSensitive && !canViewSensitiveMedications
        ? 'pointer-events: none;'
        : ''
    }
    ${isUnavailableAtFacility(medication) ? 'opacity: 0.5; cursor: default !important;' : ''}
  `;

  const handleSendToPharmacyClick = () => {
    if (currentEncounter) {
      return;
    }
    setSendToPharmacyModalOpen(true);
  };

  return (
    <Box px={2.5} pb={2.5} overflow={'auto'}>
      {currentEncounter && (
        <NotifyBanner patientStatus={patientStatus}>
          <TranslatedText
            stringId="patient.medication.warning.activeEncounter"
            fallback="This patient has an active encounter and these ongoing medications may change on discharge."
          />
        </NotifyBanner>
      )}
      <TableContainer>
        <TableTitle py={1.5} mx={2.5}>
          <TableTitleText>
            <TranslatedText
              stringId="patient.medication.ongoing.title"
              fallback="Ongoing medications"
            />
          </TableTitleText>
          <ButtonGroup>
            {pharmacyOrderEnabled &&
              canRequestPharmacyOrder &&
              activeOngoingPrescriptions.length > 0 && (
                <ThemedTooltip
                  PopperProps={{
                    popperOptions: {
                      positionFixed: true,
                      modifiers: {
                        flip: {
                          enabled: false,
                        },
                        preventOverflow: {
                          enabled: false,
                        },
                      },
                    },
                  }}
                  title={
                    !currentEncounter ? (
                      <Box width="120px" fontWeight={400}>
                        <TranslatedText
                          stringId="patient.medication.ongoing.sendToPharmacy.tooltip"
                          fallback="Send to pharmacy"
                        />
                      </Box>
                    ) : (
                      <Box width="150px" fontWeight={400}>
                        <TranslatedText
                          stringId="patient.medication.ongoing.sendToPharmacy.activeEncounter.tooltip"
                          fallback="Please send to pharmacy via the patient active encounter"
                        />
                      </Box>
                    )
                  }
                >
                  <SendToPharmacyButton
                    disabled={!!currentEncounter}
                    onClick={handleSendToPharmacyClick}
                  >
                    <SendToPharmacyIcon />
                  </SendToPharmacyButton>
                </ThemedTooltip>
              )}
            {canCreateOngoingPrescription && (
              <StyledConditionalTooltip
                visible={!!currentEncounter}
                title={
                  <TranslatedText
                    stringId="patient.medication.ongoing.add.activeEncounter.tooltip"
                    fallback="Please add any medications via the patient active encounter"
                  />
                }
                PopperProps={{
                  popperOptions: {
                    positionFixed: true,
                    modifiers: {
                      flip: {
                        enabled: false,
                      },
                      preventOverflow: {
                        enabled: false,
                      },
                    },
                  },
                }}
              >
                <NoteModalActionBlocker>
                  <Button
                    disabled={!!currentEncounter}
                    onClick={() => setCreateMedicationModalOpen(true)}
                  >
                    <TranslatedText
                      stringId="patient.medication.ongoing.add"
                      fallback="Add ongoing medication"
                    />
                  </Button>
                </NoteModalActionBlocker>
              </StyledConditionalTooltip>
            )}
          </ButtonGroup>
        </TableTitle>
        <StyledDataFetchingTable
          endpoint={`/patient/${patient.id}/ongoing-prescriptions`}
          fetchOptions={{ facilityId }}
          columns={ONGOING_MEDICATION_COLUMNS(getTranslation, getEnumTranslation)}
          rowStyle={rowStyle}
          noDataMessage={
            <NoDataContainer>
              <TranslatedText
                stringId="patient.medication.ongoing.table.noData"
                fallback="No ongoing medications to display."
              />
            </NoDataContainer>
          }
          allowExport={false}
          onDataFetched={onOngoingPrescriptionsFetched}
          $noData={ongoingPrescriptions.length === 0}
          refreshCount={refreshCount}
          onClickRow={handleOngoingPrescriptionClick}
          $maxHeight={'320px'}
        />
      </TableContainer>
      {canReadDispensedMedications && (
        <TableContainer>
          <TableTitle py={2} mx={2.5}>
            <TableTitleText>
              <TranslatedText
                stringId="patient.medication.dispensed.title"
                fallback="Dispensed medications"
              />
            </TableTitleText>
          </TableTitle>
          <StyledDataFetchingTable
            $compact
            endpoint={`/patient/${patient.id}/dispensed-medications`}
            columns={DISPENSED_MEDICATION_COLUMNS(
              getTranslation,
              getEnumTranslation,
              hoveredRow,
              setHoveredRow,
              handlePrintLabel,
              handleEdit,
              handleCancelClick,
            )}
            noDataMessage={
              <NoDataContainer>
                <TranslatedText
                  stringId="patient.medication.dispensed.table.noData"
                  fallback="This patient has no dispensed medications to display."
                />
              </NoDataContainer>
            }
            allowExport={false}
            onDataFetched={onDispensedMedicationsFetched}
            $noData={dispensedMedications.length === 0}
            refreshCount={refreshCount}
            initialSort={{
              orderBy: 'dispensedAt',
              order: 'desc',
            }}
            onClickRow={handleDispensedMedicationClick}
            $maxHeight={'320px'}
          />
        </TableContainer>
      )}
      <MedicationModal
        open={createMedicationModalOpen}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={handleSavedOngoingPrescription}
        isOngoingPrescription
      />
      <PharmacyOrderModal
        patient={patient}
        ongoingPrescriptions={activeOngoingPrescriptions}
        open={sendToPharmacyModalOpen}
        onClose={() => setSendToPharmacyModalOpen(false)}
        onSubmit={handleSendToPharmacySubmit}
      />
      {selectedMedication && (
        <MedicationDetails
          initialMedication={selectedMedication}
          onClose={() => setSelectedMedication(null)}
          isOngoingPrescription
          onReloadTable={handleReloadOngoingPrescriptions}
          allowDiscontinue={allowDiscontinue}
        />
      )}
      <MedicationLabelPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        labels={selectedLabelData}
      />
      <CancelDispensedMedicationModal
        open={isCancelModalOpen}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
      />
      {isEditModalOpen && (
        <EditMedicationDispenseModal
          open
          medicationDispense={selectedDispense}
          patient={patient}
          onClose={handleEditCancel}
          onConfirm={handleEditConfirm}
        />
      )}
      <DispensedMedicationDetailsModal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        item={selectedDetailItem}
      />
    </Box>
  );
};
