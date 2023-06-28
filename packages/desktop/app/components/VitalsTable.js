import React from 'react';
import styled from 'styled-components';
import { Table } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { RangeValidatedCell, DateHeadCell, RangeTooltipCell } from './FormattedTableCell';
import { useVitals } from '../api/queries/useVitals';
import { DateDisplay, formatShortest, formatTimeWithSeconds } from './DateDisplay';

const StyledTable = styled(Table)`
  table {
    position: relative;
    thead tr th:first-child,
    tbody tr td:first-child {
      left: 0;
      position: sticky;
      z-index: 1;
      border-right: 2px solid ${Colors.outline};
    }
    thead tr th:first-child {
      background: ${Colors.background};
      width: 160px;
      min-width: 160px;
    }
    tbody tr td:first-child {
      background: ${Colors.white};
    }
    tfoot tr td button {
      position: sticky;
      left: 16px;
    }
  }
`;

const getExportOverrideTitle = date => {
  const shortestDate = DateDisplay.rawFormat(date, formatShortest);
  const timeWithSeconds = DateDisplay.rawFormat(date, formatTimeWithSeconds);
  return `${shortestDate} ${timeWithSeconds}`;
};

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);

  // create a column for each reading
  const columns = [
    {
      title: 'Measure',
      sortable: false,
      accessor: ({ value, config, validationCriteria }) => (
        <RangeTooltipCell value={value} config={config} validationCriteria={validationCriteria} />
      ),
    },
    ...recordedDates
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: <DateHeadCell value={date} />,
        sortable: false,
        key: date,
        accessor: cells => {
          const { value, config, validationCriteria } = cells[date];
          return (
            <RangeValidatedCell
              value={value}
              config={config}
              validationCriteria={validationCriteria}
            />
          );
        },
        exportOverrides: {
          title: getExportOverrideTitle(date),
        },
      })),
  ];

  return (
    <StyledTable
      columns={columns}
      data={data}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
});
