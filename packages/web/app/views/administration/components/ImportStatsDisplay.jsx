import React from 'react';

export const ImportStatsDisplay = ({ stats = {} }) => {
  const { total, ...records } = stats.records;
  const rows = Object.entries(records).map(([k, v]) => (
    <tr key={k} data-testid='tr-ixwd'>
      <td data-testid='td-ylha'>{k}</td>
      <td data-testid='td-bwzv'>{v}</td>
    </tr>
  ));
  return (
    <table data-testid='table-26yv'>
      {rows}
      <tr data-testid='tr-oac8'>
        <td data-testid='td-rnkf'>TOTAL</td>
        <td data-testid='td-un7r'>{total}</td>
      </tr>
    </table>
  );
};
