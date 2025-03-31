import React from 'react';
import styled from 'styled-components';
import { omit } from 'lodash';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';

import { Colors } from '../../constants';
import { CheckInput, Heading4, LocationInput, TranslatedText } from '../../components';
import { DashboardTasksTable } from '../../components/Tasks/DashboardTaskTable';
import { useUserPreferencesMutation } from '../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../api/queries/useUserPreferencesQuery';
import { useAuth } from '../../contexts/Auth';

const TabPane = styled.div`
  flex-grow: 1;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 2px 12px 4px 12px;
  min-height: 0px;
  background-color: ${Colors.white};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
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
  margin-top: 18px;
`;

const TopBar = styled.div`
  display: flex;
  width: 100%;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 220px 220px 120px;
  column-gap: 10px;
  align-items: center;
  > :nth-child(2) > :first-child > :nth-child(2) {
    background-color: ${Colors.background};
  }
`;

export const DashboardTaskPane = React.memo(() => {
  const { facilityId } = useAuth();
  const userPreferencesMutation = useUserPreferencesMutation(facilityId);
  const { data: userPreferences } = useUserPreferencesQuery();
  const clinicianDashboardTaskingTableFilter =
    userPreferences?.clinicianDashboardTaskingTableFilter || {};

  const onLocationIdChange = e => {
    const { value } = e.target;

    const newParams = value
      ? { ...clinicianDashboardTaskingTableFilter, locationId: value }
      : omit(clinicianDashboardTaskingTableFilter, 'locationId');

    userPreferencesMutation.mutate({
      key: USER_PREFERENCES_KEYS.CLINICIAN_DASHBOARD_TASKING_TABLE_FILTER,
      value: newParams,
    });
  };

  const onHighPriorityOnlyChange = e => {
    const { checked } = e.target;

    const newParams = checked
      ? { ...clinicianDashboardTaskingTableFilter, highPriority: checked }
      : omit(clinicianDashboardTaskingTableFilter, 'highPriority');

    userPreferencesMutation.mutate({
      key: USER_PREFERENCES_KEYS.CLINICIAN_DASHBOARD_TASKING_TABLE_FILTER,
      value: newParams,
    });
  };

  return (
    <TabPane>
      <TopBar data-test-id='topbar-homz'>
        <Heading4 whiteSpace="nowrap">
          <TranslatedText
            stringId="dashboard.tasks.upcomingTasks.title"
            fallback="Upcoming tasks"
            data-test-id='translatedtext-j7pc' />
        </Heading4>
        <ActionRow>
          <FilterGrid>
            <LocationInput
              name="locationId"
              onChange={onLocationIdChange}
              size="small"
              label={
                <TranslatedText
                  stringId="general.localisedField.locationId.label"
                  fallback="Location"
                  data-test-id='translatedtext-6ryt' />
              }
              locationGroupLabel={
                <TranslatedText
                  stringId="general.localisedField.locationGroupId.label"
                  fallback="Area"
                  data-test-id='translatedtext-qdqu' />
              }
              value={clinicianDashboardTaskingTableFilter.locationId}
              autofill={false}
              isMulti={true}
            />
            <StyledCheckInput
              label={
                <TranslatedText
                  stringId="dashboard.tasks.table.highPriorityOnly.label"
                  fallback="High priority only"
                  data-test-id='translatedtext-8wlp' />
              }
              value={clinicianDashboardTaskingTableFilter.highPriority}
              onChange={onHighPriorityOnlyChange}
            />
          </FilterGrid>
        </ActionRow>
      </TopBar>
      <DashboardTasksTable searchParameters={clinicianDashboardTaskingTableFilter} />
    </TabPane>
  );
});
