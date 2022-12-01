import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';
import { Colors } from '../constants';

function unitDisplay(amount, config) {
  try {
    const { unit = '', rounding = 0, accessor } = JSON.parse(config || '{}');
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
    api.get(`encounter/${encounterId}/vitals`, { rowsPerPage: 50 }),
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
      .filter(vital => vital.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
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

const StyledTable = styled(Table)`
  table {
    position: relative;
    thead tr th:first-child,
    tbody tr td:first-child {
      left: 0;
      position: sticky;
      z-index: 1;
      border-right: 1px solid ${Colors.outline};
    }

    thead tr th:first-child {
      background: ${Colors.background};
      min-width: 160px;
    }

    tbody tr td:first-child {
      background: ${Colors.white};
    }
  }
`;

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordings, error, isLoading } = useVitals(encounter.id);

  if (isLoading) {
    return 'loading...';
  }

  // create a column for each reading
  const columns = [
    { key: 'title', title: 'Measure', width: 145 },
    ...recordings
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <DateDisplay showTime date={r} />,
        key: r,
      })),
  ];

  return (
    <StyledTable
      columns={columns}
      data={data}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
});
