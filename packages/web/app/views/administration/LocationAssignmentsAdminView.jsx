import { Box, Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { Button, PageContainer, TopBar, TranslatedText, AutocompleteInput } from '../../components';
import { AssignUserDrawer } from '../../components/Appointments/LocationAssignmentForm/AssignUserDrawer';
import { Colors } from '../../constants';
import { LocationAssignmentsCalendar } from './locationAssignments/LocationAssignmentsCalendar';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { LOCATION_BOOKABLE_VIEW, USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { ASSIGNMENT_SCHEDULE_INITIAL_VALUES } from '../../constants/locationAssignments';
import { useSuggester } from '../../api';
import { useAdminUserPreferencesMutation } from '../../api/mutations/useUserPreferencesMutation';
import { useAdminUserPreferencesQuery, useAdminSettingsQuery } from '../../api/queries';
import { useTranslation } from '../../contexts/Translation';
import { useAuth } from '../../contexts/Auth';
import { NoPermissionScreen } from '../NoPermissionScreen';
import { ConditionalTooltip } from '../../components/Tooltip';

const PlusIcon = styled(AddRounded)`
  && {
    margin-inline-end: 0.1875rem;
  }
`;

const LocationAssignmentsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText
      stringId="scheduling.locationAssignment.title"
      fallback="Location assignment"
      data-testid="translatedtext-y7nl"
    />
  ),
})`
  border-block-end: max(0.0625rem, 1px) ${Colors.outline} solid;
`;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr auto;
  max-block-size: 100%;
`;

const NewAssignmentButton = styled(Button)`
  margin-inline-start: 1rem;
`;

const EmptyStateLabel = styled(Typography).attrs({
  align: 'center',
  color: 'textSecondary',
  variant: 'body1',
})`
  color: ${Colors.midText};
  font-size: 2rem;
  font-weight: 400;
  place-self: center;

  ${Wrapper}:has(&) {
    min-block-size: 100%;
  }
