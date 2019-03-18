import React from 'react';

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const graphStyle = {
  padding: '0 3em',
  margin: 'auto',
  height: '20em',
  display: 'block',
};

const graphRenderers = {
  line: (data) => (
    <LineChart data={data}>
      <XAxis dataKey="formatted" />
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#eee" />
      <Line
        type="monotone"
        isAnimationActive={false}
        dataKey="amount"
        stroke="#000"
      />
    </LineChart>
  ),
  bar: (data) => (
    <BarChart
      data={data.sort((a, b) => a.formatted.localeCompare(b.formatted))}
    >
      <XAxis dataKey="formatted" />
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#eee" />
      <Bar
        isAnimationActive={false}
        dataKey="amount"
        stroke="#000"
      />
    </BarChart>
  ),
  pie: (data) => (
    <PieChart>
      <Pie
        data={data.sort((a, b) => a.amount - b.amount)}
        dataKey="amount"
        nameKey="formatted"
        startAngle={90}
        endAngle={360 + 90}
      />
      <Tooltip />
      <Legend />
    </PieChart>
  ),

};

// this has to be a function, not a component, as recharts
// will break if its components get wrapped in non-recharts
// components
function renderGraph(report, data) {
  const render = graphRenderers[report.graphType] || graphRenderers.line;
  return render(data);
}

export const ReportGraph = ({ report, data }) => (
  <div style={graphStyle}>
    <ResponsiveContainer>
      { renderGraph(report, data) }
    </ResponsiveContainer>
  </div>
);
