import { CircularProgress } from '@material-ui/core';
import { toggleButtonClasses, ToggleButtonGroup, toggleButtonGroupClasses } from '@mui/material';
import { addMilliseconds, endOfDay, startOfDay, startOfToday } from 'date-fns';
import { useFormikContext } from 'formik';
import { PropTypes } from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useSettings } from '../../../../contexts/Settings';
import { BookingTimeCell } from './BookingTimeCell';
import { calculateTimeSlots, isTimeSlotWithinRange } from './util';
import ms from 'ms';
import { OuterLabelFieldWrapper } from '../../../Field';

const ToggleGroup = styled(ToggleButtonGroup)`
  background-color: white;
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  inline-size: 295px;
  padding-block: 0.75rem;
  padding-inline: 1rem;

  &.${toggleButtonGroupClasses.root} {
    display: grid;
    gap: 0.5rem 0.75rem;
    grid-template-columns: repeat(2, 1fr);
  }

  &.${toggleButtonClasses.disabled} {
    background-color: initial;
  }
`;

const LoadingIndicator = styled(CircularProgress)`
  grid-column: 1 / -1;
  margin: 0 auto;
`;

export const TimeSlotPicker = ({
  date,
  disabled = false,
  label,
  onChange,
  required,
  variant = 'range',
  ...props
}) => {
  const { setFieldValue, values } = useFormikContext();

  /**
   * Array of integers representing the selected toggle buttons. Each time slot is represented by
   * the integer form of its start time.
   */
  const [selectedToggles, setSelectedToggles] = useState([]); // TODO

  const [hoverRangeStart, setHoverRangeStart] = useState(
    variant === 'end' ? values.startTime : null,
  );
  const [hoverRangeEnd, setHoverRangeEnd] = useState(variant === 'start' ? values.endTime : null);
  const hoverRange = { start: hoverRangeStart, end: hoverRangeEnd };

  const { getSetting } = useSettings();
  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  // Fall back to today so time slots render. Prevents GUI from looking broken when no date is selected, but this
  // component should be disabled under this scenario.
  const timeSlots = calculateTimeSlots(bookingSlotSettings, date ?? startOfToday());

  const { data: existingLocationBookings, isFetching, isFetched } = useAppointmentsQuery(
    {
      after: date ? toDateTimeString(startOfDay(date)) : null,
      before: date ? toDateTimeString(endOfDay(date)) : null,
      all: true,
      locationId: values.locationId,
    },
    {
      enabled: !!(date && values.locationId),
    },
  );

  const handleChange = (_event, newTimeSlots) => {
    if (newTimeSlots.length === 0) {
      setSelectedToggles([]);
      void setFieldValue('startTime', null);
      void setFieldValue('endTime', null);
      return;
    }

    switch (variant) {
      case 'range': {
        const sortedTimeSlots = newTimeSlots.toSorted();
        const newStart = new Date(sortedTimeSlots[0]);
        const newEnd = addMilliseconds(
          new Date(sortedTimeSlots.at(-1)),
          ms(bookingSlotSettings.slotDuration),
        );
        const newTimeRange = { start: newStart, end: newEnd };

        // Update toggle button group state
        const newToggleSelection = timeSlots
          .filter(s => isTimeSlotWithinRange(s, newTimeRange))
          .map(({ start }) => start.valueOf());
        setSelectedToggles(newToggleSelection);

        console.log('newTimeRange', newTimeRange);
        console.log('newToggleSelection', newToggleSelection);

        // Update value in form context
        void setFieldValue('startTime', newStart);
        void setFieldValue('endTime', newEnd);
        break;
      }
      case 'start': {
        // void setFieldValue('startTime', newStart);
        break;
      }
      case 'end': {
        // void setFieldValue('endTime', newEnd);
        break;
      }
    }

    onChange?.();
  };

  // Convert existing bookings into timeslots TODO: Exclude slots that this form edits
  const bookedTimeSlots = useMemo(() => {
    if (!isFetched) return [];
    return existingLocationBookings?.data.map(booking => ({
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
    }));
  }, [existingLocationBookings, isFetched]);
  console.log('bookedTimeSlots', bookedTimeSlots);

  useEffect(() => {
    const { startTime, endTime } = values;
    console.log({ startTime, endTime });
  }, [values.startTime, values.endTime]);

  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      if (!values.startTime || !values.endTime) return true;
      if (values.startTime < timeSlot.end) {
        return !bookedTimeSlots.some(bookedSlot =>
          isTimeSlotWithinRange(bookedSlot, {
            start: values.startTime,
            end: timeSlot.end,
          }),
        );
      }
      if (values.endTime > timeSlot.start) {
        return !bookedTimeSlots.some(bookedSlot =>
          isTimeSlotWithinRange(bookedSlot, {
            start: timeSlot.start,
            end: values.endTime,
          }),
        );
      }
    },
    [bookedTimeSlots, values.startTime, values.endTime],
  );

  return (
    <OuterLabelFieldWrapper label={label} required={required}>
      <ToggleGroup disabled={disabled} value={selectedToggles} onChange={handleChange} {...props}>
        {isFetching ? (
          <LoadingIndicator />
        ) : (
          timeSlots.map(timeSlot => {
            // const isSelected = isTimeSlotWithinRange(timeSlot, selectedTimeRange);
            // const isBooked = bookedTimeSlots?.some(
            //   bookedTimeSlot => isTimeSlotWithinRange(timeSlot, bookedTimeSlot) && !isSelected,
            // );
            //
            // const onMouseEnter = () => {
            //   if (!selectedTimeRange) {
            //     setHoverTimeRange(timeSlot);
            //     return;
            //   }
            //   if (timeSlot.start <= selectedTimeRange.start) {
            //     setHoverTimeRange({
            //       start: timeSlot.start,
            //       end: selectedTimeRange.end,
            //     });
            //     return;
            //   }
            //   if (timeSlot.end >= selectedTimeRange.end) {
            //     setHoverTimeRange({
            //       start: selectedTimeRange.start,
            //       end: timeSlot.end,
            //     });
            //     return;
            //   }
            // };

            return (
              <BookingTimeCell
                key={timeSlot.start.valueOf()}
                timeSlot={timeSlot}
                // selected={isSelected}
                selectable={checkIfSelectableTimeSlot(timeSlot)}
                // booked={isBooked}
                disabled={disabled}
                // onMouseEnter={onMouseEnter}
                // onMouseLeave={() => setHoverTimeRange(null)}
                // inHoverRange={isTimeSlotWithinRange(timeSlot, hoverTimeRange)}
                value={timeSlot.start.valueOf()}
              />
            );
          })
        )}
      </ToggleGroup>
    </OuterLabelFieldWrapper>
  );
};

TimeSlotPicker.propTypes = {
  date: PropTypes.instanceOf(Date),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['range', 'start', 'end']),
};

TimeSlotPicker.defaultProps = {
  date: startOfToday(),
  disabled: false,
  onChange: null,
  variant: 'range',
};
