import {
  endOfDay,
  startOfDay,
  format,
  addHours,
  parseISO,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
  isSameDay,
} from 'date-fns';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { toDateTimeString, toDateString } from '@tamanu/utils/dateTime';

import {
  useLocationBookingsQuery,
  useFacilityLocationAssignmentsQuery,
} from '../../../api/queries';
import { FormModal, TranslatedText, TranslatedReferenceData } from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { partitionAppointmentsByLocation } from './utils';
import { useAuth } from '../../../contexts/Auth';
import { useBookingSlots } from '../../../hooks/useBookingSlots';
import useOverflow from '../../../hooks/useOverflow';
import { ConditionalTooltip } from '../../../components/Tooltip';
import { useDrop, useDrag } from 'react-dnd';
import { useMoveLocationBookingMutation } from '../../../api/mutations/useMoveLocationBookingMutation';
import { useSendAppointmentEmail } from '../../../api/mutations';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { toast } from 'react-toastify';

const ScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  direction: rtl;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(${props => props.$locationCount || 1}, 158px);
  min-height: 100%;
  width: max-content;
  min-width: 100%;
  direction: ltr;
`;

const TimeColumn = styled.div`
  background: ${Colors.white};
  border-inline-end: max(0.0625rem, 1px) solid ${Colors.outline};
  position: sticky;
  left: 0;
  z-index: 11;
`;

const TimeSlot = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block-start: 0.25rem;
  font-size: 0.75rem;
  color: ${Colors.midText};
  background: ${Colors.white};
  position: relative;
  top: -12px;
  height: ${props => props.height}px;
`;

const LocationColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 158px;
  min-width: 158px;
  max-width: 158px;
  border-inline-end: max(0.0625rem, 1px) solid ${Colors.outline};
  position: relative;
`;

const LocationHeader = styled.div`
  background: ${Colors.white};
  border-block-end: max(0.0625rem, 1px) solid ${Colors.outline};
  position: sticky;
  top: 0;
  z-index: 10;
  height: 140px;
`;

const LocationTitle = styled.div`
  padding: 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LocationGroupText = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: ${Colors.midText};
`;

const LocationNameText = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: ${Colors.darkestText};
`;

const LocationSchedule = styled.div`
  position: relative;
  flex: 1;
`;

const AppointmentWrapper = styled.div`
  position: absolute;
  left: 2px;
  right: 2px;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 0;
    right: 0;
    bottom: 1px;
    background: ${Colors.white};
    z-index: 1;
    pointer-events: none;
  }

  .appointment-tile {
    height: calc(100% - 2px);
    margin-top: 1px;
    margin-bottom: 1px;
    width: 100%;
    font-size: 11px;
    padding-inline: 5px;
    position: relative;
    z-index: 2;
  }
`;

const StatusText = styled.div`
  color: ${Colors.primary};
  font-weight: 500;
  inline-size: 100%;
  padding-block-start: 1rem;
  padding-block-end: 1rem;
  text-align: center;
`;

const AssignmentSection = styled.div`
  border-block-end: max(0.0625rem, 1px) solid ${Colors.outline};
  padding: 0.5rem;
  font-size: 0.75rem;
  height: 84px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
`;

const AssignmentItem = styled.div`
  display: grid;
  grid-template-columns: 55px 1px 1fr;
  align-items: center;
  &:last-child {
    margin-block-end: 0;
  }
`;

const AssignmentTime = styled.div`
  color: ${Colors.midText};
  font-size: 0.75rem;
  padding-inline-end: 0.5rem;
`;

const AssignmentDivider = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${Colors.outline};
  min-height: 2rem;
`;

const AssignmentName = styled.div`
  color: ${Colors.darkestText};
  font-size: 11px;
  padding-inline-start: 4px;
`;

const NoAssignmentText = styled.div`
  font-size: 11px;
  text-align: center;
  width: 100%;
`;

const ErrorText = styled(StatusText)`
  color: ${Colors.alert};
`;

const TimeGridCell = styled(Box)`
  position: absolute;
  left: 0;
  right: 0;
  height: ${props => props.height}px;
  background: ${Colors.white};
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  &.selected {
    border: 1px solid ${Colors.primary};
  }
`;

const LoadingSkeleton = styled(Skeleton).attrs({
  animation: 'wave',
  variant: 'rectangular',
  width: '100%',
  height: '100%',
  sx: { bgcolor: Colors.white },
})`
  ::after {
    animation-duration: 1s !important;
  }
