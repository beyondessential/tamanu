import React, { useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';
import { AutocompleteInput, Button, CheckInput, TranslatedText } from '../../../components';
import { useSuggester } from '../../../api';
import { TasksTable } from '../../../components/Tasks/TasksTable';

const mockData = [
  {
    id: 1,
    task: 'Change bedpan',
    dueAt: '2024-08-12 10:00:29.563+07',
    assignedTo: [
      {
        id: 'designation-Nurse',
        name: 'Nurse',
      },
    ],
    frequency: '2 hours',
    notes: '',
    requestedBy: 'Catherine Jennings',
    requestedDate: '2024-08-11 10:00:29.563+07',
  },
  {
    id: 2,
    task: 'Contact patient family/caretaker',
    dueAt: '2024-08-11 11:00:29.563+07',
    assignedTo: [
      {
        id: 'designation-Nurse',
        name: 'Nurse',
      },
      {
        id: 'designation-SeniorNurse',
        name: 'Senior Nurse',
      },
    ],
    frequency: 'Once',
    notes: 'Lorem ipsum dolor sit',
    requestedBy: 'Catherine Jennings',
    requestedDate: '2024-08-11 10:00:29.563+07',
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
    requestedBy: 'Catherine Jennings',
    requestedDate: '2024-08-11 10:00:29.563+07',
  },
];

const TabPane = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 6px 12px;
  min-height: 460px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  justify-content: flex-end;
`;

const StyledCheckInput = styled(CheckInput)`
  label {
    display: flex;
    align-items: center;
  }

  .MuiTypography-root {
    font-size: 11px;
    line-height: 15px;
    margin-left: -3px;
  }
`;

const CheckInputGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
`;

export const TasksPane = React.memo(() => {
  const designationSuggester = useSuggester('designation');
  const [data, setData] = useState(mockData);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNotCompleted, setShowNotCompleted] = useState(false);

  const onFilterByDesignation = e => {
    if (!e.target.value) {
      setData(mockData);
      return;
    }

    const designationId = e.target.value;
    const filteredData = data.filter(item =>
      item.assignedTo.some(assignee => assignee.id === designationId),
    );
    setData(filteredData);
  };

  return (
    <TabPane>
      <ActionRow>
        <CheckInputGroup>
          <StyledCheckInput
            label={
              <TranslatedText
                stringId="encounter.tasks.showCompleted.label"
                fallback="Show completed"
              />
            }
            onChange={() => setShowCompleted(!showCompleted)}
            value={showCompleted}
          />
          <StyledCheckInput
            label={
              <TranslatedText
                stringId="encounter.tasks.showNotCompleted.label"
                fallback="Show not completed"
              />
            }
            onChange={() => setShowNotCompleted(!showNotCompleted)}
            value={showNotCompleted}
          />
        </CheckInputGroup>
        <AutocompleteInput
          name="designationId"
          label={
            <Box marginBottom="-4px">
              <TranslatedText
                stringId="general.localisedField.assignedTo.label"
                fallback="Assigned to"
              />
            </Box>
          }
          size="small"
          suggester={designationSuggester}
          onChange={onFilterByDesignation}
        />
        <Button onClick={() => {}} variant="outlined" color="primary">
          <TranslatedText stringId="encounter.tasks.action.newTask" fallback="+ New task" />
        </Button>
      </ActionRow>
      <TasksTable data={data} />
    </TabPane>
  );
});
