import React from 'react';
import { SURVEY_TYPES } from '@tamanu/constants';

import { COMPLEX_CHART_FORM_MODES } from '../../components/Charting/constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const getComplexChartFormMode = chartSurvey => {
  switch (chartSurvey?.surveyType) {
    case SURVEY_TYPES.COMPLEX_CHART_CORE:
      return COMPLEX_CHART_FORM_MODES.ADD_CHART_INSTANCE;
    case SURVEY_TYPES.COMPLEX_CHART:
      return COMPLEX_CHART_FORM_MODES.RECORD_CHART_ENTRY;
    default:
      return null;
  }
};

export const findChartSurvey = (chartSurveys, chartId) =>
  chartSurveys.find(({ id }) => id === chartId);

export const getNoSelectableChartsMessage = () => (
  <TranslatedText
    stringId="chart.table.noSelectableCharts"
    fallback="There are currently no charts available to record. Please speak to your System Administrator if you think this is incorrect."
    data-testid="translatedtext-a37q"
  />
);

export const getNoDataMessage = (isComplexChart, complexChartInstances, selectedSurveyId) => {
  if (!selectedSurveyId) {
    return (
      <TranslatedText
        stringId="chart.table.simple.noChart"
        fallback="This patient has no chart records to display. Please select a chart to document a record."
        data-testid="translatedtext-h93c"
      />
    );
  }

  if (isComplexChart && !complexChartInstances?.length) {
    return (
      <TranslatedText
        stringId="chart.table.complex.noChart"
        fallback="This patient has no chart information to display. Click '+ Add' to add information to this chart."
        data-testid="translatedtext-1n1o"
      />
    );
  }

  return (
    <TranslatedText
      stringId="chart.table.noData"
      fallback="This patient has no chart information to display. Click 'Record' to add information to this chart."
      data-testid="translatedtext-jwyi"
    />
  );
};

export const getTooltipMessage = selectedSurveyId => {
  if (!selectedSurveyId) {
    return (
      <TranslatedText
        stringId="chart.action.record.disabledTooltip.noChartType"
        fallback="Please select a chart type to record an entry"
        data-testid="translatedtext-arpn"
      />
    );
  }

  return (
    <TranslatedText
      stringId="chart.action.record.disabledTooltip"
      fallback="'Add' an item first to record against"
      data-testid="translatedtext-zbwx"
    />
  );
};
