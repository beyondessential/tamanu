import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants/surveys';
import { Colors } from '../../../constants';

const getDotColor = ({ isInsideNormalRange, isOutsideGraphRange, useInwardArrowVector }) => {
  let color = useInwardArrowVector ? Colors.darkestText : Colors.blue;
  if (!isInsideNormalRange) {
    color = Colors.alert;
  }
  if (isOutsideGraphRange) {
    color = Colors.darkestText;
  }
  return color;
};

const getDescription = ({ data, isInsideNormalRange, isOutsideGraphRange, yAxis }) => {
  let description = '';
  if (!isInsideNormalRange) {
    description += `(Outside normal range ${
      data.value < yAxis.normalRange.min
        ? `< ${yAxis.normalRange.min}`
        : `> ${yAxis.normalRange.max}`
    })`;
  }
  if (isOutsideGraphRange) {
    description += ' (Outside graph range)';
  }
  return description;
};

// If the value is outside the graph range, we want to display it within the graph range.
// https://www.figma.com/file/sy6gyLBPoSXuJNq5lEEOL8/Tamanu---UI-Pattern-(Updated-2022)?type=design&node-id=10539%3A143985&t=kItuRCmZOUi0QwCH-1
const getDisplayValue = ({ data, isOutsideGraphRange, yAxis }) => {
  let displayValue = data.value;
  if (isOutsideGraphRange) {
    displayValue = data.value < yAxis.graphRange.min ? yAxis.graphRange.min : yAxis.graphRange.max;
  }
  return displayValue;
};

// Alter descriptions cause otherwise is a bit involved and it's very specific
const getBloodPressureDescription = (description, key) => {
  if (description.length === 0) return description;
  const vitalSymbol = key === VITALS_DATA_ELEMENT_IDS.sbp ? 'SBP' : 'DBP';
  return description.replaceAll('(Outside', `(${vitalSymbol} outside`);
};

const getDefaultMeasureData = (rawData, visualisationConfig) => {
  const { yAxis } = visualisationConfig;
  return rawData.map(d => {
    const isInsideNormalRange =
      d.value >= yAxis.normalRange.min && d.value <= yAxis.normalRange.max;
    const isOutsideGraphRange = d.value < yAxis.graphRange.min || d.value > yAxis.graphRange.max;

    const dotColor = getDotColor({
      isInsideNormalRange,
      isOutsideGraphRange,
    });
    const displayValue = getDisplayValue({ data: d, isOutsideGraphRange, yAxis });
    const description = getDescription({
      data: d,
      isInsideNormalRange,
      isOutsideGraphRange,
      yAxis,
    });

    return {
      ...d,
      timestamp: Date.parse(d.name),
      [DISPLAY_VALUE_KEY]: displayValue,
      dotColor,
      description,
      visualisationConfig,
    };
  });
};

const getInwardArrowMeasureData = (rawData, visualisationConfig, secondaryConfig) => {
  const defaultMeasureData = getDefaultMeasureData(rawData, visualisationConfig);
  const { yAxis } = secondaryConfig;

  // Adjust shape calculations for secondary value in arrow vector
  // (currently this just applies to DBP in blood pressure).
  return defaultMeasureData.map(baseData => {
    const secondaryData = { value: baseData.inwardArrowVector.bottom };

    const isInsideNormalRange =
      secondaryData.value >= yAxis.normalRange.min && secondaryData.value <= yAxis.normalRange.max;
    const isOutsideGraphRange =
      secondaryData.value < yAxis.graphRange.min || secondaryData.value > yAxis.graphRange.max;

    const secondaryValueDotColor = getDotColor({
      isInsideNormalRange,
      isOutsideGraphRange,
    });
    const secondDescription = getDescription({
      data: secondaryData,
      isInsideNormalRange,
      isOutsideGraphRange,
      yAxis,
    });

    // Preserve the first one if its an alert, otherwise the secondary
    const finalDotColor =
      baseData.dotColor === Colors.alert ? Colors.alert : secondaryValueDotColor;

    return {
      ...baseData,
      dotColor: finalDotColor,
      description: getBloodPressureDescription(baseData.description, visualisationConfig.key),
      secondDescription: getBloodPressureDescription(secondDescription, secondaryConfig.key),
    };
  });
};

export const DISPLAY_VALUE_KEY = 'displayValue';

export const getMeasureData = (
  rawData,
  visualisationConfig,
  useInwardArrowVector,
  secondaryConfig,
) => {
  const measureData = useInwardArrowVector
    ? getInwardArrowMeasureData(rawData, visualisationConfig, secondaryConfig)
    : getDefaultMeasureData(rawData, visualisationConfig);

  return measureData.sort((a, b) => {
    return a.timestamp - b.timestamp;
  });
};
