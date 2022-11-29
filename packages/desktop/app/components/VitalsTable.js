import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { keyBy } from 'lodash';
import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';

// Todo: add support for unit, rounding and accessor to survey
// const vitalsRows = [
//   { key: 'height', title: 'Height', rounding: 0, unit: 'cm' },
//   { key: 'weight', title: 'Weight', rounding: 1, unit: 'kg' },
//   {
//     key: 'temperature',
//     title: 'Temperature',
//     accessor: ({ amount, unitSettings }) => {
//       if (typeof amount !== 'number') return '-';
//
//       if (unitSettings?.temperature === 'fahrenheit') {
//         return `${convert(amount, 'celsius')
//         .to('fahrenheit')
//         .toFixed(1)}ºF`;
//       }
//
//       return `${amount.toFixed(1)}ºC`;
//     },
//   },
//   { key: 'sbp', title: 'SBP', rounding: 0, unit: '' },
//   { key: 'dbp', title: 'DBP', rounding: 0, unit: '' },
//   { key: 'heartRate', title: 'Heart rate', rounding: 0, unit: '/min' },
//   { key: 'respiratoryRate', title: 'Respiratory rate', rounding: 0, unit: '/min' },
//   { key: 'spo2', title: 'SpO2', rounding: 0, unit: '%' },
//   { key: 'avpu', title: 'AVPU', unit: '/min' },
// ];

function unitDisplay(amount, unit, rounding, accessor) {
  if (typeof accessor === 'function') {
    return accessor({ amount });
  }
  if (typeof amount === 'string') return capitaliseFirstLetter(amount);
  if (typeof amount !== 'number') return '-';

  return `${amount.toFixed(rounding)}${unit}`;
}

const useVitals = encounterId => {
  const api = useApi();

  const query = useQuery(['encounterVitals', encounterId], () =>
    api.get(`encounter/${encounterId}/vitals`),
  );

  let readings = [];

  if (query?.data?.data?.length > 0) {
    const { data } = query.data;
    // Use the first response answers as the columns list
    const measuresList = data[0].answers.map(x => x.name);

    const answersLibrary = data.map(({ answers, ...record }) => ({
      ...record,
      ...keyBy(answers, 'name'),
    }));

    readings = measuresList.map(measureName => ({
      title: measureName,
      ...answersLibrary.reduce(
        (state, answer) => ({
          ...state,
          [answer.dateRecorded]: unitDisplay(answer[measureName].value),
        }),
        {},
      ),
    }));
  }

  return { ...query, data: query?.data?.data, readings };
};

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, readings, error, isLoading } = useVitals(encounter.id);

  if (isLoading) {
    return 'loading...';
  }

  // create a column for each reading
  const columns = [
    { key: 'title', title: 'Measure' },
    ...data
      .sort((a, b) => b.dateRecorded.localeCompare(a.dateRecorded))
      .map(r => ({
        title: <DateDisplay showTime date={r.dateRecorded} />,
        key: r.dateRecorded,
      })),
  ];

  return (
    <Table
      columns={columns}
      data={readings}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
});
