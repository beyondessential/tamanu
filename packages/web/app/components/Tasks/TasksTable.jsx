import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import {
  BodyText,
  SmallBodyText,
  Table,
  formatShortest,
  formatTime,
  TranslatedText,
  useSelectableColumn,
} from '../.';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';

const mockData = [
  {
    id: 1,
    task: 'Change bedpan',
    dueAt: '2024-08-11 10:00:29.563+07',
    assignedTo: [
      {
        id: 'designation-Nursing',
        name: 'Nursing',
      },
    ],
    frequency: '2 hours',
    notes: '',
  },
  {
    id: 2,
    task: 'Contact patient family/caretaker',
    dueAt: '2024-08-11 10:00:29.563+07',
    assignedTo: [
      {
        id: 'designation-Nursing',
        name: 'Nursing',
      },
      {
        id: 'designation-SeniorNursing',
        name: 'Senior Nursing',
      },
    ],
    frequency: 'Once',
    notes: 'Lorem ipsum dolor sit',
  },
  {
    id: 3,
    task: 'Contact patient family/caretaker',
    dueAt: '2024-08-11 10:00:29.563+07',
    assignedTo: [
      {
        id: 'designation-Admin',
        name: 'Admin',
      },
    ],
    frequency: 'Once',
    notes: 'Lorem ipsum dolor sit ipsum dolor sit ',
  },
];

const StyledTable = styled(Table)`
  margin-top: 6px;
  box-shadow: none;
  border-left: none;
  border-right: none;
  border-radius: 0px;
  overflow: visible;
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    span {
      font-weight: 400;
      color: ${Colors.midText} !important;
    }
    padding-left: 7px;
    padding-right: 7px;
    &:last-child {
      padding-right: 20px;
    }
    &:first-child,
    &:nth-child(2) {
      padding-left: 0px;
    }
  }
  .MuiTableCell-body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    padding-left: 7px;
    padding-right: 7px;
    &:last-child {
      padding-right: 0px;
    }
    &:first-child,
    &:nth-child(2) {
      padding-left: 0px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      box-shadow: 10px 10px 15px 0px rgba(0, 0, 0, 0.1);
    }
    max-height: 42px;
  }
  .MuiFormControlLabel-root {
    margin-right: 1px;
  }
  .MuiCheckbox-root {
    padding: 0 8px 0 0;
  }
`;

const StatusTodo = styled.div`
  width: 15px;
  height: 15px;
  border: 1px dashed ${Colors.blue};
  border-radius: 50%;
`;

const BulkActions = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 5px;
`;

const NotesDisplay = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

const OverflowedBox = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IconButton = styled.div`
  cursor: pointer;
