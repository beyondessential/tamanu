import React, { useState } from 'react';
import styled from 'styled-components';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/shared/constants';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants/surveys';
import { Box, IconButton as IconButtonComponent } from '@material-ui/core';
import { Table } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { RangeValidatedCell, DateHeadCell, RangeTooltipCell } from './FormattedTableCell';
import { useVitals } from '../api/queries/useVitals';
import { formatShortest, formatTimeWithSeconds } from './DateDisplay';
import { EditVitalCellModal } from './EditVitalCellModal';
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
    setChartKeys,
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
              setChartKeys([visualisationConfig.key]);
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

const TitleCell = React.memo(({ value }) => {
  const {
    setChartKeys,
    setModalTitle,
    setVitalChartModalOpen,
    visualisationConfigs,
  } = useVitalChartData();
  const allChartKeys = visualisationConfigs
    .filter(({ hasVitalChart, key }) => hasVitalChart && key !== VITALS_DATA_ELEMENT_IDS.sbp) // Only show one blood pressure chart on multi vital charts
    .map(({ key }) => key);

  return (
    <>
      <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
        {value}
        {allChartKeys.length > 0 && (
          <IconButton
            size="small"
            onClick={() => {
              setChartKeys(allChartKeys);
              setModalTitle('Vitals');
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
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const showFooterLegend = data.some(entry =>
    recordedDates.some(date => entry[date].historyLogs.length > 1),
  );

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
      TitleCellComponent: TitleCell,
    },
    ...recordedDates
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: <DateHeadCell value={date} />,
        sortable: false,
        key: date,
        accessor: cells => {
          const { value, config, validationCriteria, historyLogs, component } = cells[date];
          const isCalculatedQuestion =
            component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.CALCULATED;
          const handleCellClick = () => {
            setOpenEditModal(true);
            setSelectedCell(cells[date]);
          };
          return (
            <RangeValidatedCell
              value={value}
              config={config}
              validationCriteria={validationCriteria}
              isEdited={historyLogs.length > 1}
              onClick={isCalculatedQuestion ? null : handleCellClick}
            />
          );
        },
        exportOverrides: {
          title: `${formatShortest(date)} ${formatTimeWithSeconds(date)}`,
        },
      })),
  ];

  return (
    <>
      <EditVitalCellModal
        open={openEditModal}
        dataPoint={selectedCell}
        onClose={() => {
          setOpenEditModal(false);
        }}
      />
      <StyledTable
        columns={columns}
        data={data}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
      {showFooterLegend && (
        <Box textAlign="end" marginTop="8px" fontSize="9px" color={Colors.softText}>
          *Changed entry
        </Box>
      )}
    </>
  );
});
