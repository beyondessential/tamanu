import React from 'react';
import styled from 'styled-components';
import { Table } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { VitalsTableCell, VitalsTableHeadCell } from './VitalsTableCell';
import { useVitals } from '../hooks/useVitals';

const StyledTable = styled(Table)`
  table {
    position: relative;
    thead tr th:first-child,
    tbody tr td:first-child {
      left: 0;
      position: sticky;
      z-index: 1;
      border-right: 1px solid ${Colors.outline};
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

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);

  if (isLoading) {
    return 'loading...';
  }

  // create a column for each reading
  const columns = [
    {
      key: 'title',
      title: 'Measure',
      sortable: false,
      accessor: c => <VitalsTableCell {...c.title} />,
    },
    ...recordedDates
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <VitalsTableHeadCell date={r} />,
        sortable: false,
        key: r,
        accessor: c => <VitalsTableCell {...c[r]} />,
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
