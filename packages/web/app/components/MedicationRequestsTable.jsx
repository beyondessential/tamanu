import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { SearchTableWithPermissionCheck } from './Table';
import { DateDisplay, formatTime } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { useMedicationsContext } from '../contexts/Medications';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { MEDICATIONS_SEARCH_KEYS } from '../constants/medication';
import { Colors } from '../constants';
import { MenuButton } from './MenuButton';
import { DispenseMedicationWorkflowModal } from './Medication/DispenseMedicationWorkflowModal';
import { ThemedTooltip, TranslatedEnum, TranslatedReferenceData } from '@tamanu/ui-components';
import { BodyText } from './Typography';
import { PHARMACY_PRESCRIPTION_TYPE_LABELS, PHARMACY_PRESCRIPTION_TYPES } from '@tamanu/constants';
import { useApi } from '../api';
import { DeleteMedicationRequestModal } from './Medication/DeleteMedicationRequestModal';
import { Box } from '@mui/material';
import { getStockStatus } from '../utils/medications';

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
    cursor: ${props => (props.onClickRow ? 'pointer' : 'default')};
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

const getPatientDisplayId = ({ pharmacyOrder }) => pharmacyOrder?.encounter?.patient?.displayId;
const getPatientName = ({ pharmacyOrder }) => (
  <PatientNameDisplay patient={pharmacyOrder?.encounter?.patient} />
);
const getPrescriptionType = ({ pharmacyOrder }) => {
  return pharmacyOrder?.isDischargePrescription ? (
    <ThemedTooltip
      title={
        <TranslatedEnum
          value={PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT}
          enumValues={PHARMACY_PRESCRIPTION_TYPE_LABELS}
        />
      }
    >
      <Box width={'fit-content'}>
        <TranslatedText
          stringId="medication-requests.table.column.prescriptionType.outpatientDischarge"
          fallback="OP/Discharge"
        />
      </Box>
    </ThemedTooltip>
  ) : (
    <TranslatedEnum
      value={PHARMACY_PRESCRIPTION_TYPES.INPATIENT}
      enumValues={PHARMACY_PRESCRIPTION_TYPE_LABELS}
    />
  );
};
const getLocation = ({ pharmacyOrder }) => {
  return (
    <div>
      <TranslatedReferenceData
        fallback={pharmacyOrder?.encounter?.location?.locationGroup?.name}
        value={pharmacyOrder?.encounter?.location?.locationGroup?.id}
        category="locationGroup"
      />
      <BodyText fontSize="11px !important" color={Colors.midText}>
        <TranslatedReferenceData
          fallback={pharmacyOrder?.encounter?.location?.name}
          value={pharmacyOrder?.encounter?.location?.id}
          category="location"
        />
      </BodyText>
    </div>
  );
};
const getMedication = ({ prescription }) => {
  return (
    <TranslatedReferenceData
      fallback={prescription?.medication?.name}
      value={prescription?.medication?.id}
      category={prescription?.medication?.type}
    />
  );
};
const getPrescriber = ({ prescription }) => {
  return prescription?.prescriber?.displayName;
};
const getDateSent = ({ pharmacyOrder }) => (
  <div>
    <DateDisplay
      date={pharmacyOrder?.date}
      timeOnlyTooltip
      shortYear
      data-testid="datedisplay-date-sent"
    />
    <BodyText fontSize="11px !important" color={Colors.midText}>
      {formatTime(pharmacyOrder?.date)}
    </BodyText>
  </div>
);

export const MedicationRequestsTable = () => {
  const api = useApi();
  const { ability, facilityId } = useAuth();
  const { searchParameters } = useMedicationsContext(MEDICATIONS_SEARCH_KEYS.ACTIVE);

  const [medicationRequests, setMedicationRequests] = useState([]);
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [hoveredRow, setHoveredRow] = useState(null);

  const canDeleteMedicationRequest = ability.can('delete', 'MedicationRequest');
  const canDispenseMedication = ability.can('create', 'MedicationDispense');
  const canDeleteMedicationDispense = ability.can('delete', 'MedicationDispense');

  const onMedicationRequestsFetched = useCallback(({ data }) => {
    setMedicationRequests(data);
  }, []);

  const handleTableRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  const handleDeleteClick = requestId => {
    setSelectedRequestId(requestId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`medication/medication-requests/${selectedRequestId}`);
      setIsDeleteModalOpen(false);
      setSelectedRequestId(null);
      // Trigger table refresh
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error(error.message || 'Failed to delete medication request');
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedRequestId(null);
  };

  const columns = [
    {
      key: 'pharmacyOrder.encounter.patient.displayId',
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
      key: 'pharmacyOrder.isDischargePrescription',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.prescription"
          fallback="Prescription"
          data-testid="translatedtext-prescription-type-column-title"
        />
      ),
      accessor: getPrescriptionType,
      sortable: true,
    },
    {
      key: 'location',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.location"
          fallback="Location"
          data-testid="translatedtext-location-column-title"
        />
      ),
      accessor: getLocation,
      sortable: false,
    },
    {
      key: 'prescription.medication.name',
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
      key: 'prescriber',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.prescriber"
          fallback="Prescriber"
          data-testid="translatedtext-prescriber-column-title"
        />
      ),
      accessor: getPrescriber,
      sortable: false,
    },
    {
      key: 'pharmacyOrder.date',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.date"
          fallback="Date & time sent"
          data-testid="translatedtext-date-sent-column-title"
        />
      ),
      accessor: getDateSent,
      sortable: true,
    },
    {
      key: 'stockStatus',
      title: (
        <TranslatedText
          stringId="medication-requests.table.column.stockStatus"
          fallback="Stock"
          data-testid="translatedtext-stock-status-column-title"
        />
      ),
      accessor: getStockStatus,
      sortable: true,
    },
    ...(canDeleteMedicationRequest && canDeleteMedicationDispense
      ? [
          {
            key: 'actions',
            title: '',
            accessor: row => {
              const actions = [
                {
                  label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
                  action: () => handleDeleteClick(row.id),
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

  const fetchOptions = { ...searchParameters, facilityId };

  const handleRowClick = (_, data) => {
    const patient = data?.pharmacyOrder?.encounter?.patient;
    if (!patient?.id) return;
    setSelectedPatient(patient);
    setIsDispenseOpen(true);
  };

  return (
    <>
      <DispenseMedicationWorkflowModal
        open={isDispenseOpen}
        onClose={() => {
          setIsDispenseOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onDispenseSuccess={handleTableRefresh}
      />
      <DeleteMedicationRequestModal
        open={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
      <StyledSearchTableWithPermissionCheck
        refreshCount={refreshCount}
        verb="read"
        noun="MedicationRequest"
        autoRefresh={true}
        endpoint="medication/medication-requests"
        columns={columns}
        noDataMessage={
          <NoDataContainer>
            <TranslatedText
              stringId="medication-requests.list.noData"
              fallback="No active medication requests to display."
            />
          </NoDataContainer>
        }
        fetchOptions={fetchOptions}
        elevated={false}
        data-testid="searchtablewithpermissioncheck-medication"
        $noData={medicationRequests.length === 0}
        onDataFetched={onMedicationRequestsFetched}
        onClickRow={canDispenseMedication ? handleRowClick : undefined}
        allowExport={false}
        initialSort={{
          order: 'desc',
          orderBy: 'pharmacyOrder.date',
        }}
      />
    </>
  );
};
