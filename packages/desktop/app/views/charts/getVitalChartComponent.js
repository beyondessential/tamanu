import { VITAL_CHARTS, BLOOD_PRESSURE, LINE } from '@tamanu/constants/surveys';
import { VitalBloodPressureChart } from './VitalBloodPressureChart';
import { VitalLineChart } from './VitalLineChart';

const VITAL_CHARTS_MAPPING = {
  [BLOOD_PRESSURE]: VitalBloodPressureChart,
  [LINE]: VitalLineChart,
};

export const getVitalChartComponent = chartKey => {
  const chartType = VITAL_CHARTS[chartKey];
  if (!chartType) {
    return VitalLineChart;
  }

  const VitalChartComponent = VITAL_CHARTS_MAPPING[chartType];
  return VitalChartComponent;
};
