import React, { useEffect } from 'react';
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
import { getDisplayableDates } from './utils';
import { TranslatedText } from '../../../components';
import { Box } from '@material-ui/core';

const EmptyStateWrapper = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  margin: 12px;
  padding: 20px;
  height: calc(100vh - 92px);
`;

const EmptyState = styled.div`
  background-color: ${Colors.background};

  color: ${Colors.primary};
  font-weight: 500;
  text-align: center;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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

export const LocationAssignmentsCalendar = ({
  locations,
  isLocationsLoading,
  openAssignmentDrawer,
  selectedFacilityId,
  ...props
}) => {
  const { monthOf, setMonthOf, setIsCalendarLoaded } = useLocationAssignmentsContext();

  const displayedDates = getDisplayableDates(monthOf);

  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useLocationAssignmentsQuery(
    {
      after: toDateString(displayedDates[0]),
      before: toDateString(displayedDates.at(-1)),
      all: true,
    },
    { keepPreviousData: true },
  );
  const assignments = assignmentsData?.data ?? [];

  // Signal that calendar is ready when data is loaded
  useEffect(() => {
    if (!isLocationsLoading && !isAssignmentsLoading) {
      setIsCalendarLoaded(true);
    } else {
      setIsCalendarLoaded(false);
    }
  }, [isLocationsLoading, isAssignmentsLoading, setIsCalendarLoaded]);

  if (isLocationsLoading || isAssignmentsLoading) {
    return <LoadingIndicator />;
  }

  // If no facility selected, show helper empty state matching design
  if (!selectedFacilityId) {
    return (
      <EmptyStateWrapper>
        <EmptyState>
          <Box width="370px">
            <TranslatedText
              stringId="admin.locationAssignments.emptyState"
              fallback="Please select a facility from the field above to view the location assignment table or assign a user"
            />
          </Box>
        </EmptyState>
      </EmptyStateWrapper>
    );
  }

  return (
    <>
      <Carousel className={APPOINTMENT_CALENDAR_CLASS} {...props} data-testid="carousel-sitm">
        <CarouselGrid.Root $dayCount={displayedDates.length} data-testid="root-nqxn">
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
