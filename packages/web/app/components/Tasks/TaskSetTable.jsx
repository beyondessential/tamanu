import React from 'react';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import styled from 'styled-components';
import { Table } from '../Table';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { useTableSorting } from '../Table/useTableSorting';

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
`;

const StyledTable = styled(Table)`
  margin-bottom: 20px;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  box-shadow: none;

  table {
    padding-left: 9px;
    padding-right: 21px;
    padding-bottom: 16px;
  }

  table thead th {
    background-color: ${Colors.white} !important;
    border-bottom: 1px solid ${Colors.outline};
    padding: 13px 0 12px 2px;
    padding-left: 2px !important;
    width: 30%;
    &: 4th-child {
      width: 10%;
    }
  }

  table thead th tr {
    font-size: 14px;
    font-style: normal;
    line-height: 18px;
  }

  table tbody td {
    padding-left: 2px !important;
    padding-top: 10px !important;
    padding-bottom: 0 !important;
    border-bottom: none;
  }
`;

const getDesignations = ({ taskTemplate }) => {
  if (!taskTemplate?.designations?.length) return '-';
  const designations = taskTemplate.designations.map(({ designation }) => designation.name);
  return designations.join(', ');
};

const COLUMNS = [
  {
    key: 'name',
    title: (
      <TranslatedText
        stringId="addTask.taskSet.table.column.taskSetList"
        fallback="Task set list"
        data-testid="translatedtext-jhvi"
      />
    ),
    sortable: false,
  },
  {
    key: 'assignedTo',
    title: (
      <TranslatedText
        stringId="addTask.taskSet.table.column.assignedTo"
        fallback="Assigned to"
        data-testid="translatedtext-qsbt"
      />
    ),
    accessor: getDesignations,
    sortable: false,
  },
  {
    key: 'frequency',
    title: (
      <TranslatedText
        stringId="addTask.taskSet.table.column.frequency"
        fallback="Frequency"
        data-testid="translatedtext-zm16"
      />
    ),
    accessor: ({ taskTemplate }) => {
      const { frequencyValue, frequencyUnit } = taskTemplate ?? {};
      return frequencyValue && frequencyUnit ? (
        `${frequencyValue} ${frequencyUnit}${Number(frequencyValue) > 1 ? 's' : ''}`
      ) : (
        <TranslatedText
          stringId="encounter.tasks.table.once"
          fallback="Once"
          data-testid="translatedtext-wm2y"
        />
      );
    },
    sortable: false,
  },
  {
    key: 'High priority',
    title: (
      <TranslatedText
        stringId="addTask.taskSet.table.column.highPriority"
        fallback="High priority"
        data-testid="translatedtext-65on"
      />
    ),
    accessor: ({ taskTemplate }) =>
      taskTemplate?.highPriority ? (
        <StyledPriorityHighIcon data-testid="styledpriorityhighicon-0wlt" />
      ) : (
        ''
      ),
    sortable: false,
  },
];

export const TaskSetTable = ({ tasks }) => {
  const { orderBy, order, customSort } = useTableSorting({
    initialSortKey: 'name',
    initialSortDirection: 'asc',
  });
  return (
    <StyledTable
      data={tasks}
      columns={COLUMNS}
      allowExport={false}
      disablePagination
      orderBy={orderBy}
      order={order}
      customSort={customSort}
      data-testid="styledtable-19bp"
    />
  );
};
