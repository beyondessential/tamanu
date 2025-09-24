import { endOfDay, startOfDay, format, addHours, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { toDateTimeString, toDateString } from '@tamanu/utils/dateTime';

import {
  useLocationBookingsQuery,
  useFacilityLocationAssignmentsQuery,
} from '../../../api/queries';
import { TranslatedText, TranslatedReferenceData } from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { LOCATION_BOOKABLE_VIEW } from '@tamanu/constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { partitionAppointmentsByLocation } from './utils';
import { useAuth } from '../../../contexts/Auth';
import { useBookingSlots } from '../../../hooks/useBookingSlots';

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
  height: 70px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-block-start: 0.25rem;
  font-size: 0.75rem;
  color: ${Colors.midText};
  background: ${Colors.white};
  position: relative;
  top: -12px;
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

const LocationSchedule = styled.div`
  position: relative;
  flex: 1;
  min-height: calc(70px * var(--hour-count));
`;

const AppointmentWrapper = styled.div`
  position: absolute;
  left: 4px;
  right: 4px;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 1px;
    background: ${Colors.white};
    z-index: 1;
    pointer-events: none;
  }

  .appointment-tile {
    height: calc(100% - 5px);
    margin-top: 2px;
    margin-bottom: 3px;
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
  height: 70px;
  background: ${Colors.white};
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${Colors.primary10};
  }

  &.selected {
    border: 1px solid ${Colors.primary};
  }

  ${props =>
    props.$hasAppointment &&
    `
    pointer-events: none;
  `}
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

const LocationHeaderContent = ({ location, assignments = [] }) => (
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

    <Box
      sx={{
        padding: '0.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      data-testid="location-title"
    >
      <Box sx={{ fontSize: '11px', color: Colors.midText }} data-testid="locationgroup-name">
        <TranslatedReferenceData
          category="locationGroup"
          value={location.locationGroup.id}
          fallback={location.locationGroup.name}
        />
      </Box>
      <Box sx={{ fontSize: '14px', color: Colors.darkestText }} data-testid="location-name">
        <TranslatedReferenceData category="location" value={location.id} fallback={location.name} />
      </Box>
    </Box>
  </LocationHeader>
);

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

  // Filter locations based on location group and bookable view settings
  const filteredLocations = (locations || []).filter(location => {
    // Check location group filter if set
    const matchesLocationGroup = locationGroupIds?.length > 0 
      ? locationGroupIds.includes(location.locationGroup?.id)
      : true;
    
    // Check bookable view setting for daily view
    const isBookable = location.locationGroup?.isBookable;
    const isViewable = isBookable === LOCATION_BOOKABLE_VIEW.ALL || isBookable === LOCATION_BOOKABLE_VIEW.DAILY;
    
    return matchesLocationGroup && isViewable;
  });

  const locationsToShow = filteredLocations;

  const canCreateAppointment = ability.can('create', 'Appointment');

  const { slots: bookingSlots, isPending: isBookingSlotsLoading } = useBookingSlots(selectedDate);

  // Helper function to check if a time slot has an appointment
  const hasAppointmentInSlot = (locationId, slotIndex) => {
    if (!bookingSlots || slotIndex >= bookingSlots.length) return false;

    const locationAppointments = appointmentsByLocation[locationId] || [];
    const slot = bookingSlots[slotIndex];

    return locationAppointments.some(appointment => {
      const appointmentStart = parseISO(appointment.startTime);
      const appointmentEnd = appointment.endTime
        ? parseISO(appointment.endTime)
        : addHours(appointmentStart, 1);

      // Check if appointment overlaps with this slot
      return appointmentStart < slot.end && appointmentEnd > slot.start;
    });
  };

  // Helper function to find assigned user for a time slot
  const getAssignedUserForSlot = (locationId, slotIndex) => {
    if (!bookingSlots || slotIndex >= bookingSlots.length) return null;

    const locationAssignments = assignmentsByLocation[locationId] || [];
    const slot = bookingSlots[slotIndex];

    const assignment = locationAssignments.find(assignment => {
      const assignmentStart = parseISO(assignment.startTime);
      const assignmentEnd = parseISO(assignment.endTime);

      // Check if assignment overlaps with this slot
      return assignmentStart < slot.end && assignmentEnd > slot.start;
    });

    return assignment?.user;
  };

  const handleCellClick = (locationId, slotIndex) => {
    if (!bookingSlots || slotIndex >= bookingSlots.length) return;

    const slot = bookingSlots[slotIndex];
    const assignedUser = getAssignedUserForSlot(locationId, slotIndex);

    setSelectedTimeCell({ locationId, slotIndex });

    updateSelectedCell({ locationId, date: slot.start });

    const initialValues = {
      locationId,
      startTime: toDateTimeString(slot.start),
      endTime: toDateTimeString(slot.end),
    };

    // Add clinician if user clicked on allocated time
    if (assignedUser) {
      initialValues.clinicianId = assignedUser.id;
    }

    openBookingForm(initialValues);
  };

  const timeSlots = bookingSlots || [];
  const hourCount = timeSlots.length;

  // Helper function to calculate appointment position and height
  const getAppointmentStyle = appointment => {
    if (!bookingSlots || bookingSlots.length === 0) return { top: 0, height: 70 };

    const startTime = parseISO(appointment.startTime);
    const endTime = appointment.endTime ? parseISO(appointment.endTime) : addHours(startTime, 1);
    
    // Find which slot(s) the appointment overlaps with
    let startSlotIndex = -1;
    let endSlotIndex = -1;
    
    for (let i = 0; i < bookingSlots.length; i++) {
      const slot = bookingSlots[i];
      
      // Find the first slot that the appointment starts in or overlaps with
      if (startSlotIndex === -1 && startTime < slot.end && endTime > slot.start) {
        startSlotIndex = i;
      }
      
      // Find the last slot that the appointment ends in or overlaps with
      if (startTime < slot.end && endTime > slot.start) {
        endSlotIndex = i;
      }
    }
    
    // Fallback if appointment doesn't overlap with any slots
    if (startSlotIndex === -1 || endSlotIndex === -1) {
      return { top: 0, height: 70 };
    }
    
    // Calculate position based on slot grid (70px per slot)
    const slotHeight = 70;
    const top = startSlotIndex * slotHeight;
    const slotsSpanned = endSlotIndex - startSlotIndex + 1;
    const height = Math.max(30, slotsSpanned * slotHeight);

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

  if (locationsToShow.length === 0) {
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
        <CalendarGrid $locationCount={locationsToShow.length} style={{ '--hour-count': hourCount }}>
          {/* Time column */}
          <TimeColumn>
            {/* Empty header space */}
            <Box sx={{ height: '140px', background: Colors.white }} />

            {/* Time slots */}
            {timeSlots.map((slot, index) => (
              <TimeSlot key={index} data-testid={`time-slot-${index}`}>
                {format(slot.start, 'h:mm a')}
              </TimeSlot>
            ))}
          </TimeColumn>

          {/* Location columns */}
          {locationsToShow.map((location, locationIndex) => {
            const locationAppointments = appointmentsByLocation[location.id] || [];

            return (
              <LocationColumn key={location.id} data-testid={`location-column-${locationIndex}`}>
                <LocationHeaderContent
                  location={location}
                  assignments={assignmentsByLocation[location.id] || []}
                />

                <LocationSchedule>
                  {/* Time slot background grid */}
                  {timeSlots.map((_, slotIndex) => {
                    const hasAppointment = hasAppointmentInSlot(location.id, slotIndex);
                    const isSelected =
                      selectedTimeCell?.locationId === location.id &&
                      selectedTimeCell?.slotIndex === slotIndex;

                    return (
                      <TimeGridCell
                        key={slotIndex}
                        $hasAppointment={hasAppointment}
                        className={isSelected ? 'selected' : ''}
                        sx={{
                          top: slotIndex * 70,
                          borderBlockEnd:
                            slotIndex < timeSlots.length - 1
                              ? `max(0.0625rem, 1px) solid ${Colors.outline}`
                              : 'none',
                        }}
                        onClick={() =>
                          canCreateAppointment &&
                          !hasAppointment &&
                          handleCellClick(location.id, slotIndex)
                        }
                        data-testid={`time-grid-${locationIndex}-${slotIndex}`}
                      />
                    );
                  })}

                  {/* Appointments positioned by time */}
                  {locationAppointments.map((appointment, appointmentIndex) => {
                    const style = getAppointmentStyle(appointment);
                    return (
                      <AppointmentWrapper
                        key={appointment.id}
                        style={{
                          top: `${style.top}px`,
                          height: `${style.height}px`,
                        }}
                        data-testid={`appointment-wrapper-${locationIndex}-${appointmentIndex}`}
                      >
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
                                        stringId="appointments.action.newAppointment"
                                        fallback="New appointment"
                                        data-testid={`new-appointment-${locationIndex}-${appointmentIndex}`}
                                      />
                                    ),
                                    action: () =>
                                      openBookingForm({
                                        locationId: location.id,
                                        startDate: selectedDate,
                                      }),
                                  },
                                ]
                              : []
                          }
                          testIdPrefix={`${locationIndex}-${appointmentIndex}`}
                        />
                      </AppointmentWrapper>
                    );
                  })}
                </LocationSchedule>
              </LocationColumn>
            );
          })}
        </CalendarGrid>
      </ScrollWrapper>
    </Box>
  );
};
