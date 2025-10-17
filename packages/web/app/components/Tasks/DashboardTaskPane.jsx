import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
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
  const [hasLoadedUserPreferences, setHasLoadedUserPreferences] = useState(false);
  const { data: userPreferences, isLoading: isLoadingUserPreferences } = useUserPreferencesQuery();

  const [locationGroupId, setLocationGroupId] = useState();
  const [locationId, setLocationId] = useState();
  const [highPriority, setHighPriority] = useState();

  // Get the initial filter state from the user preferences, after that rely on local state as
  // reloading user preferences causes timing issues with locationId and locationGroupId
  useEffect(() => {
    if (isLoadingUserPreferences || hasLoadedUserPreferences) return;
    setLocationGroupId(userPreferences?.clinicianDashboardTaskingTableFilter?.locationGroupId);
    setLocationId(userPreferences?.clinicianDashboardTaskingTableFilter?.locationId);
    setHighPriority(userPreferences?.clinicianDashboardTaskingTableFilter?.highPriority);
    setHasLoadedUserPreferences(true);
  }, [
    isLoadingUserPreferences,
    userPreferences?.clinicianDashboardTaskingTableFilter,
    hasLoadedUserPreferences,
    setHasLoadedUserPreferences,
  ]);

  // Helper function to mutate preferences with the latest values
  const updatePreferences = updates => {
    userPreferencesMutation.mutate({
      key: USER_PREFERENCES_KEYS.CLINICIAN_DASHBOARD_TASKING_TABLE_FILTER,
      value: { locationGroupId, locationId, highPriority, ...updates },
    });
  };

  const onLocationGroupChange = groupId => {
    setLocationGroupId(groupId || undefined);
    updatePreferences({ locationGroupId: groupId || undefined });
  };

  const onLocationIdChange = e => {
    const { value } = e.target;
    setLocationId(value || undefined);
    updatePreferences({ locationId: value || undefined });
  };

  const onHighPriorityOnlyChange = e => {
    const { checked } = e.target;
    setHighPriority(checked);
    updatePreferences({ highPriority: checked ? true : undefined });
  };

  if (!hasLoadedUserPreferences) return null;

  return (
    <TabPane data-testid="tabpane-s00l">
      <TopBar data-testid="topbar-r96r">
        <Heading4 whiteSpace="nowrap" data-testid="heading4-ng7b">
          <TranslatedText
            stringId="dashboard.tasks.upcomingTasks.title"
            fallback="Upcoming tasks"
            data-testid="translatedtext-0dpr"
          />
        </Heading4>
        <ActionRow data-testid="actionrow-iw9x">
          <FilterGrid data-testid="filtergrid-t0gc">
            <LocationInput
              name="locationId"
              onGroupChange={onLocationGroupChange}
              onChange={onLocationIdChange}
              size="small"
              label={
                <TranslatedText
                  stringId="general.localisedField.locationId.label"
                  fallback="Location"
                  data-testid="translatedtext-u95d"
                />
              }
              locationGroupLabel={
                <TranslatedText
                  stringId="general.localisedField.locationGroupId.label"
                  fallback="Area"
                  data-testid="translatedtext-kbsm"
                />
              }
              value={locationId}
              groupValue={locationGroupId}
              autofill={false}
              isMulti={true}
              data-testid="locationinput-aabz"
            />
            <StyledCheckInput
              label={
                <TranslatedText
                  stringId="dashboard.tasks.table.highPriorityOnly.label"
                  fallback="High priority only"
                  data-testid="translatedtext-crsm"
                />
              }
              value={highPriority}
              onChange={onHighPriorityOnlyChange}
              data-testid="styledcheckinput-fzec"
            />
          </FilterGrid>
        </ActionRow>
      </TopBar>
      <DashboardTasksTable
        searchParameters={{ locationId, locationGroupId, highPriority }}
        data-testid="dashboardtaskstable-lyo3"
      />
    </TabPane>
  );
});
