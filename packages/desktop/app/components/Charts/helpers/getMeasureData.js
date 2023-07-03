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
      data.value < yAxis.graphRange.min ? `< ${yAxis.graphRange.min}` : `> ${yAxis.graphRange.max}`
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

export const DISPLAY_VALUE_KEY = 'displayValue';

export const getMeasureData = (rawData, visualisationConfig, useInwardArrowVector) => {
  const { yAxis } = visualisationConfig;

  return rawData
    .map(d => {
      const isInsideNormalRange =
        d.value >= yAxis.normalRange.min && d.value <= yAxis.normalRange.max;
      const isOutsideGraphRange = d.value < yAxis.graphRange.min || d.value > yAxis.graphRange.max;

      const dotColor = getDotColor({
        isInsideNormalRange,
        isOutsideGraphRange,
        useInwardArrowVector,
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
    })
    .sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        throw new Error('Two vital records share the same date and time');
      }
      return a.timestamp - b.timestamp;
    });
};
