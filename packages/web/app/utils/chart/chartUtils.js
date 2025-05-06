import { SURVEY_TYPES } from '@tamanu/constants';

import { COMPLEX_CHART_FORM_MODES } from '../../components/Charting/constants';

export const getComplexChartFormMode = (chartSurvey) => {
  switch (chartSurvey?.surveyType) {
    case SURVEY_TYPES.COMPLEX_CHART_CORE:
      return COMPLEX_CHART_FORM_MODES.ADD_CHART_INSTANCE;
    case SURVEY_TYPES.COMPLEX_CHART:
      return COMPLEX_CHART_FORM_MODES.RECORD_CHART_ENTRY;
    default:
      return null;
  }
};
