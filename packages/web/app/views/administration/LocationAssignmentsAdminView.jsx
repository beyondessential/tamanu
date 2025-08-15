import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import React from 'react';
import styled from 'styled-components';

import { useAdminLocationsQuery } from '../../api/queries';
import { Button, PageContainer, TopBar, TranslatedText } from '../../components';
import { Colors } from '../../constants';
import { LocationAssignmentsCalendar } from './locationAssignments/LocationAssignmentsCalendar';

export const LOCATION_ASSIGNMENTS_CALENDAR_ID = 'location-assignments-calendar';

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
  const locationsQuery = useAdminLocationsQuery(
    {
      bookableOnly: true,
    },
    { keepPreviousData: true },
  );

  const { data: locations } = locationsQuery;
  const hasNoLocations = locations?.length === 0;

  return (
    <Wrapper data-testid="wrapper-r1vl">
      <LocationAssignmentsTopBar data-testid="locationassignmentstopbar-0w60">
        <NewAssignmentButton data-testid="newassignmentbutton-sl1p">
          <PlusIcon data-testid="plusicon-ufmc" />
          <TranslatedText
            stringId="locationAssignment.calendar.assignLocation"
            fallback="Assign location"
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
          id={LOCATION_ASSIGNMENTS_CALENDAR_ID}
          locationsQuery={locationsQuery}
          data-testid="locationassignmentscalendar-s3yu"
        />
      )}
      {/* TODO: Add Location Assignment form drawer */}
    </Wrapper>
  );
};
