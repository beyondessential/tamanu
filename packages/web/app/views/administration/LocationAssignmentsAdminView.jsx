import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Button, PageContainer, TopBar, TranslatedText } from '../../components';
import { AssignUserDrawer } from '../../components/Appointments/LocationAssignmentForm/AssignUserDrawer';
import { Colors } from '../../constants';
import { LocationAssignmentsCalendar } from './locationAssignments/LocationAssignmentsCalendar';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { LOCATION_BOOKABLE_VIEW } from '@tamanu/constants';
import { ASSIGNMENT_SCHEDULE_INITIAL_VALUES } from '../../constants/locationAssignments';

const PlusIcon = styled(AddRounded)`
  && {
    margin-inline-end: 0.1875rem;
  }
`;

const LocationAssignmentsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText
      stringId="scheduling.locationAssignments.title"
      fallback="Location assignments"
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
  const { data: locations, isLoading: isLocationsLoading } = useSuggestionsQuery('location/all', {
    // Filter and sort locations to only show those that have a location group (bookable locations)
    select: data => {
      return data
        .filter(
          location =>
            location.locationGroup &&
            location.locationGroup.isBookable !== LOCATION_BOOKABLE_VIEW.NO,
        )
        .sort((a, b) => {
          const locationGroupComparison = a.locationGroup.name.localeCompare(b.locationGroup.name);
          if (locationGroupComparison !== 0) {
            return locationGroupComparison;
          }
          return a.name.localeCompare(b.name);
        });
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

  return (
    <Wrapper data-testid="wrapper-r1vl">
      <LocationAssignmentsTopBar data-testid="locationassignmentstopbar-0w60">
        <NewAssignmentButton
          onClick={() => openAssignmentDrawer()}
          data-testid="newassignmentbutton-sl1p"
        >
          <PlusIcon data-testid="plusicon-ufmc" />
          <TranslatedText
            stringId="locationAssignment.calendar.assignUser"
            fallback="Assign user"
            data-testid="translatedtext-feur"
          />
        </NewAssignmentButton>
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
          data-testid="locationassignmentscalendar-s3yu"
        />
      )}
      <AssignUserDrawer
        open={isDrawerOpen}
        onClose={closeAssignmentDrawer}
        initialValues={drawerInitialValues}
        data-testid="assignuserdrawer-location-assignments"
      />
    </Wrapper>
  );
};
