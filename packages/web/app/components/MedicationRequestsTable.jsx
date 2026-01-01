import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { SearchTableWithPermissionCheck } from './Table';
import { DateDisplay, formatTime } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { useMedicationsContext } from '../contexts/Medications';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { MEDICATIONS_SEARCH_KEYS, STOCK_STATUS_COLORS } from '../constants/medication';
import { Colors } from '../constants';
import { MenuButton } from './MenuButton';
import {
  TableCellTag,
  ThemedTooltip,
  TranslatedEnum,
  TranslatedReferenceData,
} from '@tamanu/ui-components';
import { BodyText } from './Typography';
import {
  DRUG_STOCK_STATUS_LABELS,
  DRUG_STOCK_STATUSES,
  PHARMACY_PRESCRIPTION_TYPE_LABELS,
  PHARMACY_PRESCRIPTION_TYPES,
} from '@tamanu/constants';
import { Box } from '@mui/material';

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

const StyledTag = styled(TableCellTag)`
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 18px;
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
      fallback={prescription.medication.name}
      value={prescription.medication.id}
      category={prescription.medication.type}
    />
  );
};
const getPrescriber = ({ prescription }) => {
  return prescription.prescriber.displayName;
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
const getStockStatus = ({ prescription }) => {
  const status =
    prescription.medication?.referenceDrug?.facilities?.[0]?.stockStatus || DRUG_STOCK_STATUSES.UNKNOWN;
  const quantity = prescription.medication?.referenceDrug?.facilities?.[0]?.quantity || 0;

  const color = STOCK_STATUS_COLORS[status];

  const content = (
    <StyledTag $color={color} noWrap>
      <TranslatedEnum value={status} enumValues={DRUG_STOCK_STATUS_LABELS} />
    </StyledTag>
  );

  if (status === STOCK_STATUSES.YES) {
    return (
      <ThemedTooltip
        title={
          <Box maxWidth="75px">
            <TranslatedText
              stringId="medication.stockLevel.tooltip"
              fallback="Stock level: :quantity units"
              replacements={{ quantity }}
            />
          </Box>
        }
      >
        <span>{content}</span>
      </ThemedTooltip>
    );
  }
  return content;
};

export const MedicationRequestsTable = () => {
  const { facilityId } = useAuth();
  const { searchParameters } = useMedicationsContext(MEDICATIONS_SEARCH_KEYS.ACTIVE);

  const [medicationRequests, setMedicationRequests] = useState([]);

  const onMedicationRequestsFetched = useCallback(({ data }) => {
    setMedicationRequests(data);
  }, []);

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
          stringId="medication-requests.table.column.prescriptionType"
          fallback="Prescription type"
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
    {
      key: 'actions',
      title: '',
      allowExport: false,
      accessor: () => {
        const actions = [
          {
            label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
            action: () => {},
          },
        ];
        return <MenuButton onClick={() => {}} actions={actions} />;
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
    <StyledSearchTableWithPermissionCheck
      verb="list"
      noun="Medication"
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
      onClickRow={handleRowClick}
      allowExport={false}
      initialSort={{
        order: 'desc',
      }}
    />
  );
};
