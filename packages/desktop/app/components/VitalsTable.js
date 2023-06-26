import React from 'react';
import styled from 'styled-components';
import { Box, IconButton as IconButtonComponent } from '@material-ui/core';
import { Table } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { RangeValidatedCell, DateHeadCell, RangeTooltipCell } from './FormattedTableCell';
import { useVitals } from '../api/queries/useVitals';
import { formatShortest, formatTimeWithSeconds } from './DateDisplay';
import { VitalVectorIcon } from './Icons/VitalVectorIcon';
import { useVitalChartData } from '../contexts/VitalChartData';

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

const IconButton = styled(IconButtonComponent)`
  padding: 9px 5px;
`;

const MeasureCell = React.memo(({ value, data }) => {
  const {
    setChartKey,
    setModalTitle,
    setVitalChartModalOpen,
    visualisationConfigs,
  } = useVitalChartData();
  const visualisationConfig = visualisationConfigs.find(({ key }) => key === data.dataElementId);
  const { hasVitalChart = false } = visualisationConfig || {};

  return (
    <>
      <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
        {value}
        {hasVitalChart && (
          <IconButton
            size="small"
            onClick={() => {
              setChartKey(visualisationConfig.key);
              setModalTitle(value);
              setVitalChartModalOpen(true);
            }}
          >
            <VitalVectorIcon />
          </IconButton>
        )}
      </Box>
    </>
  );
});

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);

  // create a column for each reading
  const columns = [
    {
      key: 'measure',
      title: 'Measure',
      sortable: false,
      accessor: ({ value, config, validationCriteria }) => (
        <RangeTooltipCell value={value} config={config} validationCriteria={validationCriteria} />
      ),
      CellComponent: MeasureCell,
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
          title: `${formatShortest(date)} ${formatTimeWithSeconds(date)}`,
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
