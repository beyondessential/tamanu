import { Button, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { omit } from 'lodash';
import { Box } from '@material-ui/core';
import { TASK_STATUSES } from '@tamanu/constants';

import { AutocompleteInput, CheckInput } from '../../../components';
import { useSuggester } from '../../../api';
import { TasksTable } from '../../../components/Tasks/TasksTable';
import { TaskModal } from '../../../components/Tasks/TaskModal';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

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
  const { ability } = useAuth();
  const canCreate = ability.can('create', 'Tasking');

  const designationSuggester = useSuggester('designation');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNotCompleted, setShowNotCompleted] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const onFilterByDesignation = e => {
    const { value: designationId } = e.target;
    setSearchParameters(prevParams =>
      designationId ? { ...prevParams, assignedTo: designationId } : omit(prevParams, 'assignedTo'),
    );
  };

  const refreshTaskTable = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    setRefreshCount(prev => prev + 1);
  }, [searchParameters]);

  useEffect(() => {
    const statuses = [TASK_STATUSES.TODO];

    if (showCompleted) {
      statuses.push(TASK_STATUSES.COMPLETED);
    }

    if (showNotCompleted) {
      statuses.push(TASK_STATUSES.NON_COMPLETED);
    }

    setSearchParameters({ ...searchParameters, statuses });
  }, [showCompleted, showNotCompleted]);

  return (
    <TabPane data-testid="tabpane-g2ah">
      <ActionRow data-testid="actionrow-adel">
        <CheckInputGroup data-testid="checkinputgroup-s6hg">
          <StyledCheckInput
            label={
              <TranslatedText
                stringId="encounter.tasks.showCompleted.label"
                fallback="Show completed"
                data-testid="translatedtext-jm1s"
              />
            }
            onChange={() => setShowCompleted(!showCompleted)}
            value={showCompleted}
            data-testid="styledcheckinput-kqdn"
          />
          <StyledCheckInput
            label={
              <TranslatedText
                stringId="encounter.tasks.showNotCompleted.label"
                fallback="Show not completed"
                data-testid="translatedtext-53rx"
              />
            }
            onChange={() => setShowNotCompleted(!showNotCompleted)}
            value={showNotCompleted}
            data-testid="styledcheckinput-vgby"
          />
        </CheckInputGroup>
        <AutocompleteInput
          name="designationId"
          label={
            <Box marginBottom="-4px" data-testid="box-4dam">
              <TranslatedText
                stringId="general.localisedField.assignedTo.label"
                fallback="Assigned to"
                data-testid="translatedtext-jxk1"
              />
            </Box>
          }
          size="small"
          suggester={designationSuggester}
          onChange={onFilterByDesignation}
          data-testid="autocompleteinput-mzs4"
        />
        {canCreate && (
          <NoteModalActionBlocker>
            <Button
              onClick={() => setTaskModalOpen(true)}
              variant="outlined"
              color="primary"
              data-testid="button-a1te"
            >
              <TranslatedText
                stringId="encounter.tasks.action.newTask"
                fallback="+ New task"
                data-testid="translatedtext-22p0"
              />
            </Button>
          </NoteModalActionBlocker>
        )}
      </ActionRow>
      <TasksTable
        encounterId={encounter.id}
        searchParameters={searchParameters}
        refreshCount={refreshCount}
        refreshTaskTable={refreshTaskTable}
        data-testid="taskstable-cv6v"
      />
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        refreshTaskTable={refreshTaskTable}
        data-testid="taskmodal-5e0w"
      />
    </TabPane>
  );
});
