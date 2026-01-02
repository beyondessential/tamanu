import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useLocationBookingsQuery } from '../../../api/queries';
import { FormModal, TranslatedText } from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { LocationBookingsCalendarBody } from './LocationBookingsCalendarBody';
import { LocationBookingsCalendarHeader } from './LocationBookingsCalendarHeader';
import { partitionAppointmentsByLocation } from './utils';
import { useSendAppointmentEmail } from '../../../api/mutations';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { notifyError, notifySuccess } from '@tamanu/ui-components';

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

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
  // Uncomment line below to re-enable scroll snap. Components in CarouselComponents still support
  // scroll snap, but disabling because Chrome’s current handling of scrolling by clicking-and-
  // holding scrollbar arrows doesn’t respect the final scroll offset. It jumps back to the original
  // scroll offset.
  // scroll-snap-type: both mandatory;

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

const emptyStateMessage = (
  <EmptyState data-testid="emptystate-1ili">
    <TranslatedText
      stringId="locationBooking.calendar.noMatchingBookings"
      fallback="No bookings to display. Please try adjusting the search filters."
      data-testid="translatedtext-yptm"
    />
  </EmptyState>
);

export const LocationBookingsCalendar = ({
  locationsQuery,
  openBookingForm,
  openCancelModal,
  ...props
}) => {
  const [emailModalState, setEmailModalState] = useState(null);
  const { monthOf, setMonthOf } = useLocationBookingsContext();

  const displayedDates = getDisplayableDates(monthOf);

  const {
    filters: { bookingTypeId, clinicianId, patientNameOrId },
    viewType,
  } = useLocationBookingsContext();
  // When filtering only by location, don’t hide locations that contain no appointments
  const areNonLocationFiltersActive =
    clinicianId?.length > 0 || bookingTypeId?.length > 0 || !!patientNameOrId;
  const { data: locations } = locationsQuery;

  const { data: appointmentsData } = useLocationBookingsQuery(
    {
      after: toDateTimeString(displayedDates[0]),
      before: toDateTimeString(endOfDay(displayedDates.at(-1))),
      all: true,
      clinicianId,
      bookingTypeId,
      patientNameOrId,
      view: viewType,
    },
    { keepPreviousData: true },
  );
  const appointments = appointmentsData?.data ?? [];
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  const filteredLocations = areNonLocationFiltersActive
    ? locations?.filter(location => appointmentsByLocation[location.id])
    : locations;

  const { mutateAsync: sendAppointmentEmail } = useSendAppointmentEmail(
    emailModalState?.appointmentId,
    {
      onSuccess: () =>
        notifySuccess(
          <TranslatedText
            stringId="appointments.action.emailReminder.success"
            fallback="Email successfully sent"
          />,
        ),
      onError: () =>
        notifyError(
          <TranslatedText
            stringId="appointments.action.emailReminder.error"
            fallback="Error sending email"
          />,
        ),
    },
  );

  return (
    <>
      <Carousel className={APPOINTMENT_CALENDAR_CLASS} {...props} data-testid="carousel-sitm">
        <CarouselGrid.Root $dayCount={displayedDates.length} data-testid="root-nqxn">
          <LocationBookingsCalendarHeader
            monthOf={monthOf}
            setMonthOf={setMonthOf}
            displayedDates={displayedDates}
            data-testid="locationbookingscalendarheader-yzb4"
          />
          <LocationBookingsCalendarBody
            appointmentsByLocation={appointmentsByLocation}
            displayedDates={displayedDates}
            filteredLocations={filteredLocations}
            locationsQuery={locationsQuery}
            openBookingForm={openBookingForm}
            openCancelModal={openCancelModal}
            onEmailBooking={appointment =>
              setEmailModalState({
                appointmentId: appointment.id,
                email: appointment.patient?.email,
              })
            }
            data-testid="locationbookingscalendarbody-4f9q"
          />
        </CarouselGrid.Root>
      </Carousel>
      {filteredLocations?.length === 0 && emptyStateMessage}
      <FormModal
        title={
          <TranslatedText
            stringId="patient.email.title"
            fallback="Enter email address"
          />
        }
        open={!!emailModalState}
        onClose={() => setEmailModalState(null)}
      >
        <EmailAddressConfirmationForm
          onSubmit={async ({ email }) => {
            await sendAppointmentEmail(email);
            setEmailModalState(null);
          }}
          onCancel={() => setEmailModalState(null)}
          emailOverride={emailModalState?.email}
        />
      </FormModal>
    </>
  );
};
