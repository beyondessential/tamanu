import React from 'react';

import { 
  LineChart,
  XAxis,
  YAxis,
  Line,
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

export const ReportGraph = ({ data }) => (
  <div style={ graphStyle }>
    <ResponsiveContainer>
      <LineChart data={data}>
        <XAxis dataKey="formatted"/>
        <YAxis/>
        <Tooltip />
        <CartesianGrid stroke="#eee" />
        <Line 
          type="monotone" 
          isAnimationActive={ false } 
          dataKey="amount" 
          stroke="#000" 
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
