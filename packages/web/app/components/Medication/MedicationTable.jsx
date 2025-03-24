import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Box } from '@material-ui/core';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';

import { DataFetchingTable } from '../Table';
import { formatShortest } from '../DateDisplay';
import { Colors } from '../../constants';
import { TranslatedText, TranslatedReferenceData, TranslatedEnum } from '../Translation';
import { useTranslation } from '../../contexts/Translation';
import { formatTimeSlot, getDose, getTranslatedFrequency } from '../../utils/medications';
import { LimitedLinesCell } from '../FormattedTableCell';
import { ConditionalTooltip } from '../Tooltip';
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

const NoWrapCell = styled(Box)`
  white-space: nowrap;
`;

const getMedicationName = ({ medication, pausePrescriptions, discontinued }) => {
  const pauseData = pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;

  return (
    <Box
      color={isPausing ? Colors.softText : 'inherit'}
      fontStyle={isPausing ? 'italic' : 'normal'}
    >
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
      />
      {isPausing && (
        <Box fontSize={'12px'}>
          (<TranslatedText stringId="medication.table.pausing" fallback="Paused" />,{' '}
          {pauseData.pauseDuration}{' '}
          <TranslatedText
            stringId="medication.table.pausingTimeUnit"
            fallback={`${pauseData.pauseTimeUnit.slice(0, -1)}(s)`}
          />{' '}
          - <TranslatedText stringId="medication.table.until" fallback="until" />{' '}
          {`${formatShortest(pauseData.pauseEndDate)} ${formatTimeSlot(pauseData.pauseEndDate)}`})
        </Box>
      )}
    </Box>
  );
};

const getFrequency = ({ frequency, pausePrescriptions, discontinued }, getTranslation) => {
  if (!frequency) return '';
  const pauseData = pausePrescriptions?.[0];
  const isPausing = !!pauseData && !discontinued;
  return (
    <Box
      color={isPausing ? Colors.softText : 'inherit'}
      fontStyle={isPausing ? 'italic' : 'normal'}
    >
      {getTranslatedFrequency(frequency, getTranslation)}
    </Box>
  );
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
    accessor: data => {
      const pauseData = data.pausePrescriptions?.[0];
      const isPausing = !!pauseData && !data.discontinued;
      return (
        <NoWrapCell
          color={isPausing ? Colors.softText : 'inherit'}
          fontStyle={isPausing ? 'italic' : 'normal'}
        >
          {getDose(data, getTranslation, getEnumTranslation)}
          {data.isPrn && ` ${getTranslation('medication.table.prn', 'PRN')}`}
        </NoWrapCell>
      );
    },
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
    accessor: ({ route, pausePrescriptions, discontinued }) => {
      const pauseData = pausePrescriptions?.[0];
      const isPausing = !!pauseData && !discontinued;

      return (
        <NoWrapCell
          color={isPausing ? Colors.softText : 'inherit'}
          fontStyle={isPausing ? 'italic' : 'normal'}
        >
          <TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />
        </NoWrapCell>
      );
    },
  },
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    accessor: ({ date, endDate, isOngoing, discontinued, pausePrescriptions }) => {
      const pauseData = pausePrescriptions?.[0];
      const isPausing = !!pauseData && !discontinued;

      let tooltipTitle = '';
      if (endDate) {
        tooltipTitle = (
          <>
            <TranslatedText stringId="medication.table.endsOn.label" fallback="Ends on" />
            <div>{format(new Date(endDate), 'dd/MM/yy h:mma').toLowerCase()}</div>
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
        <NoWrapCell
          color={isPausing ? Colors.softText : 'inherit'}
          fontStyle={isPausing ? 'italic' : 'normal'}
        >
          <ConditionalTooltip
            visible={!discontinued || tooltipTitle}
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
    accessor: ({ prescriber, pausePrescriptions, discontinued }) => {
      const pauseData = pausePrescriptions?.[0];
      const isPausing = !!pauseData && !discontinued;
      return (
        <Box
          color={isPausing ? Colors.softText : 'inherit'}
          fontStyle={isPausing ? 'italic' : 'normal'}
        >
          {prescriber?.displayName ?? ''}
        </Box>
      );
    },
    CellComponent: LimitedLinesCell,
  },
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
          initialMedication={selectedMedication}
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
