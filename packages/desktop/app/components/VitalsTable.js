import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
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
  let recordings = [];
  const data = query?.data?.data || [];

  if (data.length > 0) {
    // Use the Date answers as the list of recordings
    recordings = Object.keys(
      data.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded).records,
    );

    readings = data
      .filter(vital => vital.dataElementId !== 'pde-PatientVitalsDate')
      .map(({ name, config, records }) => ({
        title: name,
        ...recordings.reduce((state, date) => {
          const answer = records[date] || null;
          return {
            ...state,
            [date]: unitDisplay(answer, config),
          };
        }, {}),
      }));
  }

  return { ...query, data: readings, recordings };
};

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordings, error, isLoading } = useVitals(encounter.id);

  if (isLoading) {
    return 'loading...';
  }

  // create a column for each reading
  const columns = [
    { key: 'title', title: 'Measure' },
    ...recordings
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <DateDisplay showTime date={r} />,
        key: r,
      })),
  ];

  return (
    <Table
      columns={columns}
      data={data}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
});