`;

export const LocationAssignmentsAdminView = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialValues, setDrawerInitialValues] = useState({});

  const { getTranslation } = useTranslation();
  const { ability } = useAuth();

  const hasListPermission = ability?.can?.('list', 'LocationSchedule');
  const hasCreatePermission = ability?.can?.('create', 'LocationSchedule');

  // Facility selection persistence
  const { data: userPreferences } = useAdminUserPreferencesQuery();
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const { mutateAsync: saveUserPref } = useAdminUserPreferencesMutation();
  const facilitySuggester = useSuggester('facility');

  // Load booking slot settings for selected facility
  const { data: facilitySettings } = useAdminSettingsQuery('facility', selectedFacilityId);
  const bookingSlots = facilitySettings?.appointments?.bookingSlots;

  useEffect(() => {
    const pref = userPreferences?.[USER_PREFERENCES_KEYS.LOCATION_ASSIGNMENT_SELECTED_FACILITY];
    if (pref?.id) setSelectedFacilityId(pref.id);
  }, [userPreferences]);

  // Autoselect if only one current facility
  const { data: allFacilities } = useSuggestionsQuery('facility', { select: d => d });
  useEffect(() => {
    if (!selectedFacilityId && Array.isArray(allFacilities)) {
      const currentFacilities = allFacilities?.filter(f => f?.id && f?.name);
      if (currentFacilities?.length === 1) {
        setSelectedFacilityId(currentFacilities[0].id);
      }
    }
  }, [allFacilities, selectedFacilityId]);

  const handleFacilityChange = async e => {
    const id = e?.target?.value ?? '';
    setSelectedFacilityId(id);
    await saveUserPref({
      key: USER_PREFERENCES_KEYS.LOCATION_ASSIGNMENT_SELECTED_FACILITY,
      value: { id },
    });
  };

  const { data: locations, isLoading: isLocationsLoading } = useSuggestionsQuery('location/all', {
    // Filter and sort locations to only show those that have a location group (bookable locations)
    select: data => {
      const filtered = data
        .filter(
          location =>
            location.locationGroup &&
            location.locationGroup.isBookable !== LOCATION_BOOKABLE_VIEW.NO,
        )
        .filter(location =>
          selectedFacilityId ? location.facilityId === selectedFacilityId : true,
        )
        .sort((a, b) => {
          const locationGroupComparison = a.locationGroup.name.localeCompare(b.locationGroup.name);
          if (locationGroupComparison !== 0) {
            return locationGroupComparison;
          }
          return a.name.localeCompare(b.name);
        });
      return filtered;
    },
  });
  const hasNoLocations = !isLocationsLoading && locations?.length === 0;

  const openAssignmentDrawer = (initialValues = {}) => {
    setDrawerInitialValues({
      userId: '',
      locationGroupId: '',
      locationId: initialValues.locationId || '',
      date: initialValues.date || '',
      startTime: '',
      endTime: '',
      schedule: {
        ...ASSIGNMENT_SCHEDULE_INITIAL_VALUES,
        ...(initialValues.template && {
          interval: initialValues.template.repeatFrequency,
          frequency: initialValues.template.repeatUnit,
          untilDate: initialValues.template.repeatEndDate,
        }),
      },
      isRepeatingAssignment: !!initialValues?.template?.repeatFrequency,
      ...initialValues,
    });
    setIsDrawerOpen(true);
  };

  const closeAssignmentDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerInitialValues({});
  };

  if (!hasListPermission) {
    return (
      <div>
        <LocationAssignmentsTopBar data-testid="locationassignmentstopbar-0w60" />
        <Box height="calc(100vh - 107px)">
          <NoPermissionScreen showBackgroundImage={false} />
        </Box>
      </div>
    );
  }

  return (
    <Wrapper data-testid="wrapper-r1vl">
      <LocationAssignmentsTopBar data-testid="locationassignmentstopbar-0w60">
        <AutocompleteInput
          name="facilityId"
          suggester={facilitySuggester}
          value={selectedFacilityId}
          onChange={handleFacilityChange}
          placeholder={getTranslation(
            'admin.locationAssignments.facility.placeholder',
            'Select a facility',
          )}
        />
        {hasCreatePermission && (
          <ConditionalTooltip
            visible={!selectedFacilityId}
            title={
              <Box maxWidth="125px">
                <TranslatedText
                  stringId="locationAssignment.calendar.noFacility.tooltip"
                  fallback="Please select a facility to assign a user"
                  data-testid="translatedtext-no-facility-tooltip"
                />
              </Box>
            }
            PopperProps={{
              popperOptions: {
                positionFixed: true,
                modifiers: {
                  offset: {
                    enabled: true,
                    offset: '-50, -5',
                  },
                },
              },
            }}
          >
            <NewAssignmentButton
              onClick={() => openAssignmentDrawer()}
              disabled={!selectedFacilityId}
              data-testid="newassignmentbutton-sl1p"
            >
              <PlusIcon data-testid="plusicon-ufmc" />
              <TranslatedText
                stringId="locationAssignment.calendar.assignUser"
                fallback="Assign user"
                data-testid="translatedtext-feur"
              />
            </NewAssignmentButton>
          </ConditionalTooltip>
        )}
      </LocationAssignmentsTopBar>
      {hasNoLocations ? (
        <EmptyStateLabel data-testid="emptystatelabel-5iov">
          <TranslatedText
            stringId="locationAssignment.calendar.noBookableLocations"
            fallback="No bookable locations"
            data-testid="translatedtext-e6bf"
          />
        </EmptyStateLabel>
      ) : (
        <LocationAssignmentsCalendar
          locations={locations}
          isLocationsLoading={isLocationsLoading}
          openAssignmentDrawer={openAssignmentDrawer}
          selectedFacilityId={selectedFacilityId}
          data-testid="locationassignmentscalendar-s3yu"
        />
      )}
      <AssignUserDrawer
        open={isDrawerOpen}
        onClose={closeAssignmentDrawer}
        initialValues={{ ...drawerInitialValues, bookingSlots }}
        data-testid="assignuserdrawer-location-assignments"
        facilityId={selectedFacilityId}
      />
    </Wrapper>
  );
};
