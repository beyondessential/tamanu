export const getChartDataFromVitalData = data => {
  if (!data) {
    return [];
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

  return chartData;
};
