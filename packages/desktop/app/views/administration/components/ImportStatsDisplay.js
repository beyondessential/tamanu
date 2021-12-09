import React from 'react';
import styled from 'styled-components';

import { Table } from '../../../components/Table';

export const ImportStatsDisplay = ({ stats = {} }) => {
  const { total, ...records } = stats.records;
  const rows = Object.entries(records).map(([k, v]) => (
    <tr key={k}>
      <td>{k}</td>
      <td>{v}</td>
    </tr>
  ));
  return (
    <table>
      {rows}
      <tr>
        <td>TOTAL</td>
        <td>{total}</td>
      </tr>
    </table>
  );
};
