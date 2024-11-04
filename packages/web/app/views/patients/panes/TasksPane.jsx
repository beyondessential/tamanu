import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { omit } from 'lodash';
import { Box } from '@material-ui/core';
import { TASK_STATUSES } from '@tamanu/constants';
import { Colors } from '../../../constants';
import {
  AutocompleteInput,
  Button,
  CheckInput,
  Heading4,
  LocationInput,
  TranslatedText,
} from '../../../components';
import { useSuggester } from '../../../api';
import { TasksTable } from '../../../components/Tasks/TasksTable';
import { TaskModal } from '../../../components/Tasks/TaskModal';
import { useAuth } from '../../../contexts/Auth';
import { DashboardTasksTable } from '../../../components/Tasks/DashboardTaskTable';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';

const TabPane = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 6px 12px;
  min-height: 460px;
  background-color: ${Colors.white};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: ${p => (p.$inDashboard ? 'center' : 'flex-end')};
  justify-content: flex-end;
  margin-left: auto;
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
  ${p => (p.$inDashboard ? 'margin-top: 18px;' : '')}
`;

const CheckInputGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  width: 100%;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 250px 250px 120px;
  column-gap: 10px;
  align-items: center;
  > :nth-child(2) > :first-child > :nth-child(2) {
    background-color: ${Colors.background};
  }
`;

export const TasksPane = React.memo(({ encounter, inDashboard = false }) => {
  const { ability } = useAuth();
  const canCreate = ability.can('create', 'Tasking');

  const userPreferencesMutation = useUserPreferencesMutation();
  const { data: userPreferences } = useUserPreferencesQuery({ enabled: inDashboard });
  const { clinicianDashboardTaskingTableFilter = {} } = userPreferences || {};

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

  const onLocationIdChange = e => {
    const { value } = e.target;

    const newParams = value
      ? { ...clinicianDashboardTaskingTableFilter, locationId: value }
      : omit(clinicianDashboardTaskingTableFilter, 'locationId');

    userPreferencesMutation.mutate({
      clinicianDashboardTaskingTableFilter: newParams,
    });
  };

  const onHighPriorityOnlyChange = e => {
    const { checked } = e.target;

    const newParams = checked
      ? { ...clinicianDashboardTaskingTableFilter, highPriority: checked }
      : omit(clinicianDashboardTaskingTableFilter, 'highPriority');

    userPreferencesMutation.mutate({
      clinicianDashboardTaskingTableFilter: newParams,
    });
  };

  const refreshTaskTable = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    setRefreshCount(prev => prev + 1);
  }, [searchParameters]);

  useEffect(() => {
    if (inDashboard) return;
    const statuses = [TASK_STATUSES.TODO];

    if (showCompleted) {
      statuses.push(TASK_STATUSES.COMPLETED);
    }

    if (showNotCompleted) {
      statuses.push(TASK_STATUSES.NON_COMPLETED);
    }

    setSearchParameters({ ...searchParameters, statuses });
  }, [showCompleted, showNotCompleted, inDashboard]);

  return (
    <TabPane>
      <TopBar>
        {inDashboard ? (
          <Heading4>
            <TranslatedText
              stringId="dashboard.tasks.upcomingTasks.title"
              fallback="Upcoming tasks"
            />
          </Heading4>
        ) : null}
        <ActionRow $inDashboard={inDashboard}>
          {!inDashboard ? (
            <>
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
              {canCreate && (
                <Button onClick={() => setTaskModalOpen(true)} variant="outlined" color="primary">
                  <TranslatedText stringId="encounter.tasks.action.newTask" fallback="+ New task" />
                </Button>
              )}
            </>
          ) : (
            <FilterGrid>
              <LocationInput
                name="locationId"
                onChange={onLocationIdChange}
                size="small"
                label={
                  <TranslatedText
                    stringId="general.localisedField.locationId.label"
                    fallback="Location"
                  />
                }
                locationGroupLabel={
                  <TranslatedText
                    stringId="general.localisedField.locationGroupId.label"
                    fallback="Area"
                  />
                }
                value={clinicianDashboardTaskingTableFilter.locationId}
              />
              <StyledCheckInput
                label={
                  <TranslatedText
                    stringId="dashboard.tasks.table.highPriorityOnly.label"
                    fallback="High priority only"
                  />
                }
                value={clinicianDashboardTaskingTableFilter.highPriority}
                $inDashboard={inDashboard}
                onChange={onHighPriorityOnlyChange}
              />
            </FilterGrid>
          )}
        </ActionRow>
      </TopBar>
      {!inDashboard ? (
        <TasksTable
          encounterId={encounter.id}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          refreshTaskTable={refreshTaskTable}
        />
      ) : (
        <DashboardTasksTable searchParameters={clinicianDashboardTaskingTableFilter} />
      )}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        refreshTaskTable={refreshTaskTable}
      />
    </TabPane>
  );
});
