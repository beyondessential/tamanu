import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { SearchTableWithPermissionCheck } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { useMedicationsContext } from '../contexts/Medications';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { MEDICATIONS_SEARCH_KEYS } from '../constants/medication';
import { Colors } from '../constants';
import { MenuButton } from './MenuButton';
import { TranslatedReferenceData, useDateTimeFormat } from '@tamanu/ui-components';
import { MedicationLabelPrintModal } from './PatientPrinting/modals/MedicationLabelPrintModal';
import { getMedicationLabelData } from '../utils/medications';
import { useFacilityQuery } from '../api/queries/useFacilityQuery';
import { useApi } from '../api';
import { CancelDispensedMedicationModal } from './Medication/CancelDispensedMedicationModal';
import { EditMedicationDispenseModal } from './Medication/EditMedicationDispenseModal';
import { DispensedMedicationDetailsModal } from './Medication/DispensedMedicationDetailsModal';

const NoDataContainer = styled.div`
  height: 500px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

const StyledSearchTableWithPermissionCheck = styled(SearchTableWithPermissionCheck)`
  .MuiTableCell-body {
    height: 57px;
    padding: ${props => (props.$noData ? '20px 25px' : '10px 15px')};
    &:last-child {
      padding-right: 20px;
    }
    &:first-child {
      padding-left: 20px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: pointer;
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

const getPatientDisplayId = ({ pharmacyOrderPrescription }) =>
  pharmacyOrderPrescription?.pharmacyOrder?.encounter?.patient?.displayId;
const getPatientName = ({ pharmacyOrderPrescription }) => (
  <PatientNameDisplay patient={pharmacyOrderPrescription?.pharmacyOrder?.encounter?.patient} />
);
const getMedication = ({ pharmacyOrderPrescription }) => (
  <TranslatedReferenceData
    fallback={pharmacyOrderPrescription?.prescription?.medication?.name}
    value={pharmacyOrderPrescription?.prescription?.medication?.id}
    category={pharmacyOrderPrescription?.prescription?.medication?.type}
  />
);
const getDateDispensed = ({ dispensedAt }) => (
  <DateDisplay date={dispensedAt} timeOnlyTooltip shortYear data-testid="datedisplay-date-sent" />
);
const getQuantity = ({ quantity }) => quantity;
const getDispensedBy = ({ dispensedBy }) => dispensedBy?.displayName;
const getRequestNumber = ({ pharmacyOrderPrescription }) => pharmacyOrderPrescription?.displayId;

export const MedicationDispensesTable = () => {
  const api = useApi();
  const { ability, facilityId } = useAuth();
  const { searchParameters } = useMedicationsContext(MEDICATIONS_SEARCH_KEYS.DISPENSED);
  const { data: facility } = useFacilityQuery(facilityId);

  const [medicationDispenses, setMedicationDispenses] = useState([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedLabelData, setSelectedLabelData] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDispense, setSelectedDispense] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const canWriteMedicationDispense = ability.can('write', 'MedicationDispense');

  const onMedicationDispensesFetched = useCallback(({ data }) => {
    setMedicationDispenses(data);
  }, []);

  const handlePrintLabel = item => {
    const { pharmacyOrderPrescription, quantity, dispensedAt, id, instructions = '' } = item;
    const prescription = pharmacyOrderPrescription?.prescription;
    const patient = pharmacyOrderPrescription?.pharmacyOrder?.encounter?.patient;

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
  };

  const handleTableRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  const handleCancelClick = dispense => {
    setSelectedDispense(dispense);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    await api.delete(`medication/medication-dispenses/${selectedDispense.id}`);
    setIsCancelModalOpen(false);
    setSelectedDispense(null);
    // Trigger table refresh
    handleTableRefresh();
  };

  const handleCancelCancel = () => {
    setIsCancelModalOpen(false);
    setSelectedDispense(null);
  };

  const handleEditClick = dispense => {
    setSelectedDispense(dispense);
    setIsEditModalOpen(true);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedDispense(null);
  };

  const handleEditConfirm = async () => {
    // Trigger table refresh
    handleTableRefresh();
  };

  const columns = [
    {
      key: 'pharmacyOrderPrescription.pharmacyOrder.encounter.patient.displayId',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.patientId"
          fallback="Patient ID"
          data-testid="translatedtext-display-id"
        />
      ),
      accessor: getPatientDisplayId,
      sortable: true,
    },
    {
      key: 'patientName',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.patientName"
          fallback="Patient name"
          data-testid="translatedtext-patient-name-title"
        />
      ),
      accessor: getPatientName,
      sortable: false,
    },
    {
      key: 'pharmacyOrderPrescription.prescription.medication.name',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.medication"
          fallback="Medication"
          data-testid="translatedtext-medication-column-title"
        />
      ),
      accessor: getMedication,
      sortable: true,
    },
    {
      key: 'dispensedAt',
      title: (
        <TranslatedText
          stringId="medication-dispenses.table.column.date"
          fallback="Date dispensed"
          data-testid="translatedtext-date-dispensed-column-title"
        />
      ),
      accessor: getDateDispensed,
      sortable: true,
    },
    {
      key: 'quantity',
      title: (
        <TranslatedText
          stringId="medication-dispenses.table.column.quantity"
          fallback="Qty dispensed"
          data-testid="translatedtext-quantity-column-title"
        />
      ),
      accessor: getQuantity,
      sortable: false,
    },
    {
      key: 'dispensedById',
      title: (
        <TranslatedText
          stringId="medication-dispenses.table.column.dispensedById"
          fallback="Dispensed by"
          data-testid="translatedtext-dispensed-by-column-title"
        />
      ),
      accessor: getDispensedBy,
      sortable: false,
    },
    {
      key: 'requestNumber',
      title: (
        <TranslatedText
          stringId="medication-dispenses.table.column.requestNumber"
          fallback="Request no."
          data-testid="translatedtext-request-number-column-title"
        />
      ),
      accessor: getRequestNumber,
      sortable: false,
    },
    ...(canWriteMedicationDispense
      ? [
          {
            key: 'actions',
            title: '',
            allowExport: false,
            accessor: row => {
              const actions = [
                {
                  label: (
                    <TranslatedText stringId="general.action.printLabel" fallback="Print label" />
                  ),
                  action: () => handlePrintLabel(row),
                },
                {
                  label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
                  action: () => handleEditClick(row),
                },
                {
                  label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
                  action: () => handleCancelClick(row),
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
        ]
      : []),
  ];

  const { getDayBoundaries } = useDateTimeFormat();
  const fetchOptions = useMemo(() => {
    const { dispensedAt, ...rest } = searchParameters;
    if (!dispensedAt) return { ...rest, facilityId };
    const boundaries = getDayBoundaries(dispensedAt);
    return { ...rest, facilityId, dispensedAtFrom: boundaries?.start, dispensedAtTo: boundaries?.end };
  }, [searchParameters, facilityId, getDayBoundaries]);

  const handleRowClick = (_, dispenseData) => {
    const patient = dispenseData.pharmacyOrderPrescription?.pharmacyOrder?.encounter?.patient;
    const mappedItem = {
      id: dispenseData.id,
      displayId: dispenseData.pharmacyOrderPrescription?.displayId,
      quantity: dispenseData.quantity,
      instructions: dispenseData.instructions,
      remainingRepeats: dispenseData.pharmacyOrderPrescription?.remainingRepeats,
      dispensedAt: dispenseData.dispensedAt,
      dispensedBy: dispenseData.dispensedBy,
      prescription: {
        date: dispenseData.pharmacyOrderPrescription?.prescription?.date,
        medication: dispenseData.pharmacyOrderPrescription?.prescription?.medication,
      },
      patient,
    };
    setSelectedDetailItem(mappedItem);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailItem(null);
  };

  return (
    <>
      <CancelDispensedMedicationModal
        open={isCancelModalOpen}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
      />
      <EditMedicationDispenseModal
        open={isEditModalOpen}
        medicationDispense={selectedDispense}
        onClose={handleEditCancel}
        onConfirm={handleEditConfirm}
      />
      <StyledSearchTableWithPermissionCheck
        refreshCount={refreshCount}
        verb="read"
        noun="MedicationDispense"
        autoRefresh={true}
        endpoint="medication/medication-dispenses"
        columns={columns}
        noDataMessage={
          <NoDataContainer>
            <TranslatedText
              stringId="medication-dispenses.list.noData"
              fallback="No dispensed medications to display."
            />
          </NoDataContainer>
        }
        fetchOptions={fetchOptions}
        elevated={false}
        data-testid="searchtablewithpermissioncheck-medication-dispenses"
        $noData={medicationDispenses.length === 0}
        onDataFetched={onMedicationDispensesFetched}
        onClickRow={handleRowClick}
        allowExport={false}
        initialSort={{
          order: 'desc',
          orderBy: 'dispensedAt',
        }}
      />
      <MedicationLabelPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        labels={selectedLabelData}
      />
      <DispensedMedicationDetailsModal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        item={selectedDetailItem}
      />
    </>
  );
};
