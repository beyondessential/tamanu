import React from 'react';
import styled from 'styled-components';
import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { Box, CircularProgress, IconButton as IconButtonComponent } from '@material-ui/core';
import {
  DateHeadCell,
  LimitedLinesCell,
  RangeTooltipCell,
  RangeValidatedCell,
} from './FormattedTableCell';
import { DateDisplay, formatShortest, formatTimeWithSeconds } from './DateDisplay';
import { VitalVectorIcon } from './Icons/VitalVectorIcon';
import { useVitalChartData } from '../contexts/VitalChartData';
import { getNormalRangeByAge } from '../utils';
import { useVitalsVisualisationConfigsQuery } from '../api/queries/useVitalsVisualisationConfigsQuery';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { combineQueries } from '../api';
import { TranslatedText } from './Translation/TranslatedText';

const getExportOverrideTitle = date => {
  const shortestDate = DateDisplay.stringFormat(date, formatShortest);
  const timeWithSeconds = DateDisplay.stringFormat(date, formatTimeWithSeconds);
  return `${shortestDate} ${timeWithSeconds}`;
};
const IconButton = styled(IconButtonComponent)`
  padding: 9px 5px;
`;

const VitalsLimitedLinesCell = ({ value }) => (
  <LimitedLinesCell value={value} maxWidth="75px" maxLines={1} />
);

const MeasureCell = React.memo(({ value, data }) => {
  const {
    setChartKeys,
    setModalTitle,
    setVitalChartModalOpen,
    visualisationConfigs,
    setIsInMultiChartsView,
  } = useVitalChartData();
  const visualisationConfig = visualisationConfigs.find(({ key }) => key === data.dataElementId);
  const { hasVitalChart = false } = visualisationConfig || {};
  // If the diastolic blood pressure(DBP) is selected, we want to show the systolic blood pressure(SBP) chart instead
  // This is a hacky solution because:
  // we need the visualisation configs to enable the two viz buttons that can click into the chart view, and at the same time they will pop up the same chart. Replacing DBP key with SBP is a hacky way to do it.
  //
  // The ideal way is to:
  // 1. just make one button for both SBP and DBP on web
  // 2. build a chart key on backend for the blood chart, build a customised viz config for it.
  //
  // Currently DBP and SBP data are both shown on the same chart (VitalBloodPressureChart), it should use SBP's visualisation_config and validation_criteria to render the chart

  const chartKey =
    visualisationConfig?.key === VITALS_DATA_ELEMENT_IDS.dbp
      ? VITALS_DATA_ELEMENT_IDS.sbp
      : visualisationConfig?.key;

  return (
    <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
      {value}
      {hasVitalChart && (
        <IconButton
          size="small"
          onClick={() => {
            setChartKeys([chartKey]);
            setIsInMultiChartsView(false);
            setModalTitle(value);
            setVitalChartModalOpen(true);
          }}
        >
          <VitalVectorIcon />
        </IconButton>
      )}
    </Box>
  );
});

const TitleCell = React.memo(({ value }) => {
  const {
    setChartKeys,
    setModalTitle,
    setVitalChartModalOpen,
    setIsInMultiChartsView,
  } = useVitalChartData();
  const vitalsVisualisationConfigsQuery = useVitalsVisualisationConfigsQuery();
  const userPreferencesQuery = useUserPreferencesQuery();
  const {
    data: [vitalsVisualisationConfigs, userPreferences],
    isSuccess,
    isLoading,
  } = combineQueries([vitalsVisualisationConfigsQuery, userPreferencesQuery]);

  let chartKeys = [];
  if (isSuccess) {
    const {
      selectedGraphedVitalsOnFilter: rawSelectedGraphedVitalsOnFilter = 'select-all',
    } = userPreferences;
    const selectedGraphedVitalsOnFilter = rawSelectedGraphedVitalsOnFilter.trim();
    const { allGraphedChartKeys } = vitalsVisualisationConfigs;

    chartKeys = ['select-all', ''].includes(selectedGraphedVitalsOnFilter)
      ? allGraphedChartKeys
      : selectedGraphedVitalsOnFilter.split(',').filter(key => allGraphedChartKeys.includes(key));
  }

  return (
    <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
      {value}
      {isSuccess && vitalsVisualisationConfigs?.allGraphedChartKeys.length > 0 && (
          <IconButton
            size="small"
            onClick={() => {
              setChartKeys(chartKeys);
              setIsInMultiChartsView(true);
              setModalTitle('Vitals');
              setVitalChartModalOpen(true);
            }}
          >
            <VitalVectorIcon />
          </IconButton>
        )}
      {isLoading && <CircularProgress size={14} />}
    </Box>
  );
});

export const getVitalsTableColumns = (patient, recordedDates, onCellClick, isEditEnabled) => {
  return [
    {
      key: 'measure',
      title: <TranslatedText stringId="encounter.vitals.table.column.measure" fallback="Measure" />,
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
    // create a column for each reading
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
            onCellClick(cells[date]);
          };
          const isCurrent = component.visibilityStatus === VISIBILITY_STATUSES.CURRENT;
          const isValid = isCurrent ? true : Boolean(value);
          const shouldBeClickable = isEditEnabled && isCalculatedQuestion === false && isValid;
          return (
            <RangeValidatedCell
              value={value}
              config={config}
              validationCriteria={{ normalRange: getNormalRangeByAge(validationCriteria, patient) }}
              isEdited={historyLogs.length > 1}
              onClick={shouldBeClickable ? handleCellClick : null}
              ValueWrapper={VitalsLimitedLinesCell}
            />
          );
        },
        exportOverrides: {
          title: getExportOverrideTitle(date),
        },
      })),
  ];
};
