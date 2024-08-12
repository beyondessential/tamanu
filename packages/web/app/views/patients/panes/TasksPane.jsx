import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Colors } from '../../../constants';
import { AutocompleteInput, Button, Heading4, TranslatedText } from '../../../components';
import { useSuggester } from '../../../api';
import { TasksTable } from '../../../components/Tasks/TasksTable';

const TabPane = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 6px 12px;
  min-height: 460px;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LinkButton = styled(Typography)`
  font-weight: 400;
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  color: ${Colors.primary};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

export const TasksPane = React.memo(() => {
  const designationSuggester = useSuggester('designation');
  return (
    <TabPane>
      <TitleContainer>
        <Title>
          <Heading4>
            <TranslatedText
              stringId="encounter.tasks.title.upcomingTasks"
              fallback="Upcoming tasks"
            />
          </Heading4>
          <LinkButton>
            <TranslatedText
              stringId="encounter.tasks.action.viewPrevious"
              fallback="View previous"
            />
          </LinkButton>
        </Title>
        <ActionRow>
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
            onChange={() => {}}
          />
          <Button onClick={() => {}} variant="outlined" color="primary">
            <TranslatedText stringId="encounter.tasks.action.newTask" fallback="+ New task" />
          </Button>
        </ActionRow>
      </TitleContainer>
      <TasksTable />
    </TabPane>
  );
});