`;

const getStatus = () => {
  return <StatusTodo />;
};

const getDueAt = ({ dueAt }) => {
  return (
    <div>
      <BodyText sx={{ textTransform: 'lowercase' }}>{formatTime(dueAt)}</BodyText>
      <SmallBodyText color={Colors.midText}>{formatShortest(dueAt)}</SmallBodyText>
    </div>
  );
};

const AssignedToCell = ({ assignedTo }) => {
  if (!assignedTo?.length) return '';
  const [ref, isOverflowing] = useOverflow();

  const assignedToNames = assignedTo.map(assigned => assigned.name);
  return (
    <ConditionalTooltip visible={isOverflowing} title={assignedToNames.join(', ')}>
      <OverflowedBox ref={ref}>{assignedToNames.join(', ')}</OverflowedBox>
    </ConditionalTooltip>
  );
};

const NotesCell = ({ row, hoveredRow }) => {
  const [ref, isOverflowing] = useOverflow();

  return (
    <Box display="flex" alignItems="center">
      <NotesDisplay>
        <ConditionalTooltip visible={isOverflowing} title={row.notes}>
          <OverflowedBox ref={ref}>{row.notes}</OverflowedBox>
        </ConditionalTooltip>
      </NotesDisplay>
      {hoveredRow?.id === row?.id && (
        <BulkActions>
          <ThemedTooltip
            title={
              <TranslatedText stringId="encounter.tasks.action.tooltip.delete" fallback="Delete" />
            }
          >
            <IconButton>
              <DeleteOutlineIcon style={{ color: Colors.primary, fontSize: '20px' }} />
            </IconButton>
          </ThemedTooltip>
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="encounter.tasks.action.tooltip.notCompleted"
                fallback="Mark as not complete"
              />
            }
          >
            <IconButton>
              <CancelIcon style={{ color: Colors.alert, fontSize: '20px' }} />
            </IconButton>
          </ThemedTooltip>
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="encounter.tasks.action.tooltip.completed"
                fallback="Mark as complete"
              />
            }
          >
            <IconButton>
              <CheckCircleIcon style={{ color: Colors.green, fontSize: '20px' }} />
            </IconButton>
          </ThemedTooltip>
        </BulkActions>
      )}
    </Box>
  );
};

export const TasksTable = () => {
  const { selectedRows, selectableColumn } = useSelectableColumn(mockData, {
    bulkDeselectOnly: true,
  });
  const [hoveredRow, setHoveredRow] = useState();

  const COLUMNS = [
    {
      accessor: getStatus,
      maxWidth: 15,
      sortable: false,
    },
    {
      key: 'task',
      title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Task" />,
      maxWidth: 160,
    },
    {
      key: 'dueAt',
      title: <TranslatedText stringId="encounter.tasks.table.column.task" fallback="Due at" />,
      accessor: getDueAt,
      maxWidth: 60,
    },
    {
      key: 'assignedTo',
      title: (
        <TranslatedText stringId="encounter.tasks.table.column.assignedTo" fallback="Assigned to" />
      ),
      maxWidth: 100,
      sortable: false,
      accessor: ({ assignedTo }) => <AssignedToCell assignedTo={assignedTo} />,
    },
    {
      key: 'frequency',
      title: (
        <TranslatedText stringId="encounter.tasks.table.column.frequency" fallback="Frequency" />
      ),
      maxWidth: 90,
      sortable: false,
    },
    {
      key: 'notes',
      title: <TranslatedText stringId="encounter.tasks.table.column.notes" fallback="Notes" />,
      maxWidth: 155,
      accessor: row => <NotesCell row={row} hoveredRow={hoveredRow} />,
      sortable: false,
    },
  ];

  return (
    <div>
      {selectedRows.length > 0 && (
        <div>
          <Divider style={{ marginTop: '5px' }} />
          <BulkActions>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.notCompleted"
                  fallback="Mark as not complete"
                />
              }
            >
              <IconButton>
                <CancelIcon style={{ color: Colors.alert, fontSize: '20px' }} />
              </IconButton>
            </ThemedTooltip>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.completed"
                  fallback="Mark as complete"
                />
              }
            >
              <IconButton>
                <CheckCircleIcon style={{ color: Colors.green, fontSize: '20px' }} />
              </IconButton>
            </ThemedTooltip>
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="encounter.tasks.action.tooltip.delete"
                  fallback="Delete"
                />
              }
            >
              <IconButton>
                <DeleteOutlineIcon style={{ color: Colors.primary, fontSize: '20px' }} />
              </IconButton>
            </ThemedTooltip>
          </BulkActions>
        </div>
      )}
      <StyledTable
        data={mockData}
        columns={[selectableColumn, ...COLUMNS]}
        noDataMessage={
          <TranslatedText
            stringId="encounter.tasks.table.noData"
            fallback="No upcoming tasks to display. Please click '+ New task' to add a task to this patient."
          />
        }
        allowExport={false}
        onMouseEnterRow={(_, data) => setHoveredRow(data)}
        onMouseLeaveRow={() => setHoveredRow(null)}
      />
    </div>
  );
};
