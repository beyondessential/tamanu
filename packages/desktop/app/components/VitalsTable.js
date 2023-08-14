import React, { useState } from 'react';
import styled from 'styled-components';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { Box, IconButton as IconButtonComponent } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { Table } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { RangeValidatedCell, DateHeadCell, RangeTooltipCell } from './FormattedTableCell';
import { useVitals } from '../api/queries/useVitals';
import { formatShortest, formatTimeWithSeconds } from './DateDisplay';
import { EditVitalCellModal } from './EditVitalCellModal';
import { VitalVectorIcon } from './Icons/VitalVectorIcon';
import { useVitalChartData } from '../contexts/VitalChartData';
import { useLocalisation } from '../contexts/Localisation';
import { getNormalRangeByAge } from '../utils';

const StyledTable = styled(Table)`
  overflow-x: auto;
  overflow-y: hidden;
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
  // If the diastolic blood pressure(DBP) is selected, we want to show the systolic blood pressure(SBP) chart instead
  // This is a hacky solution because:
  // we need the visualisation configs to enable the two viz buttons that can click into the chart view, and at the same time they will pop up the same chart. Replacing DBP key with SBP is a hacky way to do it.
  //
  // The ideal way is to:
  // 1. just make one button for both SBP and DBP on desktop
  // 2. build a chart key on backend for the blood chart, build a customised viz config for it.
  //
  // Currently DBP and SBP data are both shown on the same chart (VitalBloodPressureChart), it should use SBP's visualisation_config and validation_criteria to render the chart

  const chartKey =
    visualisationConfig?.key === VITALS_DATA_ELEMENT_IDS.dbp
      ? VITALS_DATA_ELEMENT_IDS.sbp
      : visualisationConfig?.key;

  return (
    <>
      <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
        {value}
        {hasVitalChart && (
          <IconButton
            size="small"
            onClick={() => {
              setChartKeys([chartKey]);
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
    .filter(({ hasVitalChart, key }) => hasVitalChart && key !== VITALS_DATA_ELEMENT_IDS.dbp) // Only show one blood pressure chart on multi vital charts
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
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const { getLocalisation } = useLocalisation();
  const isVitalEditEnabled = getLocalisation('features.enableVitalEdit');
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
        <RangeTooltipCell
          value={value}
          config={config}
          validationCriteria={{ normalRange: getNormalRangeByAge(validationCriteria, patient) }}
        />
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
          const shouldBeClickable = isVitalEditEnabled && isCalculatedQuestion === false;
          return (
            <RangeValidatedCell
              value={value}
              config={config}
              validationCriteria={{ normalRange: getNormalRangeByAge(validationCriteria, patient) }}
              isEdited={historyLogs.length > 1}
              onClick={shouldBeClickable ? handleCellClick : null}
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
        count={data.length}
        allowExport
      />
      {showFooterLegend && (
        <Box textAlign="end" marginTop="8px" fontSize="9px" color={Colors.softText}>
          *Changed record
        </Box>
      )}
    </>
  );
});
