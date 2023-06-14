import { Colors } from '../../../constants';

const getDotColor = ({ isInsideNormalRange, isOutsideGraphRange }) => {
  let color = Colors.blue;
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

const getYValue = ({ data, isOutsideGraphRange, yAxis }) => {
  let yValue = data.value;
  if (isOutsideGraphRange) {
    yValue = data.value < yAxis.graphRange.min ? yAxis.graphRange.min : yAxis.graphRange.max;
  }
  return yValue;
};

export const getMeasureData = (rawData, yAxis) => {
  return rawData
    .map(d => {
      const isInsideNormalRange =
        d.value >= yAxis.normalRange.min && d.value <= yAxis.normalRange.max;
      const isOutsideGraphRange = d.value < yAxis.graphRange.min || d.value > yAxis.graphRange.max;

      const dotColor = getDotColor({ isInsideNormalRange, isOutsideGraphRange });
      const yValue = getYValue({ data: d, isOutsideGraphRange, yAxis });
      const description = getDescription({
        data: d,
        isInsideNormalRange,
        isOutsideGraphRange,
        yAxis,
      });

      return {
        ...d,
        timestamp: Date.parse(d.name),
        yValue,
        dotColor,
        description,
      };
    })
    .sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        throw new Error('Two vital records share the same date and time');
      }
      return a.timestamp - b.timestamp;
    });
};
