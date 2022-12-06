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
import { TableTooltip } from './Table/TableTooltip';

function unitDisplay(amount, config) {
  const { unit = '', rounding = 0, accessor } = config || {};
  if (typeof accessor === 'function') {
    return accessor({ amount });
  }

  if (parseFloat(amount)) {
    return `${parseFloat(amount).toFixed(rounding)}${unit}`;
  }
  if (typeof amount === 'string') {
    return capitaliseFirstLetter(amount);
  }
  return amount || '-';
}

function unitWarning(amount, validationCriteria, config) {
  const { normalRange } = validationCriteria || {};
  const { unit = '' } = config || {};
  if (!normalRange) return null;

  const val = parseFloat(amount);
  const base = 'Outside normal range\n';

  if (val < normalRange.min) {
    return `${base} <${normalRange.min}${unit}`;
  }
  if (val > normalRange.max) {
    return `${base} >${normalRange.max}${unit}`;
  }
  return null;
}

function rangeInfo(validationCriteria, config) {
  const { normalRange } = validationCriteria || {};
  const { unit = '' } = config || {};
  if (!normalRange) return null;
  return `Normal range ${normalRange.min}${unit} - ${normalRange.max}${unit}`;
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
      .map(({ name, config, validationCriteria, records }) => ({
        title: {
          value: name,
          tooltip: rangeInfo(validationCriteria, config),
        },
        ...recordings.reduce((state, date) => {
          const answer = records[date] || null;
          return {
            ...state,
            [date]: {
              value: unitDisplay(answer, config),
              tooltip: unitWarning(answer, validationCriteria, config),
              severity: 'warning',
            },
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

const VitalsCellWrapper = styled.div`
  background: ${({ severity }) =>
    severity === 'warning' ? 'rgba(247, 104, 83, 0.2)' : 'transparent'};
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px ${({ severity }) => (severity === 'warning' ? '0px' : '-14px')};
  width: fit-content;
`;

const VitalsCell = React.memo(({ value, tooltip, severity }) => {
  if (tooltip) {
    return (
      <TableTooltip arrow placement="top" title={tooltip}>
        <VitalsCellWrapper severity={severity}>{value}</VitalsCellWrapper>
      </TableTooltip>
    );
  }
  return <VitalsCellWrapper>{value}</VitalsCellWrapper>;
});

export const VitalsTable = React.memo(() => {
  const { encounter } = useEncounter();
  const { data, recordings, error, isLoading } = useVitals(encounter.id);

  if (isLoading) {
    return 'loading...';
  }

  // create a column for each reading
  const columns = [
    {
      key: 'title',
      title: 'Measure',
      width: 145,
      accessor: c => <VitalsCell tooltip={c.title.tooltip} value={c.title.value} />,
    },
    ...recordings
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <DateDisplay showTime date={r} />,
        key: r,
        accessor: c => <VitalsCell {...c[r]} />,
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
