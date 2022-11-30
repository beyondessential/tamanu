import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { keyBy } from 'lodash';
import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';

function unitDisplay(amount, config = '{}') {
  try {
    const { unit = '', rounding = 0, accessor } = JSON.parse(config);
    if (typeof accessor === 'function') {
      return accessor({ amount });
    }

    if (parseFloat(amount)) {
      return `${parseFloat(amount).toFixed(rounding)}${unit}`;
    }
    if (typeof amount === 'string') {
      return capitaliseFirstLetter(amount);
    }
    return '-';
  } catch (e) {
    // do nothing
  }
  return amount;
}

const useVitals = encounterId => {
  const api = useApi();

  const query = useQuery(['encounterVitals', encounterId], () =>
    api.get(`encounter/${encounterId}/vitals`),
  );

  let readings = [];
  const data = query?.data?.data || [];

  if (data.length > 0) {
    // Use the first response answers as the columns list
    const measuresList = data[0].answers.map(x => x.name).filter(name => name !== 'Date');

    const answersLibrary = data.map(({ answers, ...record }) => ({
      ...record,
      ...keyBy(answers, 'name'),
    }));

    readings = measuresList.map(measureName => ({
      title: measureName,
      ...answersLibrary.reduce((state, answer) => {
        return {
          ...state,
          [answer.dateRecorded]: unitDisplay(answer[measureName].value, answer[measureName].config),
        };
      }, {}),
    }));
  }

  return { ...query, data, readings };
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
      .filter(r => !!r.dateRecorded)
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
