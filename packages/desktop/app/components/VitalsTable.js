import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { Table } from './Table';
import { formatLong, formatShortest, formatTime } from './DateDisplay';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';
import { Colors } from '../constants';
import { TableTooltip } from './Table/TableTooltip';
import { useVitalsSurvey } from '../api/queries';

function formatAnswer(amount, config) {
  const { rounding = 0, accessor } = config || {};
  if (!amount) return '-';
  if (typeof accessor === 'function') {
    return accessor({ amount });
  }

  if (parseFloat(amount)) {
    return parseFloat(amount).toFixed(rounding);
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

  const { data: vitalsSurvey, error: vitalsError } = useVitalsSurvey();
  const error = query.error || vitalsError;

  let readings = [];
  let recordings = [];
  const data = query?.data?.data || [];

  if (data.length > 0 && vitalsSurvey) {
    // Use the Date answers as the list of recordings
    recordings = Object.keys(
      data.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded).records,
    );
    const elementIdToAnswer = data.reduce((dict, a) => ({ ...dict, [a.dataElementId]: a }), {});
    readings = vitalsSurvey.components
      .filter(component => component.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
      .map(({ config, validationCriteria, dataElement }) => {
        const { records = {} } = elementIdToAnswer[dataElement.id] || {};
        return {
          title: {
            value: dataElement.name,
            ...rangeInfo(validationCriteria, config),
          },
          ...recordings.reduce((state, date) => {
            const answer = records[date];
            return {
              ...state,
              [date]: {
                value: formatAnswer(answer, config),
                ...rangeAlert(answer, validationCriteria, config),
              },
            };
          }, {}),
        };
      });
  }

  return {
    ...query,
    data: readings,
    recordings,
    error,
  };
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
      width: 160px;
      min-width: 160px;
    }

    tbody tr td:first-child {
      background: ${Colors.white};
    }

    tfoot tr td button {
      position: sticky;
      left: 16px;
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

const VitalsHeadCellWrapper = styled.div`
  display: block;
  width: fit-content;
  div {
    color: ${Colors.midText};
    :first-child {
      color: ${Colors.darkText};
    }
  }
`;

const VitalsHeadCell = React.memo(({ date }) => (
  <TableTooltip title={formatLong(date)}>
    <VitalsHeadCellWrapper>
      <div>{formatShortest(date)}</div>
      <div>{formatTime(date)}</div>
    </VitalsHeadCellWrapper>
  </TableTooltip>
));

const VitalsCell = React.memo(({ value, tooltip, severity }) =>
  tooltip ? (
    <TableTooltip title={tooltip}>
      <VitalsCellWrapper severity={severity}>{value}</VitalsCellWrapper>
    </TableTooltip>
  ) : (
    <VitalsCellWrapper>{value}</VitalsCellWrapper>
  ),
);

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
      sortable: false,
      accessor: c => <VitalsCell {...c.title} />,
    },
    ...recordings
      .sort((a, b) => b.localeCompare(a))
      .map(r => ({
        title: <VitalsHeadCell date={r} />,
        sortable: false,
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
