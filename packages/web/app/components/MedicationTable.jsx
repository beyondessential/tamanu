import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { reloadPatient } from '../store';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { Colors } from '../constants';
import { getFullLocationName } from '../utils/location';
import { TranslatedText, TranslatedReferenceData } from './Translation';
import { DataFetchingTableWithPermissionCheck } from './Table/DataFetchingTable';
import { ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';
import { useTranslation } from '../contexts/Translation';
import { getTranslatedFrequencySynonym } from '../utils/medications';
import { LimitedLinesCell } from './FormattedTableCell';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  border: none;
  border-top: 1px solid ${Colors.outline};
  margin-top: 8px;
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

const getMedicationName = ({ medication }) => (
  <TranslatedReferenceData
    fallback={medication.name}
    value={medication.id}
    category={medication.type}
  />
);

const getDose = ({ doseAmount, units, isVariableDose, isPrn }, getTranslation) => {
  if (!doseAmount || !units) return '';
  if (isVariableDose) doseAmount = getTranslation('medication.table.variable', 'Variable');
  return `${doseAmount} ${units}${
    isPrn ? ` ${getTranslation('medication.table.prn', 'PRN')}` : ''
  }`;
};

const getFrequency = ({ frequency }, getTranslation) => {
  if (!frequency) return '';
  return getTranslatedFrequencySynonym(
    ADMINISTRATION_FREQUENCY_SYNONYMS[frequency],
    0,
    getTranslation,
  );
};

const MEDICATION_COLUMNS = getTranslation => [
  {
    key: 'Medication.name',
    title: <TranslatedText stringId="medication.table.column.medication" fallback="Medication" />,
    accessor: getMedicationName,
    CellComponent: props => <LimitedLinesCell {...props} isOneLine />,
  },
  {
    key: 'dose',
    title: <TranslatedText stringId="medication.table.column.dose" fallback="Dose" />,
    accessor: data => getDose(data, getTranslation),
    sortable: false,
    CellComponent: LimitedLinesCell,
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
    CellComponent: LimitedLinesCell,
  },
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    accessor: ({ date }) => <DateDisplay date={date} />,
    CellComponent: LimitedLinesCell,
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
  const { getTranslation } = useTranslation();
  const rowStyle = ({ discontinued }) =>
    discontinued
      ? `
        color: ${Colors.alert};
        text-decoration: line-through;`
      : '';

  return (
    <div>
      <StyledDataFetchingTable
        columns={MEDICATION_COLUMNS(getTranslation)}
        endpoint={`encounter/${encounterId}/medications`}
        rowStyle={rowStyle}
        elevated={false}
        allowExport={false}
        disablePagination
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
