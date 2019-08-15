import React from 'react';
import { connect } from 'react-redux';

import { Table } from './Table';

const vitalsRows = [
  { key: 'height', title: 'Height' },
  { key: 'weight', title: 'Weight' },
  { key: 'temperature', title: 'Temperature' },
  { key: 'sbp', title: 'SBP' },
  { key: 'dbp', title: 'DBP' },
  { key: 'heartRate', title: 'Heart rate' },
  { key: 'respiratoryRate', title: 'Respiratory rate' },
];

const DumbVitalsTable = React.memo(({ readings }) => {
  // create a column for each reading
  const dataColumns = [
    { key: 'title', title: 'Measure' },
    ...readings.map(r => ({
      title: r.dateRecorded,
      key: r.dateRecorded,
    })),
  ];
  // function to create an object containing a single metric's value for each reading
  const dateZip = key =>
    readings.reduce(
      (state, current) => ({
        ...state,
        [current.dateRecorded]: current[key].toFixed(1),
      }),
      {},
    );
  // assemble the rows for the table
  const rows = vitalsRows.map(row => ({
    title: row.title,
    ...dateZip(row.key),
  }));
  // and return the table
  return <Table columns={dataColumns} data={rows} />;
});

export const VitalsTable = connect(state => ({ readings: state.visit.vitals }))(DumbVitalsTable);
