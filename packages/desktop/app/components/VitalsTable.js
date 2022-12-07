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
  if (!amount) return '-';
  if (typeof accessor === 'function') {
    return accessor({ amount });
  }

  if (parseFloat(amount)) {
    return `${parseFloat(amount).toFixed(rounding)}${unit}`;
  }
  if (typeof amount === 'string') {
    return capitaliseFirstLetter(amount);
  }
  return amount;
}

function rangeAlert(amount, validationCriteria, config) {
  const { normalRange } = validationCriteria || {};
  const { unit = '' } = config || {};
  if (!normalRange) return null;

  const val = parseFloat(amount);
  let tooltip = 'Outside normal range\n';

  if (val < normalRange.min) {
    tooltip += `<${normalRange.min}${unit}`;
  } else if (val > normalRange.max) {
    tooltip += `>${normalRange.max}${unit}`;
  } else {
    return null;
  }

  return {
    tooltip,
    severity: 'alert',
  };
}

function rangeInfo(validationCriteria, config) {
  const { normalRange } = validationCriteria || {};
  const { unit = '' } = config || {};
  if (!normalRange) return null;
  return {
    tooltip: `Normal range ${normalRange.min}${unit} - ${normalRange.max}${unit}`,
    severity: 'info',
  };
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
          ...rangeInfo(validationCriteria, config),
        },
        ...recordings.reduce((state, date) => {
          const answer = records[date] || null;
          return {
            ...state,
            [date]: {
              value: unitDisplay(answer, config),
              ...rangeAlert(answer, validationCriteria, config),
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
    severity === 'alert' ? 'rgba(247, 104, 83, 0.2)' : 'transparent'};
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px ${({ severity }) => (severity === 'alert' ? '0px' : '-14px')};
  width: fit-content;
`;

const VitalHeadCellWrapper = styled.div`
  span:last-child {
    color: ${Colors.midText};
    display: block;
  }
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

const VitalsHeadCell = React.memo(({ date }) => {
  return (
    <VitalHeadCellWrapper>
      <DateDisplay date={date} />
      <DateDisplay disableTooltip showTime showDate={false} date={date} />
    </VitalHeadCellWrapper>
  );
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
      accessor: c => <VitalsCell {...c.title} />,
    },
    ...recordings
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <VitalsHeadCell date={r} />,
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
