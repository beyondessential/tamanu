import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';

import { Button, TranslatedText, TranslatedReferenceData, TranslatedEnum } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { PATIENT_STATUS_COLORS } from '../../../constants';
import { DateDisplay, formatShortest } from '../../../components/DateDisplay';
import { DataFetchingTable } from '../../../components/Table';

import { usePatientCurrentEncounterQuery, useFacilityQuery } from '../../../api/queries';
import { getPatientStatus } from '../../../utils/getPatientStatus';

import { ConditionalTooltip } from '../../../components/Tooltip';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../../contexts/Translation';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { MedicationModal } from '../../../components/Medication/MedicationModal';
import { MedicationDetails } from '../../../components/Medication/MedicationDetails';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { MenuButton } from '../../../components/MenuButton';
import { MedicationLabelPrintModal } from '../../../components/PatientPrinting/modals/MedicationLabelPrintModal';
import { CancelDispensedMedicationModal } from '../../../components/Medication/CancelDispensedMedicationModal';
import { getMedicationLabelData } from '../../../utils/medications';
import { useApi } from '../../../api';

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

const ONGOING_MEDICATION_COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'medication.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.medication" fallback="Medication" />
    ),
    sortable: true,
    accessor: data => (
      <CellText discontinued={data?.discontinued}>
        <TranslatedReferenceData
          fallback={data?.medication?.name}
          value={data?.medication?.id}
          category={data?.medication?.type}
        />
      </CellText>
    ),
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
      <CellText discontinued={data?.discontinued}>{`${formatShortest(data.date)}`}</CellText>
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

const DISPENSED_MEDICATION_COLUMNS = (getTranslation, getEnumTranslation, hoveredRow, setHoveredRow, handlePrintLabel, handleEdit, handleCancelClick) => [
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
    key: 'pharmacyOrderPrescription.pharmacyOrder.facility.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.facility" fallback="Facility" />
    ),
    accessor: data => data?.pharmacyOrderPrescription?.pharmacyOrder?.facility?.name ?? '',
    sortable: false,
  },
  {
    key: 'dispensedAt',
    title: (
      <TranslatedText stringId="patient.medication.table.column.dateDispensed" fallback="Date dispensed" />
    ),
    accessor: data => (
      <DateDisplay date={data?.dispensedAt} timeOnlyTooltip shortYear />
    ),
    sortable: true,
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText stringId="patient.medication.table.column.qtyDispensed" fallback="Qty dispensed" />
    ),
    sortable: false,
    accessor: data => data?.quantity,
  },
  {
    key: 'dispensedBy.displayName',
    title: (
      <TranslatedText stringId="patient.medication.table.column.dispensed" fallback="Dispensed" />
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
          action: () => handleEdit(),
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
  const { data: currentEncounter } = usePatientCurrentEncounterQuery(patient.id);
  const { data: facility } = useFacilityQuery(facilityId);
  const patientStatus = getPatientStatus(currentEncounter?.encounterType);

  const { getTranslation, getEnumTranslation } = useTranslation();

  const [ongoingPrescriptions, setOngoingPrescriptions] = useState([]);
  const [dispensedMedications, setDispensedMedications] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [allowDiscontinue, setAllowDiscontinue] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Print label modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedLabelData, setSelectedLabelData] = useState([]);

  // Cancel dispense modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDispenseId, setSelectedDispenseId] = useState(null);

  const canCreateOngoingPrescription = ability.can('create', 'Medication');
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');

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

  const handleOngoingPrescriptionClick = (_, data) => {
    const isSensitive = data?.medication?.referenceDrug?.isSensitive;
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    setSelectedMedication(data);
    setAllowDiscontinue(true);
  };

  // Dispensed medication actions
  const handlePrintLabel = useCallback((item) => {
    const { pharmacyOrderPrescription, quantity, dispensedAt, id, instructions = '' } = item;
    const prescription = pharmacyOrderPrescription?.prescription;

    const labelItems = [
      {
        id,
        medicationName: prescription?.medication?.name,
        instructions,
        quantity,
        units: prescription?.units,
        remainingRepeats: pharmacyOrderPrescription?.remainingRepeats,
        prescriberName: prescription?.prescriber?.displayName,
        requestNumber: pharmacyOrderPrescription?.displayId,
        dispensedAt,
      },
    ];

    const labelData = getMedicationLabelData({ items: labelItems, patient, facility });
    setSelectedLabelData(labelData);
    setPrintModalOpen(true);
  }, [patient, facility]);

  const handleEdit = useCallback(() => {
  }, []);

  const handleCancelClick = useCallback((dispenseId) => {
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

  const rowStyle = ({ medication }) =>
    medication?.referenceDrug?.isSensitive && !canViewSensitiveMedications
      ? 'pointer-events: none;'
      : '';

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
          {canCreateOngoingPrescription && (
            <StyledConditionalTooltip
              visible={!!currentEncounter}
              title={
                <TranslatedText
                  stringId="patient.medication.ongoing.add.warning"
                  fallback="Please add any medications via the patient active encounter."
                />
              }
              PopperProps={{
                popperOptions: {
                  positionFixed: true,
                  modifiers: {
                    preventOverflow: {
                      enabled: true,
                      boundariesElement: 'window',
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
        </TableTitle>
        <StyledDataFetchingTable
          endpoint={`/patient/${patient.id}/ongoing-prescriptions`}
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
          endpoint={`/patient/${patient.id}/dispensed-medications`}
          columns={DISPENSED_MEDICATION_COLUMNS(
            getTranslation,
            getEnumTranslation,
            hoveredRow,
            setHoveredRow,
            handlePrintLabel,
            handleEdit,
            handleCancelClick
          )}
          noDataMessage={
            <NoDataContainer>
              <TranslatedText
                stringId="patient.medication.dispensed.table.noData"
                fallback="No dispensed medications to display."
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
          $maxHeight={'320px'}
        />
      </TableContainer>
      <MedicationModal
        open={createMedicationModalOpen}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={handleSavedOngoingPrescription}
        isOngoingPrescription
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
    </Box>
  );
};
