export const DEFAULT_Y_AXIS_CONFIGS = {
  'Temperature (°C)': {
    graphRange: {
      min: 33,
      max: 41,
    },
    normalRange: { min: 35, max: 39 },
    interval: 1,
  },
  'Heart Rate (BPM)': {
    graphRange: {
      min: 20,
      max: 180,
    },
    normalRange: { min: 40, max: 130 },
    interval: 10,
  },
  'Respiratory Rate (BPM)': {
    graphRange: {
      min: 0,
      max: 40,
    },
    normalRange: { min: 5, max: 30 },
    interval: 5,
  },
  'SPO2 (%)': {
    graphRange: {
      min: 80,
      max: 100,
    },
    normalRange: { min: 85, max: 100 },
    interval: 5,
  },
};
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
export const getChartDataFromVitalData = (data, chartKey) => {
  if (!data) {
    return {
      chartData: [],
      yAxisConfigs: DEFAULT_Y_AXIS_CONFIGS[chartKey],
    };
  }

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

  // const { validationCriteria } = chartConfigs;
  // const yAxisConfigs = {
  //   graphRange: {
  //     min: validationCriteria.min || validationCriteria.normalRange.min,
  //     max: validationCriteria.max || validationCriteria.normalRange.max,
  //   },
  //   normalRange: validationCriteria.normalRange,
  //   interval: chartConfigs.interval,
  // };

  const yAxisConfigs = DEFAULT_Y_AXIS_CONFIGS[data.value];

  return { chartData, yAxisConfigs };
};
