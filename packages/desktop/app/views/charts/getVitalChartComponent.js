import { VITAL_CHARTS, BLOOD_PRESSURE, LINE } from '@tamanu/shared/constants';
import { BloodPressureVitalChartView } from './BloodPressureVitalChartView';
import { VitalLineChartView } from './VitalLineChartView';

const VITAL_CHARTS_MAPPING = {
  [BLOOD_PRESSURE]: BloodPressureVitalChartView,
  [LINE]: VitalLineChartView,
};

export const getVitalChartComponent = chartKey => {
  const chartType = VITAL_CHARTS[chartKey];
  const VitalChartComponent = VITAL_CHARTS_MAPPING[chartType];
  return VitalChartComponent;
};
