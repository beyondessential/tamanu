import { isEqual } from 'date-fns';
import React from 'react';

import { toDateString, trimToDate } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import { generateIdFromCell, partitionAppointmentsByDate } from './utils';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedReferenceData, TranslatedText } from '../../../components';

export const BookingsCell = ({
  appointments,
  date,
  location: { id: locationId },
  openBookingForm,
  openCancelModal,
  onEmailBooking,
}) => {
  const { ability } = useAuth();
  const { selectedCell, updateSelectedCell } = useLocationBookingsContext();
  const { formatForDateTimeInput } = useDateTimeFormat();
  const isSelected = selectedCell.locationId === locationId && isEqual(date, selectedCell.date);
  const canCreateBooking = ability.can('create', 'Appointment');

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={e => {
        if (e.target.closest('.appointment-tile') || !canCreateBooking) return;
        openBookingForm({ startDate: toDateString(date), locationId });
        updateSelectedCell({ date, locationId });
      }}
      $selected={isSelected}
      $clickable={canCreateBooking}
      data-testid="cell-dp5l"
    >
      {appointments?.map((a, index) => {
        const facilityStartDate = trimToDate(formatForDateTimeInput(a.startTime));
        const cellDateStr = toDateString(date);
        return (
          <AppointmentTile
            appointment={a}
            className="appointment-tile"
            hideTime={!facilityStartDate || facilityStartDate !== cellDateStr}
            key={a.id}
            onCancel={() => openCancelModal(a)}
            onEdit={() => openBookingForm(a)}
            actions={
              canCreateBooking && onEmailBooking
                ? [
                    {
                      label: (
                        <TranslatedText
                          stringId="locationBooking.action.emailBooking"
                          fallback="Email booking"
                          data-testid={`translatedtext-email-booking-${locationId}-${index}`}
                        />
                      ),
                      action: () => onEmailBooking(a),
                    },
                  ]
                : []
            }
            data-testid={`appointmenttile-b6vn-${index}`}
          />
        );
      })}
    </CarouselGrid.Cell>
  );
};

export const BookingsRow = ({
  appointments,
  dates,
  location,
  openBookingForm,
  openCancelModal,
  onEmailBooking,
}) => {
  const { formatForDateTimeInput } = useDateTimeFormat();
  const { locationGroup } = location;
  const appointmentsByDate = partitionAppointmentsByDate(appointments, formatForDateTimeInput);

  return (
    <CarouselGrid.Row data-testid="row-m8yc">
      <CarouselGrid.RowHeaderCell data-testid="rowheadercell-qiko">
        <TranslatedReferenceData
          category="locationGroup"
          value={locationGroup.id}
          fallback={locationGroup.name}
          data-testid="translatedreferencedata-7cuw"
        />{' '}
        <TranslatedReferenceData
          category="location"
          value={location.id}
          fallback={location.name}
          data-testid="translatedreferencedata-1gpj"
        />
      </CarouselGrid.RowHeaderCell>
      {dates.map(d => (
        <BookingsCell
          appointments={appointmentsByDate[toDateString(d)]}
          date={d}
          key={d.valueOf()}
          location={location}
          openBookingForm={openBookingForm}
          openCancelModal={openCancelModal}
          onEmailBooking={onEmailBooking}
          data-testid={`bookingscell-5t8x-${d.valueOf()}`}
        />
      ))}
    </CarouselGrid.Row>
  );
};

export const LocationBookingsCalendarBody = ({
  appointmentsByLocation,
  displayedDates,
  filteredLocations,
  locationsQuery,
  openBookingForm,
  openCancelModal,
  onEmailBooking,
}) => {
  if (locationsQuery.isLoading)
    return <SkeletonRows colCount={displayedDates.length} data-testid="skeletonrows-munx" />;

  if (filteredLocations?.length === 0) return null;

  return filteredLocations?.map(location => (
    <BookingsRow
      appointments={appointmentsByLocation[location.id] ?? []}
      dates={displayedDates}
      key={location.code}
      location={location}
      openBookingForm={openBookingForm}
      openCancelModal={openCancelModal}
      onEmailBooking={onEmailBooking}
      data-testid={`bookingsrow-t3ka-${location.code}`}
    />
  ));
};
