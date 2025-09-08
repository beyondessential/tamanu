import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import React from 'react';
import styled from 'styled-components';

import { Button, PageContainer, TopBar, TranslatedText } from '../../components';
import { Colors } from '../../constants';
import { LocationAssignmentsCalendar } from './locationAssignments/LocationAssignmentsCalendar';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';

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
  const originalLocationsQuery = useSuggestionsQuery('location/all');

  // Filter and sort locations to only show those that have a location group (bookable locations)
  const allLocations = originalLocationsQuery?.data || [];
  const bookableLocations = allLocations
    .filter(location => location.locationGroup?.isBookable)
    .sort((a, b) => {
      const locationGroupComparison = a.locationGroup.name.localeCompare(b.locationGroup.name);
      if (locationGroupComparison !== 0) {
        return locationGroupComparison;
      }
      return a.name.localeCompare(b.name);
    });

  const locationsQuery = {
    ...originalLocationsQuery,
    data: bookableLocations,
  };

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
          locationsQuery={locationsQuery}
          data-testid="locationassignmentscalendar-s3yu"
        />
      )}
      {/* TODO: Add Location Assignment form drawer */}
    </Wrapper>
  );
};
