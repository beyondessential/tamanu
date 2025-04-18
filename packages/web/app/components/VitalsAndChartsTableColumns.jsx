import React from 'react';
import styled from 'styled-components';
import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES, USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { formatShortest, formatTimeWithSeconds } from '@tamanu/utils/dateTime';
import { Box, CircularProgress, IconButton as IconButtonComponent } from '@material-ui/core';
import {
  DateHeadCell,
  LimitedLinesCell,
  RangeTooltipCell,
  RangeValidatedCell,
} from './FormattedTableCell';
import { DateDisplay } from './DateDisplay';
import { VitalVectorIcon } from './Icons/VitalVectorIcon';
import { useVitalChartData } from '../contexts/VitalChartData';
import { getNormalRangeByAge } from '../utils';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { TranslatedText } from './Translation/TranslatedText';
import { useChartData } from '../contexts/ChartData';

const getExportOverrideTitle = date => {
  const shortestDate = DateDisplay.stringFormat(date, formatShortest);
  const timeWithSeconds = DateDisplay.stringFormat(date, formatTimeWithSeconds);
  return `${shortestDate} ${timeWithSeconds}`;
};
const IconButton = styled(IconButtonComponent)`
  padding: 9px 5px;
`;

const VitalsLimitedLinesCell = ({ value }) => (
  <LimitedLinesCell value={value} maxWidth="75px" maxLines={2} />
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
    allGraphedChartKeys,
    setChartKeys,
    setModalTitle,
    setVitalChartModalOpen,
    setIsInMultiChartsView,
  } = useVitalChartData();
  const { selectedChartTypeId } = useChartData();
  const { data: userPreferences, isSuccess, isLoading } = useUserPreferencesQuery();

  const graphPreferenceKey = selectedChartTypeId === null
    ? USER_PREFERENCES_KEYS.SELECTED_GRAPHED_VITALS_ON_FILTER
    : USER_PREFERENCES_KEYS.SELECTED_GRAPHED_CHARTS_ON_FILTER;

  let chartKeys = [];
  if (isSuccess) {
    const {
      [graphPreferenceKey]: rawGraphFilter = 'select-all',
    } = userPreferences;
    const graphFilter = rawGraphFilter.trim();

    chartKeys = ['select-all', ''].includes(graphFilter)
      ? allGraphedChartKeys
      : graphFilter.split(',').filter(key => allGraphedChartKeys.includes(key));
  }

  return (
    <Box flexDirection="row" display="flex" alignItems="center" justifyContent="space-between">
      {value}
      {isSuccess && allGraphedChartKeys.length > 0 && (
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

export const getChartsTableColumns = (
  firstColKey,
  firstColTitle,
  patient,
  recordedDates,
  onCellClick,
  isEditEnabled = true,
) => {
  return [
    {
      key: firstColKey,
      title: firstColTitle,
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

export const getVitalsTableColumns = (patient, recordedDates, onCellClick, isEditEnabled) => {
  return getChartsTableColumns(
    'measure',
    <TranslatedText stringId="encounter.vitals.table.column.measure" fallback="Measure" />,
    patient,
    recordedDates,
    onCellClick,
    isEditEnabled,
  );
};
