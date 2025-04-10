import React, { useCallback, useState } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { format, parseISO, add } from 'date-fns';
import { Box } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { formatShortest } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { reloadPatient } from '../store';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { Colors } from '../constants';
import { getFullLocationName } from '../utils/location';
import { TranslatedText, TranslatedReferenceData } from './Translation';
import { DataFetchingTableWithPermissionCheck } from './Table/DataFetchingTable';
import { DRUG_ROUTE_LABELS, DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import { useTranslation } from '../contexts/Translation';
import { getTranslatedFrequency } from '../utils/medications';
import { LimitedLinesCell } from './FormattedTableCell';
import { ConditionalTooltip } from './Tooltip';
import { MedicationDetails } from './MedicationDetails';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  max-height: 51vh;
  border: none;
  border-top: 1px solid ${Colors.outline};
  margin-top: 8px;
  .MuiTableHead-root {
    position: sticky;
    top: 0;
  }
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 12px;
    padding-bottom: 12px;
    span {
      font-weight: 400;
      color: ${Colors.midText};
    }
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableCell-body {
    padding-top: 4px;
    padding-bottom: 4px;
    padding-left: 10px;
    padding-right: 10px;
    height: 44px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }
`;

const NoWrapCell = styled.div`
  white-space: nowrap;
`;

const getMedicationName = ({ medication }) => (
  <TranslatedReferenceData
    fallback={medication.name}
    value={medication.id}
    category={medication.type}
  />
);

const getDose = (
  { doseAmount, units, isVariableDose, isPrn },
  getTranslation,
  getEnumTranslation,
) => {
  if (!units) return '';
  if (isVariableDose) doseAmount = getTranslation('medication.table.variable', 'Variable');
  return `${doseAmount} ${getEnumTranslation(DRUG_UNIT_SHORT_LABELS, units)} ${
    isPrn ? ` ${getTranslation('medication.table.prn', 'PRN')}` : ''
  }`;
};

const getFrequency = ({ frequency }, getTranslation) => {
  if (!frequency) return '';
  return getTranslatedFrequency(frequency, getTranslation);
};

const MEDICATION_COLUMNS = (getTranslation, getEnumTranslation) => [
  {
    key: 'Medication.name',
    title: <TranslatedText stringId="medication.table.column.medication" fallback="Medication" />,
    accessor: getMedicationName,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="medication.table.column.dose" fallback="Dose" />,
    accessor: data => <NoWrapCell>{getDose(data, getTranslation, getEnumTranslation)}</NoWrapCell>,
    sortable: false,
  },
  {
    key: 'frequency',
    title: <TranslatedText stringId="medication.table.column.frequency" fallback="Frequency" />,
    accessor: data => getFrequency(data, getTranslation),
    sortable: false,
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'route',
    title: <TranslatedText stringId="medication.route.label" fallback="Route" />,
    accessor: ({ route }) => <NoWrapCell>{DRUG_ROUTE_LABELS[route]}</NoWrapCell>,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    accessor: ({ date, startDate, durationValue, durationUnit, isOngoing }) => {
      const parsedStartDate = parseISO(startDate);
      const duration = parseInt(durationValue, 10);
      const endDate = add(parsedStartDate, { [durationUnit]: duration });
      let tooltipTitle = '';
      if (durationValue && durationUnit) {
        tooltipTitle = (
          <>
            <TranslatedText stringId="medication.table.endsOn.label" fallback="Ends on" />
            <div>{format(endDate, 'dd/MM/yy h:mma').toLowerCase()}</div>
          </>
        );
      } else if (isOngoing) {
        tooltipTitle = (
          <TranslatedText
            stringId="medication.table.ongoingMedication.label"
            fallback="Ongoing medication"
          />
        );
      }
      return (
        <NoWrapCell>
          <ConditionalTooltip
            visible={isOngoing || (durationValue && durationUnit)}
            title={<Box fontWeight={400}>{tooltipTitle}</Box>}
          >
            {formatShortest(date)}
          </ConditionalTooltip>
        </NoWrapCell>
      );
    },
  },
  {
    key: 'prescriber.displayName',
    title: <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />,
    accessor: data => data?.prescriber?.displayName ?? '',
    CellComponent: LimitedLinesCell,
  },
];

const FULL_LISTING_COLUMNS = getTranslation => [
  {
    key: 'name',
    title: <TranslatedText stringId="general.patient.label" fallback="Patient" />,
    accessor: ({ encounter }) => `${encounter.patient.firstName} ${encounter.patient.lastName}`,
    sortable: false,
  },
  {
    key: 'department',
    title: <TranslatedText stringId="general.department.label" fallback="Department" />,
    accessor: ({ encounter }) => (
      <TranslatedReferenceData
        fallback={encounter.department.name}
        value={encounter.department.id}
        category="department"
      />
    ),
    sortable: false,
  },
  {
    key: 'location',
    title: <TranslatedText stringId="general.location.label" fallback="Location" />,
    accessor: ({ encounter }) => getFullLocationName(encounter.location),
    sortable: false,
  },
  ...MEDICATION_COLUMNS(getTranslation),
];

export const EncounterMedicationTable = React.memo(({ encounterId }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const rowStyle = ({ discontinued }) =>
    discontinued
      ? `
        color: ${Colors.alert};
        text-decoration: line-through;`
      : '';

  return (
    <div>
      {selectedMedication && (
        <MedicationDetails
          medication={selectedMedication}
          onReloadTable={() => setRefreshCount(refreshCount + 1)}
          onClose={() => setSelectedMedication(null)}
        />
      )}
      <StyledDataFetchingTable
        columns={MEDICATION_COLUMNS(getTranslation, getEnumTranslation)}
        endpoint={`encounter/${encounterId}/medications`}
        rowStyle={rowStyle}
        elevated={false}
        allowExport={false}
        disablePagination
        onRowClick={row => setSelectedMedication(row)}
        refreshCount={refreshCount}
      />
    </div>
  );
});

export const DataFetchingMedicationTable = () => {
  const { getTranslation } = useTranslation();
  const { loadEncounter } = useEncounter();
  const { facilityId } = useAuth();
  const dispatch = useDispatch();
  const onMedicationSelect = useCallback(
    async medication => {
      await loadEncounter(medication.encounter.id);
      await dispatch(reloadPatient(medication.encounter.patientId));
      dispatch(
        push(
          `/patients/all/${medication.encounter.patientId}/encounter/${medication.encounter.id}?tab=${ENCOUNTER_TAB_NAMES.MEDICATION}`,
        ),
      );
    },
    [loadEncounter, dispatch],
  );

  return (
    <DataFetchingTableWithPermissionCheck
      verb="list"
      noun="Prescription"
      endpoint="medication"
      fetchOptions={{ facilityId }}
      columns={FULL_LISTING_COLUMNS(getTranslation)}
      noDataMessage={
        <TranslatedText
          stringId="medication.table.noData"
          fallback="No medication requests found"
        />
      }
      initialSort={{ order: 'desc', orderBy: 'date' }}
      onRowClick={onMedicationSelect}
    />
  );
};