`;

const formatTime = time => {
  return format(new Date(time), 'h:mma').toLowerCase();
};

const LocationHeaderContent = ({ location, assignments = [] }) => {
  const [locationGroupRef, isLocationGroupOverflowing] = useOverflow();
  const [locationRef, isLocationOverflowing] = useOverflow();
  const popperProps = {
    popperOptions: {
      modifiers: {
        offset: {
          enabled: true,
          offset: '0, -8',
        },
        flip: {
          enabled: false,
        },
      },
    },
  };

  return (
    <LocationHeader data-testid="location-header">
      <AssignmentSection data-testid="assignment-section">
        {assignments.length > 0 ? (
          assignments.map((assignment, index) => (
            <AssignmentItem key={assignment.id || index} data-testid="assignment-item">
              <AssignmentTime data-testid="assignment-time">
                {formatTime(assignment.startTime)}-
                <br />
                {formatTime(assignment.endTime)}
              </AssignmentTime>
              <AssignmentDivider data-testid="assignment-divider" />
              <AssignmentName data-testid="assignment-name">
                {assignment.user?.displayName || 'Unknown User'}
              </AssignmentName>
            </AssignmentItem>
          ))
        ) : (
          <NoAssignmentText data-testid="no-assignment-text">
            <TranslatedText
              stringId="locationBooking.calendar.noClinicianAssigned"
              fallback="No clinician assigned"
              data-testid="no-clinician-assigned-text"
            />
          </NoAssignmentText>
        )}
      </AssignmentSection>

      <LocationTitle data-testid="location-title">
        <ConditionalTooltip
          visible={isLocationGroupOverflowing}
          PopperProps={popperProps}
          title={
            <Box maxWidth="130px">
              <TranslatedReferenceData
                category="locationGroup"
                value={location.locationGroup.id}
                fallback={location.locationGroup.name}
              />
            </Box>
          }
        >
          <LocationGroupText data-testid="locationgroup-name" ref={locationGroupRef}>
            <TranslatedReferenceData
              category="locationGroup"
              value={location.locationGroup.id}
              fallback={location.locationGroup.name}
            />
          </LocationGroupText>
        </ConditionalTooltip>
        <ConditionalTooltip
          visible={isLocationOverflowing}
          PopperProps={popperProps}
          title={
            <Box maxWidth="130px">
              <TranslatedReferenceData
                category="location"
                value={location.id}
                fallback={location.name}
              />
            </Box>
          }
        >
          <LocationNameText data-testid="location-name" ref={locationRef}>
            <TranslatedReferenceData
              category="location"
              value={location.id}
              fallback={location.name}
            />{' '}
          </LocationNameText>
        </ConditionalTooltip>
      </LocationTitle>
    </LocationHeader>
  );
};

const DroppableSchedule = ({ locationId, timeSlots, slotDuration, children }) => {
  const scheduleRefs = useRef({});
  const moveMutation = useMoveLocationBookingMutation();
  const pixelsPerMinute = 70 / 60; // 70px per hour

  const getMinutesFromScheduleTop = useCallback(
    (locationId, clientY) => {
      const el = scheduleRefs.current[locationId];
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const offsetY = clientY - rect.top;
      return Math.max(0, Math.floor(offsetY / pixelsPerMinute));
    },
    [pixelsPerMinute],
  );

  const computeDropStartTime = useCallback(
    (locationId, clientY) => {
      if (!timeSlots?.length) return null;
      const baseStart = timeSlots[0].start;
      const minutesFromTop = getMinutesFromScheduleTop(locationId, clientY);
      return new Date(baseStart.getTime() + minutesFromTop * 60 * 1000);
    },
    [timeSlots, getMinutesFromScheduleTop],
  );

  const snapToNearestSlot = useCallback(
    date => {
      if (!date) return date;
      const baseStart = timeSlots[0].start;

      // Calculate the time difference from baseStart in milliseconds
      const timeDiff = date.getTime() - baseStart.getTime();

      // Calculate which slot this falls into (floor to get the previous slot)
      const slotIndex = Math.floor(timeDiff / slotDuration);

      // Calculate the snapped time
      const snappedTime = baseStart.getTime() + slotIndex * slotDuration;

      return new Date(snappedTime);
    },
    [timeSlots, slotDuration],
  );

  const registerScheduleRef = useCallback((locationId, el) => {
    if (el) scheduleRefs.current[locationId] = el;
  }, []);

  const [, drop] = useDrop(
    () => ({
      accept: 'APPOINTMENT',
      canDrop: item => item.appointment.locationId === locationId,
      drop: (item, monitor) => {
        const client = monitor.getClientOffset();
        if (!client) return;
        // The initial position of the appointment element itself when dragging started
        const initialClient = monitor.getInitialClientOffset();
        // The initial position of the appointment element itself when the drag operation started
        const initialSource = monitor.getInitialSourceClientOffset();
        // Align to the top border of the dragged tile
        let topY = client.y;
        if (initialClient && initialSource) {
          // 3: padding to account for the border of the dragged tile
          topY = client.y - (initialClient.y - initialSource.y) + 3;
        }
        const rawStart = computeDropStartTime(locationId, topY);
        const newStart = snapToNearestSlot(rawStart);

        if (!newStart) return;
        moveMutation.mutateAsync({
          id: item.appointment.id,
          startTime: toDateTimeString(newStart),
        });
      },
    }),
    [locationId, computeDropStartTime, snapToNearestSlot, moveMutation],
  );

  const setRefs = useCallback(
    el => {
      registerScheduleRef(locationId, el);
      drop(el);
    },
    [locationId, drop],
  );

  return <LocationSchedule ref={setRefs}>{children}</LocationSchedule>;
};

export const LocationBookingsDailyCalendar = ({
  locationsQuery,
  selectedDate,
  openBookingForm,
  openCancelModal,
  ...props
}) => {
  const { ability } = useAuth();
  const {
    filters: { bookingTypeId, clinicianId, patientNameOrId, locationGroupIds },
    selectedCell,
    updateSelectedCell,
    viewType,
  } = useLocationBookingsContext();

  const [selectedTimeCell, setSelectedTimeCell] = useState(null);
  const [emailModalState, setEmailModalState] = useState(null);

  useEffect(() => {
    if (!selectedCell || (!selectedCell.locationId && !selectedCell.date)) {
      setSelectedTimeCell(null);
    }
  }, [selectedCell]);

  const { data: locations } = locationsQuery;

  const { data: appointmentsData, isLoading, error } = useLocationBookingsQuery(
    {
      after: toDateTimeString(startOfDay(selectedDate)),
      before: toDateTimeString(endOfDay(selectedDate)),
      all: true,
      clinicianId,
      bookingTypeId,
      patientNameOrId,
      view: viewType,
    },
    { keepPreviousData: true },
  );

  const {
    data: assignmentsData,
    isLoading: isAssignmentsLoading,
  } = useFacilityLocationAssignmentsQuery(
    {
      after: toDateString(selectedDate),
      before: toDateString(selectedDate),
      all: true,
    },
    { keepPreviousData: true },
  );

  const appointments = appointmentsData?.data ?? [];
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);
  const assignments = assignmentsData?.data ?? [];

  // Partition assignments by location
  const assignmentsByLocation = {};
  assignments.forEach(assignment => {
    const locationId = assignment.locationId;
    if (!assignmentsByLocation[locationId]) {
      assignmentsByLocation[locationId] = [];
    }
    assignmentsByLocation[locationId].push(assignment);
  });

  // Filter locations based on location group filter
  let filteredLocations = locations || [];

  // Apply location group filter if set
  if (locationGroupIds?.length > 0) {
    filteredLocations = filteredLocations.filter(location =>
      locationGroupIds.includes(location.locationGroup?.id),
    );
  }

  const canCreateAppointment = ability.can('create', 'Appointment');

  const { slots: bookingSlots, slotDuration, isPending: isBookingSlotsLoading } = useBookingSlots(
    selectedDate,
  );

  const { mutateAsync: sendAppointmentEmail } = useSendAppointmentEmail(
    emailModalState?.appointmentId,
    {
      onSuccess: () =>
        toast.success(
          <TranslatedText
            stringId="appointments.action.emailReminder.success"
            fallback="Email successfully sent"
          />,
        ),
      onError: () =>
        toast.error(
          <TranslatedText
            stringId="appointments.action.emailReminder.error"
            fallback="Error sending email"
          />,
        ),
    },
  );

  // Generate hourly time slots based on booking slot time range
  const timeSlots = useMemo(() => {
    if (!bookingSlots || bookingSlots.length === 0) {
      // Fallback to 24-hour schedule if no booking slots
      const slots = [];
      for (let hour = 0; hour < 24; hour++) {
        const slotTime = setMinutes(setHours(selectedDate, hour), 0);
        slots.push({ start: slotTime, end: addHours(slotTime, 1) });
      }
      return slots;
    }

    // Use booking slots range but create 1-hour increments
    const startTime = bookingSlots[0].start;
    const endTime = bookingSlots[bookingSlots.length - 1].end;
    const slots = [];

    let currentHour = startTime;
    while (currentHour < endTime) {
      let nextHour = addHours(currentHour, 1);
      const durationMinutes = differenceInMinutes(endTime, currentHour);
      if (durationMinutes < 60) nextHour = addMinutes(currentHour, durationMinutes);

      slots.push({ start: currentHour, end: nextHour });
      currentHour = nextHour;
    }

    return slots;
  }, [bookingSlots, selectedDate]);

  const DraggableAppointment = ({ appointment, children }) => {
    const [{ isDragging }, dragRef] = useDrag(
      () => ({
        type: 'APPOINTMENT',
        item: { id: appointment.id, appointment },
        collect: monitor => ({ isDragging: monitor.isDragging() }),
        canDrag: isSameDay(new Date(appointment.startTime), new Date(appointment.endTime)),
      }),
      [appointment],
    );
    return (
      <div
        ref={dragRef}
        style={{ opacity: isDragging ? 0.5 : 1, height: '100%', width: '100%', display: 'flex' }}
      >
        {children}
      </div>
    );
  };

  // Helper function to find assigned user for a time slot
  const getAssignedUserForSlot = (locationId, slotIndex) => {
    if (!timeSlots || slotIndex >= timeSlots.length) return null;

    const locationAssignments = assignmentsByLocation[locationId] || [];
    const slot = timeSlots[slotIndex];

    const assignment = locationAssignments.find(assignment => {
      const assignmentStart = parseISO(assignment.startTime);
      const assignmentEnd = parseISO(assignment.endTime);

      // Check if assignment overlaps with this slot
      return assignmentStart < slot.end && assignmentEnd > slot.start;
    });

    return assignment?.user;
  };

  const handleCellClick = (locationId, slotIndex) => {
    if (!timeSlots || slotIndex >= timeSlots.length) return;

    const slot = timeSlots[slotIndex];
    const assignedUser = getAssignedUserForSlot(locationId, slotIndex);

    setSelectedTimeCell({ locationId, slotIndex });

    updateSelectedCell({ locationId, date: slot.start });

    const initialValues = {
      locationId,
      startDate: toDateString(slot.start),
    };

    // Add clinician if user clicked on allocated time
    if (assignedUser) {
      initialValues.clinicianId = assignedUser.id;
    }

    openBookingForm(initialValues);
  };

  // Helper function to calculate appointment position and height
  const getAppointmentStyle = appointment => {
    if (!timeSlots || timeSlots.length === 0) return { top: 0, height: 70 };

    const startTime = parseISO(appointment.startTime);
    const endTime = appointment.endTime ? parseISO(appointment.endTime) : addHours(startTime, 1);

    // Visible window of the daily grid based on generated time slots
    const visibleStart = timeSlots[0].start;
    const visibleEnd = timeSlots[timeSlots.length - 1].end;

    // Clamp appointment to visible window (handles overnight bookings and partial overlaps)
    const clampedStart = startTime < visibleStart ? visibleStart : startTime;
    const clampedEnd = endTime > visibleEnd ? visibleEnd : endTime;

    // If no overlap with visible window, don't render
    if (clampedEnd <= clampedStart || clampedEnd <= visibleStart || clampedStart >= visibleEnd) {
      return null;
    }

    // Calculate position based on minutes from visible window start
    const startOffset = differenceInMinutes(clampedStart, visibleStart);
    const duration = differenceInMinutes(clampedEnd, clampedStart);

    const pixelsPerMinute = 70 / 60; // 70px per hour = 1.167px per minute
    const top = startOffset * pixelsPerMinute;
    const height = Math.max(20, duration * pixelsPerMinute); // Minimum 20px height

    return { top, height };
  };

  if (isLoading || isAssignmentsLoading || isBookingSlotsLoading) {
    return <LoadingSkeleton data-testid="loadingskeleton-daily" />;
  }

  if (error) {
    return (
      <ErrorText data-testid="errortext-daily">
        <TranslatedText
          stringId="appointments.outpatientCalendar.error"
          fallback="Failed to load appointments. Please try again."
          data-testid="error-message"
        />
      </ErrorText>
    );
  }

  if (filteredLocations.length === 0) {
    return (
      <StatusText data-testid="statustext-daily-no-locations">
        <TranslatedText
          stringId="locationBooking.calendar.noLocationsToShow"
          fallback="No bookable locations to display. Please try adjusting the search filters."
          data-testid="no-locations-message"
        />
      </StatusText>
    );
  }

  return (
    <Box
      className={APPOINTMENT_CALENDAR_CLASS}
      display="flex"
      width="100%"
      height="100%"
      overflow="hidden"
      flex={1}
      data-testid="daily-calendar-container"
      {...props}
    >
      <ScrollWrapper>
        <CalendarGrid $locationCount={filteredLocations.length}>
          {/* Time column */}
          <TimeColumn>
            {/* Empty header space */}
            <Box sx={{ height: '140px', background: Colors.white }} />

            {/* Time slots */}
            {timeSlots.map((slot, index) => {
              const durationMinutes = differenceInMinutes(slot.end, slot.start);
              const height = (durationMinutes / 60) * 70; // 70px per hour
              return (
                <TimeSlot key={index} data-testid={`time-slot-${index}`} height={height}>
                  {format(slot.start, 'h:mm a')}
                </TimeSlot>
              );
            })}
          </TimeColumn>

          {/* Location columns */}
          {filteredLocations.map((location, locationIndex) => {
            const locationAppointments = appointmentsByLocation[location.id] || [];

            return (
              <LocationColumn key={location.id} data-testid={`location-column-${locationIndex}`}>
                <LocationHeaderContent
                  location={location}
                  assignments={assignmentsByLocation[location.id] || []}
                />

                <DroppableSchedule
                  locationId={location.id}
                  timeSlots={timeSlots}
                  slotDuration={slotDuration}
                >
                  {/* Time slot background grid */}
                  {timeSlots.map((slot, slotIndex) => {
                    const durationMinutes = differenceInMinutes(slot.end, slot.start);
                    const height = (durationMinutes / 60) * 70; // 70px per hour

                    // Calculate cumulative top position
                    const cumulativeTop = timeSlots.slice(0, slotIndex).reduce((sum, prevSlot) => {
                      const prevDurationMinutes = differenceInMinutes(prevSlot.end, prevSlot.start);
                      return sum + (prevDurationMinutes / 60) * 70;
                    }, 0);

                    const isSelected =
                      selectedTimeCell?.locationId === location.id &&
                      selectedTimeCell?.slotIndex === slotIndex;

                    return (
                      <TimeGridCell
                        key={slotIndex}
                        className={isSelected ? 'selected' : ''}
                        height={height}
                        sx={{
                          top: cumulativeTop,
                          borderBlockEnd:
                            slotIndex < timeSlots.length - 1
                              ? `max(0.0625rem, 1px) solid ${Colors.outline}`
                              : 'none',
                        }}
                        onClick={() =>
                          canCreateAppointment && handleCellClick(location.id, slotIndex)
                        }
                        data-testid={`time-grid-${locationIndex}-${slotIndex}`}
                      />
                    );
                  })}

                  {/* Appointments positioned by time */}
                  {locationAppointments.map((appointment, appointmentIndex) => {
                    const style = getAppointmentStyle(appointment);
                    if (!style) return null;
                    return (
                      <AppointmentWrapper
                        key={appointment.id}
                        style={{
                          top: `${style.top}px`,
                          height: `${style.height}px`,
                        }}
                        data-testid={`appointment-wrapper-${locationIndex}-${appointmentIndex}`}
                      >
                        <DraggableAppointment appointment={appointment}>
                          <AppointmentTile
                            appointment={appointment}
                            hideTime={false}
                            className="appointment-tile"
                            onEdit={() => openBookingForm(appointment)}
                            onCancel={() => openCancelModal(appointment)}
                            actions={
                              canCreateAppointment
                                ? [
                                    {
                                      label: (
                                        <TranslatedText
                                          stringId="locationBooking.action.emailBooking"
                                          fallback="Email booking"
                                          data-testid={`translatedtext-email-booking-${locationIndex}-${appointmentIndex}`}
                                        />
                                      ),
                                      action: () =>
                                        setEmailModalState({
                                          appointmentId: appointment.id,
                                          email: appointment.patient?.email,
                                        }),
                                    },
                                  ]
                                : []
                            }
                            testIdPrefix={`${locationIndex}-${appointmentIndex}`}
                          />
                        </DraggableAppointment>
                      </AppointmentWrapper>
                    );
                  })}
                </DroppableSchedule>
              </LocationColumn>
            );
          })}
        </CalendarGrid>
      </ScrollWrapper>
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
    </Box>
  );
};
