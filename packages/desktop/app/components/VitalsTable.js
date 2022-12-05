import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { Tooltip } from '@material-ui/core';
import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';
import { Colors } from '../constants';

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
        title: name,
        tooltip: rangeInfo(validationCriteria, config),
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
    severity === 'warning' ? 'rgba(247, 104, 83, 0.2)' : 'transparent'}
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px 0;
  width: fit-content;
`;

const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
    max-width: 500px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    text-align: center;
    & .MuiTooltip-arrow {
      color: ${Colors.primaryDark};
    }
  }
`;

const VitalsCell = React.memo(({ value, tooltip, severity }) => {
  if (tooltip) {
    return (
      <StyledTooltip arrow placement="top" title={tooltip}>
        <VitalsCellWrapper severity={severity}>
          <div>{value}</div>
        </VitalsCellWrapper>
      </StyledTooltip>
    );
  }
  return value;
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
      accessor: c => <VitalsCell tooltip={c.tooltip} value={c.title} />,
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
