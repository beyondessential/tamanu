import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';
import { AutocompleteInput, Button, CheckInput, TranslatedText } from '../../../components';
import { useSuggester } from '../../../api';
import { TasksTable } from '../../../components/Tasks/TasksTable';
import { TASK_STATUSES } from '@tamanu/constants';

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

export const TasksPane = React.memo(({ encounter }) => {
  const designationSuggester = useSuggester('designation');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNotCompleted, setShowNotCompleted] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});

  const updateSearchParameters = newSearchParameters => {
    setSearchParameters({ ...searchParameters, ...newSearchParameters });
  };

  const onFilterByDesignation = e => {
    const designationId = e.target.value;
    if (!designationId) {
      const newSearchParameters = { ...searchParameters };
      delete newSearchParameters.assignedTo;
      updateSearchParameters(newSearchParameters);
      return;
    }
    updateSearchParameters({ assignedTo: designationId });
  };

  useEffect(() => {
    const statuses = [TASK_STATUSES.TODO];

    if (showCompleted) {
      statuses.push(TASK_STATUSES.COMPLETED);
    }

    if (showNotCompleted) {
      statuses.push(TASK_STATUSES.NOT_COMPLETED);
    }

    updateSearchParameters({ statuses });
  }, [showCompleted, showNotCompleted]);

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
      <TasksTable encounterId={encounter.id} searchParameters={searchParameters} />
    </TabPane>
  );
});
