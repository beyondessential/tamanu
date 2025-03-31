import React from 'react';

export const ImportStatsDisplay = ({ stats = {} }) => {
  const { total, ...records } = stats.records;
  const rows = Object.entries(records).map(([k, v]) => (
    <tr key={k} data-test-id='tr-ixwd'>
      <td data-test-id='td-ylha'>{k}</td>
      <td data-test-id='td-bwzv'>{v}</td>
    </tr>
  ));
  return (
    <table data-test-id='table-26yv'>
      {rows}
      <tr data-test-id='tr-oac8'>
        <td data-test-id='td-rnkf'>TOTAL</td>
        <td data-test-id='td-un7r'>{total}</td>
      </tr>
    </table>
  );
};
