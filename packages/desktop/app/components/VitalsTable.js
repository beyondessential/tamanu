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
import { getConfigObject, getValidationCriteriaObject } from '../utils';

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

function parseNumericAnswer(answer) {
  const value = parseFloat(answer);
  if (isNaN(value)) return null;
  return value;
}

function getVitalsCellTooltip(value, validationCriteria, config) {
  const { unit = '', rounding = 0 } = config || {};
  const { normalRange } = validationCriteria || {};
  const isWithinRange = !normalRange || (value <= normalRange.max && value >= normalRange.min);
  if (isWithinRange) {
    if (!unit || unit.length <= 2) return null;
    // Show tooltip to show full value and unit
    const fixedVal = value.toFixed(rounding);
    return {
      tooltip: `${fixedVal}${unit}`,
      severity: 'info',
    };
  }
  // Show Outside range tooltip
  let tooltip = `Outside normal range\n`;

  if (value < normalRange.min) {
    tooltip += `<${normalRange.min}${unit}`;
  } else if (value > normalRange.max) {
    tooltip += `>${normalRange.max}${unit}`;
  }

  return {
    tooltip,
    severity: 'alert',
  };
}

function vitalsCellConfig(answer, validationCriteria, config) {
  const { rounding = 0, accessor, unit } = config || {};
  let value = answer;
  let tooltipConfig = null;
  const float = parseNumericAnswer(answer);
  if (float === null) {
    // Non-numeric value
    if (typeof accessor === 'function') {
      value = accessor({ amount: answer });
    } else {
      value = answer ? capitaliseFirstLetter(answer) : '-';
    }
  } else {
    // Numeric value
    tooltipConfig = getVitalsCellTooltip(float, validationCriteria, config);
    const showUnit = unit && unit.length <= 2;
    value = `${float.toFixed(rounding)}${showUnit ? unit : ''}`;
  }
  return { value, ...tooltipConfig };
}

function measureCellConfig(value, validationCriteria, config) {
  const { unit } = config || {};
  const { normalRange } = validationCriteria || {};
  const tooltip =
    normalRange && `Normal range ${normalRange.min}${unit} - ${normalRange.max}${unit}`;
  return {
    value,
    tooltip,
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

  let vitalsRecords = [];
  let recordedDates = [];
  const data = query?.data?.data || [];

  if (data.length > 0 && vitalsSurvey) {
    recordedDates = Object.keys(
      data.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded).records,
    );
    const elementIdToAnswer = data.reduce((dict, a) => ({ ...dict, [a.dataElementId]: a }), {});
    vitalsRecords = vitalsSurvey.components
      .filter(component => component.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
      .map(({ id, config, validationCriteria, dataElement }) => {
        const { records = {} } = elementIdToAnswer[dataElement.id] || {};
        const validationCriteriaObj = getValidationCriteriaObject(id, validationCriteria);
        const configObj = getConfigObject(id, config);
        return {
          title: measureCellConfig(dataElement.name, validationCriteriaObj, configObj),
          ...recordedDates.reduce((state, date) => {
            const answer = records[date];
            return {
              ...state,
              [date]: vitalsCellConfig(answer, validationCriteriaObj, configObj),
            };
          }, {}),
        };
      });
  }

  return {
    ...query,
    data: vitalsRecords,
    recordedDates,
    error,
  };
};

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
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);

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
    ...recordedDates
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
