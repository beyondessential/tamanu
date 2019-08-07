import React from 'react';

import {
  Cell,
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
const palette = [
  '#2f4358',
  '#ffdb00',
  '#2a6790',
  '#E16338',
  '#279D64',
  '#876C43',
  '#4312AE',
  '#E9FB00',
  '#8206A9',
];

const graphRenderers = {
  line: data => (
    <LineChart data={data}>
      <XAxis dataKey="formatted" />
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#eee" />
      <Line type="monotone" isAnimationActive={false} dataKey="amount" stroke="#000" />
    </LineChart>
  ),
  bar: data => (
    <BarChart data={data.sort((a, b) => a.formatted.localeCompare(b.formatted))}>
      <XAxis dataKey="formatted" />
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#eee" />
      <Bar isAnimationActive={false} dataKey="amount" stroke="#2f4358" fill="#ffdb00" />
    </BarChart>
  ),
  pie: data => (
    <PieChart>
      <Pie
        data={data.sort((a, b) => a.amount - b.amount)}
        dataKey="amount"
        nameKey="formatted"
        startAngle={90}
        endAngle={360 + 90}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${entry.id}`} fill={palette[index % palette.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  ),
};

// this has to be a function, not a component, as recharts
// will break if its components get wrapped in non-recharts
// components
const renderGraph = (report, data) => {
  const render = graphRenderers[report.graphType] || graphRenderers.line;
  return render(data);
};

export const ReportGraph = ({ report, data }) => (
  <div style={graphStyle}>
    <ResponsiveContainer>{renderGraph(report, data)}</ResponsiveContainer>
  </div>
);
