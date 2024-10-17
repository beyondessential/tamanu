import React from 'react';
import styled from 'styled-components';

import { isStartOfThisWeek } from '@tamanu/shared/utils/dateTime';

import { useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { PageContainer, TopBar, TranslatedText } from '../../../components';
import { Typography } from '@material-ui/core';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';

// BEGIN PLACEHOLDERS

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  max-block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})``;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr;
  max-block-size: 100%;
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
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

export const LocationBookingsView = () => {
  const locationsQuery = useLocationsQuery({
    includeLocationGroup: true,
    bookableOnly: true,
  });
  const { data: locations } = locationsQuery;
  const hasNoLocations = locations?.length === 0;

  return (
    <Wrapper>
      <LocationBookingsTopBar>
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Area</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
      </LocationBookingsTopBar>
      {hasNoLocations ? (
        <EmptyStateLabel>No bookable locations</EmptyStateLabel>
      ) : (
        <LocationBookingsCalendar locationsQuery={locationsQuery} />
      )}
    </Wrapper>
  );
};
