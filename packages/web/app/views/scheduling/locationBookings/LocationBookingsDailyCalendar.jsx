import { endOfDay, startOfDay, format } from 'date-fns';
import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { toDateTimeString, toDateString } from '@tamanu/utils/dateTime';

import { useLocationBookingsQuery, useFacilityLocationAssignmentsQuery } from '../../../api/queries';
import { TranslatedText, TranslatedReferenceData } from '../../../components';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components/Appointments/AppointmentDetailPopper';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { partitionAppointmentsByLocation } from './utils';
import { useAuth } from '../../../contexts/Auth';

const ColumnWrapper = styled(Box)`
  --column-width: 14rem;
  display: flex;
  flex-direction: column;
  inline-size: var(--column-width);
  min-block-size: max-content;

  > * {
    padding-inline: 0.5rem;
  }

  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  &:not(:first-child) {
    border-inline-start: var(--border-style);
  }
  &:last-child {
    border-inline-end: var(--border-style);
  }
`;

const HeadCellWrapper = styled(Box)`
  align-items: center;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
  inline-size: calc(var(--column-width) - 2px);
  inset-block-start: 0;
  justify-content: center;
  position: sticky;
  text-align: center;
  border-block-end: max(0.0625rem, 1px) solid ${Colors.outline};
`;

const HeadCellTextWrapper = styled(Box)`
  block-size: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const HeadCellText = styled.div`
  -webkit-box-orient: vertical;
  display: -webkit-box;
  font-weight: 400;
  -webkit-line-clamp: 2;
  overflow: hidden;
  padding-inline: 0.5rem;
  font-size: 0.875rem;
`;


const AppointmentColumnWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-block: 0.5rem;
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

const formatTime = (time) => {
  return format(new Date(time), 'h:mma').toLowerCase();
};

const HeadCell = ({ location, assignments = [] }) => (
  <>
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
    
    <HeadCellWrapper data-testid="headcellwrapper-daily">
      <HeadCellTextWrapper data-testid="headcelltextwrapper-daily">
        <HeadCellText data-testid="headcelltext-daily">
          <TranslatedReferenceData
            category="locationGroup"
            value={location.locationGroup.id}
            fallback={location.locationGroup.name}
            data-testid="locationgroup-name"
          />
          {' - '}
          <TranslatedReferenceData
            category="location"
            value={location.id}
            fallback={location.name}
            data-testid="location-name"
          />
        </HeadCellText>
      </HeadCellTextWrapper>
    </HeadCellWrapper>
  </>
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
  } = useLocationBookingsContext();

  const { data: locations } = locationsQuery;

  const { data: appointmentsData, isLoading, error } = useLocationBookingsQuery(
    {
      after: toDateTimeString(startOfDay(selectedDate)),
      before: toDateTimeString(endOfDay(selectedDate)),
      all: true,
      clinicianId,
      bookingTypeId,
      patientNameOrId,
    },
    { keepPreviousData: true },
  );

  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useFacilityLocationAssignmentsQuery(
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
  assignments.forEach((assignment) => {
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
      locationGroupIds.includes(location.locationGroup?.id)
    );
  }
  
  // For daily view, show all locations (even without bookings)
  const locationsToShow = filteredLocations;

  const canCreateAppointment = ability.can('create', 'Appointment');

  if (isLoading || isAssignmentsLoading) {
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
      <StatusText data-testid="statustext-daily">
        <TranslatedText
          stringId="locationBooking.calendar.noBookableLocations"
          fallback="No bookable locations to display. Please try adjusting the search filters."
          data-testid="no-locations-message"
        />
      </StatusText>
    );
  }

  if (locationsToShow.length === 0) {
    return (
      <StatusText data-testid="statustext-daily-no-locations">
        <TranslatedText
          stringId="locationBooking.calendar.noBookableLocations"
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
      overflow="auto"
      flex={1}
      data-testid="daily-calendar-container"
      {...props}
    >
      {locationsToShow.map((location, locationIndex) => {
        const locationAppointments = appointmentsByLocation[location.id] || [];
        
        return (
          <ColumnWrapper 
            className="column-wrapper" 
            key={location.id} 
            data-testid={`column-wrapper-${locationIndex}`}
          >
            <HeadCell 
              location={location}
              assignments={assignmentsByLocation[location.id] || []}
              data-testid={`head-cell-${locationIndex}`}
            />
            <AppointmentColumnWrapper data-testid={`appointment-column-${locationIndex}`}>
              {locationAppointments.map((appointment, appointmentIndex) => (
                <AppointmentTile
                  key={appointment.id}
                  appointment={appointment}
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
                            action: () => openBookingForm({
                              locationId: location.id,
                              startDate: selectedDate,
                            }),
                          },
                        ]
                      : []
                  }
                  testIdPrefix={`${locationIndex}-${appointmentIndex}`}
                />
              ))}
            </AppointmentColumnWrapper>
          </ColumnWrapper>
        );
      })}
    </Box>
  );
};