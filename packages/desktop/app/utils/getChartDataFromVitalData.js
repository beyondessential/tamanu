// const exampleData = {
//   value: 'SBP (mm Hg)',
//   validationCriteria: {
//     min: 0,
//     max: 300,
//     normalRange: {
//       min: 90,
//       max: 120,
//     },
//   },
//   config: {
//     unit: 'mm Hg',
//   },
//   '2022-11-29 10:09:59': {
//     validationCriteria: {
//       min: 0,
//       max: 300,
//       normalRange: {
//         min: 90,
//         max: 120,
//       },
//     },
//     config: {
//       unit: 'mm Hg',
//     },
//   },
// };
export const getChartDataFromVitalData = data => {
  const chartData = [];
  const chartConfigs = {
    interval: 1,
  };

  Object.entries(data).forEach(([key, dt]) => {
    if (dt?.value) {
      chartData.push({
        name: key,
        value: dt.value,
      });
    } else {
      chartConfigs[key] = dt;
    }
  });

  const { validationCriteria } = chartConfigs;

  const yAxisConfigs = {
    graphRange: {
      min: validationCriteria.min || validationCriteria.normalRange.min,
      max: validationCriteria.max || validationCriteria.normalRange.max,
    },
    normalRange: validationCriteria.normalRange,
    interval: chartConfigs.interval,
  };

  return { chartData, yAxisConfigs };
};
