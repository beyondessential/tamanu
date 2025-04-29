import { BLOOD_PRESSURE, LINE, VITAL_CHARTS } from '@tamanu/constants/surveys';
import { VitalBloodPressureChart } from './VitalBloodPressureChart';
import { VitalLineChart } from './VitalLineChart';

const VITAL_GRAPHS_MAPPING = {
  [BLOOD_PRESSURE]: VitalBloodPressureChart,
  [LINE]: VitalLineChart,
};

const getVitalGraphComponent = (chartKey) => {
  const chartType = VITAL_CHARTS[chartKey];
  if (!chartType) {
    return VitalLineChart;
  }

  const VitalGraphComponent = VITAL_GRAPHS_MAPPING[chartType];
  return VitalGraphComponent;
}

const getChartGraphComponent = () => {
  return VitalLineChart;
}

export const getVitalChartComponent = (chartKey, isVital) => {
  if (isVital) {
    return getVitalGraphComponent(chartKey);
  }
  return getChartGraphComponent();
};
