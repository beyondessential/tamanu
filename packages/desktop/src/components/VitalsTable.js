import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';

const vitalsRows = [
  { key: 'height', title: 'Height', rounding: 0, unit: 'cm' },
  { key: 'weight', title: 'Weight', rounding: 1, unit: 'kg' },
  { key: 'temperature', title: 'Temperature', rounding: 1, unit: 'ºC' },
  { key: 'sbp', title: 'SBP', rounding: 0, unit: '' },
  { key: 'dbp', title: 'DBP', rounding: 0, unit: '' },
  { key: 'heartRate', title: 'Heart rate', rounding: 0, unit: '/min' },
  { key: 'respiratoryRate', title: 'Respiratory rate', rounding: 0, unit: '/min' },
  { key: 'spo2', title: 'SpO2', rounding: 0, unit: '%' },
  { key: 'avpu', title: 'AVPU', unit: '/min' },
];

function unitDisplay({ amount, unit, rounding }) {
  if (typeof amount === 'string') return capitaliseFirstLetter(amount);
  if (typeof amount !== 'number') return '-';

  return `${amount.toFixed(rounding)}${unit}`;
}

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const api = useApi();
  const { data, error, isLoading } = useQuery(['encounterVitals', encounter.id], () =>
    api.get(`encounter/${encounter.id}/vitals`),
  );
  const readings = data?.data || [];

  // create a column for each reading
  const dataColumns = [
    { key: 'title', title: 'Measure' },
    ...readings
      .sort((a, b) => b.dateRecorded.localeCompare(a.dateRecorded))
      .map(r => ({
        title: <DateDisplay showTime date={r.dateRecorded} />,
        key: r.dateRecorded,
      })),
  ];
  // function to create an object containing a single metric's value for each reading
  const transposeColumnToRow = ({ key, rounding, unit }) =>
    readings.reduce(
      (state, current) => ({
        ...state,
        [current.dateRecorded]: unitDisplay({
          amount: current[key],
          rounding,
          unit,
        }),
      }),
      {},
    );
  // assemble the rows for the table
  const rows = vitalsRows.map(row => ({
    title: row.title,
    ...transposeColumnToRow(row),
  }));
  // and return the table
  return (
    <Table
      columns={dataColumns}
      data={rows}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
});
