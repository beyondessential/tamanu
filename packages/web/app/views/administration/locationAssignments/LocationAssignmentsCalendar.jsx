import React from 'react';
import styled from 'styled-components';

import { toDateString } from '@tamanu/utils/dateTime';

import { useLocationAssignmentsQuery } from '../../../api/queries';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { Colors } from '../../../constants';
import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { CarouselComponents as CarouselGrid } from '../../scheduling/locationBookings/CarouselComponents';
import { LocationAssignmentsCalendarBody } from './LocationAssignmentsCalendarBody';
import { LocationAssignmentsCalendarHeader } from './LocationAssignmentsCalendarHeader';
import { LOCATION_ASSIGNMENTS_CALENDAR_ID } from '../../../constants/locationAssignments';
import { getDisplayableDates } from './utils';

const EmptyState = styled.div`
  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  background-color: ${Colors.white};
  border-block-end: var(--border-style);
  border-end-end-radius: 0.2rem;
  border-end-start-radius: 0.2rem;
  border-inline: var(--border-style);
  color: ${Colors.primary};
  font-weight: 500;
  margin-inline: 1rem;
  padding-block: 0.75rem;
  padding-inline: 0.5rem;
  text-align: center;
`;

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  display: grid;
  grid-template-rows: 1fr auto;
  margin: 1rem;
  max-block-size: 100%;
  overflow: scroll;
  overscroll-behavior: contain;

  /*
   * Make the empty state message superficially look like a row in the table. (Empty state message
   * is a sibling, not child, to prevent its text from scrolling off-screen.
   */
  &:has(+ ${EmptyState}) {
    border-end-end-radius: 0;
    border-end-start-radius: 0;
    margin-block-end: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

export const LocationAssignmentsCalendar = ({ locationsQuery, openAssignmentDrawer, ...props }) => {
  const { monthOf, setMonthOf } = useLocationAssignmentsContext();

  const displayedDates = getDisplayableDates(monthOf);

  const { data: locations, isLoading: isLocationsLoading } = locationsQuery;

  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useLocationAssignmentsQuery(
    {
      after: toDateString(displayedDates[0]),
      before: toDateString(displayedDates.at(-1)),
      all: true,
    },
    { keepPreviousData: true },
  );
  const assignments = assignmentsData?.data ?? [];

  if (isLocationsLoading || isAssignmentsLoading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <Carousel className={APPOINTMENT_CALENDAR_CLASS} {...props} data-testid="carousel-sitm">
        <CarouselGrid.Root
          id={LOCATION_ASSIGNMENTS_CALENDAR_ID}
          $dayCount={displayedDates.length}
          data-testid="root-nqxn"
        >
          <LocationAssignmentsCalendarHeader
            monthOf={monthOf}
            setMonthOf={setMonthOf}
            displayedDates={displayedDates}
            data-testid="locationassignmentscalendarheader-yzb4"
          />
          <LocationAssignmentsCalendarBody
            displayedDates={displayedDates}
            locations={locations}
            isLocationsLoading={isLocationsLoading}
            assignments={assignments}
            openAssignmentDrawer={openAssignmentDrawer}
            data-testid="locationassignmentscalendarbody-4f9q"
          />
        </CarouselGrid.Root>
      </Carousel>
    </>
  );
};
