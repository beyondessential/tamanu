import React from 'react';

export const ImportStatsDisplay = ({ stats = {} }) => {
  const { total, ...records } = stats.records;
  const rows = Object.entries(records).map(([k, v]) => (
    <tr data-testid={`tr-35kg-${k}`} key={k}>
      <td>{k}</td>
      <td>{v}</td>
    </tr>
  ));
  return (
    <table>
      {rows}
      <tr data-testid="tr-gh3g">
        <td>TOTAL</td>
        <td>{total}</td>
      </tr>
    </table>
  );
};
