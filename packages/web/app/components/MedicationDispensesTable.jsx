import React, { useCallback, useState } from 'react';
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
import { TranslatedReferenceData } from '@tamanu/ui-components';
import { useApi } from '../api';
import { CancelDispensedMedicationModal } from './Medication/CancelDispensedMedicationModal';

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
  const { facilityId } = useAuth();
  const { searchParameters } = useMedicationsContext(MEDICATIONS_SEARCH_KEYS.DISPENSED);

  const [medicationDispenses, setMedicationDispenses] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDispenseId, setSelectedDispenseId] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const onMedicationDispensesFetched = useCallback(({ data }) => {
    setMedicationDispenses(data);
  }, []);

  const handleTableRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  const handleCancelClick = dispenseId => {
    setSelectedDispenseId(dispenseId);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    await api.delete(`medication/medication-dispenses/${selectedDispenseId}`);
    setIsCancelModalOpen(false);
    setSelectedDispenseId(null);
    // Trigger table refresh
    handleTableRefresh();
  };

  const handleCancelCancel = () => {
    setIsCancelModalOpen(false);
    setSelectedDispenseId(null);
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
    {
      key: 'actions',
      title: '',
      allowExport: false,
      accessor: row => {
        const actions = [
          {
            label: <TranslatedText stringId="general.action.printLabel" fallback="Print label" />,
            action: () => {},
          },
          {
            label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
            action: () => {},
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

  const fetchOptions = { ...searchParameters, facilityId };

  const handleRowClick = (_, data) => {
    console.log(data);
  };

  return (
    <>
      <CancelDispensedMedicationModal
        open={isCancelModalOpen}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
      />
      <StyledSearchTableWithPermissionCheck
        refreshCount={refreshCount}
        verb="list"
        noun="Medication"
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
        }}
      />
    </>
  );
};
