import React from 'react';
import { omit } from 'lodash';
import styled from 'styled-components';
import Timeline from '@material-ui/lab/Timeline';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineDot from '@material-ui/lab/TimelineDot';
import { USER_PREFERENCES_KEYS, WS_EVENTS } from '@tamanu/constants';
import { useHistory } from 'react-router-dom';
import { endOfDay, startOfDay } from 'date-fns';
import { formatTime, toDateTimeString } from '@tamanu/utils/dateTime';
import { Box } from '@material-ui/core';

import { Heading4, TranslatedText } from '../../../components';
import { Colors } from '../../../constants';
import {
  APPOINTMENT_STATUS_COLORS,
  AppointmentStatusIndicator,
} from '../../../components/Appointments/appointmentStatusIndicators';
import useOverflow from '../../../hooks/useOverflow';
import { ConditionalTooltip } from '../../../components/Tooltip';
import { useAutoUpdatingQuery } from '../../../api/queries/useAutoUpdatingQuery';
import { useAuth } from '../../../contexts/Auth';
import { useUserPreferencesMutation } from '../../../api/mutations';
import { LOCATION_BOOKINGS_EMPTY_FILTER_STATE } from '../../../contexts/LocationBookings';

const Container = styled.div`
  ${({ showTasks }) => showTasks && 'flex-grow: 1; width: 100%;'}
  min-width: 366px;
  min-height: 41%;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding-top: 15px;
  background-color: ${Colors.white};
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${Colors.outline};
  padding-bottom: 6px;
  margin: 0 20px 11px;
`;

const ActionLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
`;

const StyledTimeline = styled(Timeline)`
  padding-top: 0;
  padding-right: 20px;
  padding-left: 12px;
  margin: 0;
  margin-bottom: -16px;
  overflow-y: auto;
  ${({ length }) => `max-height: calc(60px * ${length} + 21px);`}
`;

const StyledTimelineContent = styled(TimelineContent)`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  padding-left: 6px;
  width: 0;
`;

const StyledTimelineConnector = styled(TimelineConnector)`
  background-color: ${Colors.outline};
  width: 1px;
`;

const StyledTimelineItem = styled(TimelineItem)`
  min-height: 60px;
  &:before {
    content: none;
  }
  &:last-child {
    .MuiTimelineConnector-root {
      display: none;
    }
  }
`;

const StyledTimelineDot = styled(TimelineDot)`
  padding: 0;
  margin: 0;
  background: transparent;
  box-shadow: none;
`;

const StyledTimelineSeparator = styled(TimelineSeparator)`
  position: relative;
  top: 21px;
`;

const Card = styled.div`
  background-color: ${Colors.outline};
  height: 54px;
  border-radius: 3px;
  padding: 8px 16px;
  flex-grow: 0;
  flex-shrink: 0;
  background-color: ${({ $color }) => `${$color}1a`};
`;

const CardHeading = styled.div`
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardBody = styled(CardHeading)`
  font-weight: 400;
`;

const TimeText = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  width: 122px;
  text-transform: lowercase;
`;

const Footer = styled.div`
  margin: 4px 20px 0;
  flex-grow: 1;
  min-height: 20px;
  border-top: 1px solid ${Colors.outline};
  position: sticky;
  background-color: ${Colors.white};
`;

const NoDataContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin: 0 20px 20px;
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.primary};
  background-color: ${Colors.hoverGrey};
  text-align: center;
`;

const Link = styled.div`
  text-decoration: underline;
  cursor: pointer;
`;

const getFormattedBookingTime = ({ startTime, endTime }) =>
  `${formatTime(startTime).replace(' ', '')} - ${formatTime(endTime).replace(' ', '')}`;

const BookingsTimelineItem = ({ appointment }) => {
  const { startTime, endTime, location, patient, status } = appointment;
  const { locationGroup } = location;

  const [headingRef, isHeadingOverflowing] = useOverflow();
  const [bodyRef, isBodyOverflowing] = useOverflow();
  const showTooltip = isHeadingOverflowing || isBodyOverflowing;

  return (
    <StyledTimelineItem>
      <StyledTimelineSeparator>
        <StyledTimelineDot>
          <AppointmentStatusIndicator appointmentStatus={status} width={13} height={13} />
        </StyledTimelineDot>
        <StyledTimelineConnector />
      </StyledTimelineSeparator>
      <StyledTimelineContent>
        <TimeText>{getFormattedBookingTime({ startTime, endTime })}</TimeText>
        <Box width={0} flex={1}>
          <ConditionalTooltip
            visible={showTooltip}
            title={
              <div>
                {locationGroup.name} {location.name}
                <Box fontWeight={400}>
                  {patient.firstName} {patient.lastName}
                </Box>
              </div>
            }
          >
            <Card $color={APPOINTMENT_STATUS_COLORS[status]}>
              <CardHeading ref={headingRef}>
                {locationGroup.name} {location.name}
              </CardHeading>
              <CardBody ref={bodyRef}>
                {patient.firstName} {patient.lastName}
              </CardBody>
            </Card>
          </ConditionalTooltip>
        </Box>
      </StyledTimelineContent>
    </StyledTimelineItem>
  );
};

export const TodayBookingsPane = ({ showTasks }) => {
  const { currentUser, facilityId } = useAuth();
  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
  const appointments =
    useAutoUpdatingQuery(
      'appointments',
      {
        locationId: '',
        all: true,
        after: toDateTimeString(startOfDay(new Date())),
        before: toDateTimeString(endOfDay(new Date())),
        clinicianId: currentUser?.id,
        facilityId,
      },
      `${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${currentUser?.id}`,
    ).data?.data ?? [];
  const history = useHistory();

  const onViewAll = () => {
    history.push(`/appointments/locations?clinicianId=${currentUser?.id}`);
  };

  const onLocationBookingsClick = async () => {
    await mutateUserPreferences({
      key: USER_PREFERENCES_KEYS.LOCATION_BOOKING_FILTERS,
      value: omit(LOCATION_BOOKINGS_EMPTY_FILTER_STATE, ['patientNameOrId']),
    });
    history.push(`/appointments/locations`);
  };

  return (
    <Container showTasks={showTasks}>
      <TitleContainer>
        <Heading4 margin={0}>
          <TranslatedText
            stringId="dashboard.bookings.todayBookings.title"
            fallback="Today's bookings"
            data-test-id='translatedtext-10e7' />
        </Heading4>
        {!!appointments.length && (
          <ActionLink onClick={onViewAll}>
            <TranslatedText
              stringId="dashboard.bookings.todayBookings.viewAll"
              fallback="View all..."
              data-test-id='translatedtext-qgyk' />
          </ActionLink>
        )}
      </TitleContainer>
      {!appointments.length ? (
        <NoDataContainer>
          <Box maxWidth={285}>
            <TranslatedText
              stringId="dashboard.bookings.todayBookings.noBookings"
              fallback="You have no bookings scheduled for today. To view other bookings, visit"
              data-test-id='translatedtext-ygl6' />
            <Link onClick={onLocationBookingsClick}>
              <TranslatedText
                stringId="dashboard.bookings.todayBookings.locationBookings"
                fallback="Location bookings"
                data-test-id='translatedtext-ykvd' />
            </Link>
          </Box>
        </NoDataContainer>
      ) : (
        <>
          <StyledTimeline length={appointments.length}>
            {appointments.map(appointment => (
              <BookingsTimelineItem key={appointment.id} appointment={appointment} />
            ))}
          </StyledTimeline>
          <Footer />
        </>
      )}
    </Container>
  );
};
