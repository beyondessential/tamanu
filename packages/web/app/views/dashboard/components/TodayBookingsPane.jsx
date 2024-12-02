import React from 'react';
import styled from 'styled-components';
import Timeline from '@material-ui/lab/Timeline';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineDot from '@material-ui/lab/TimelineDot';
import { WS_EVENTS } from '@tamanu/constants';
import { useHistory } from 'react-router-dom';
import { endOfDay, startOfDay } from 'date-fns';
import { formatTime, toDateTimeString } from '@tamanu/shared/utils/dateTime';
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

const Container = styled.div`
  ${({ showTasks }) => showTasks && 'flex-grow: 1;'}
  width: 376px;
  min-height: 318px;
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
  flex: 1;
  height: 0;
  overflow-y: auto;
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
  cursor: pointer;
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
  margin: 11px 20px 0;
  height: 20px;
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
  const { currentUser } = useAuth();
  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation();
  const appointments =
    useAutoUpdatingQuery(
      'appointments',
      {
        locationId: '',
        all: true,
        after: toDateTimeString(startOfDay(new Date())),
        before: toDateTimeString(endOfDay(new Date())),
        clinicianId: currentUser?.id,
      },
      `${WS_EVENTS.DATABASE_TABLE_CHANGED}:appointments`,
    ).data?.data ?? [];
  const history = useHistory();

  const onViewAll = () => {
    history.push(`/appointments/locations?clinicianId=${currentUser?.id}`);
  };

  const onLocationBookingsClick = async () => {
    await mutateUserPreferences({ locationBookingFilters: {} });
    history.push(`/appointments/locations`);
  };

  return (
    <Container showTasks={showTasks}>
      <TitleContainer>
        <Heading4 margin={0}>
          <TranslatedText
            stringId="dashboard.bookings.todayBookings.title"
            fallback="Today's Bookings"
          />
        </Heading4>
        <ActionLink onClick={onViewAll}>
          <TranslatedText
            stringId="dashboard.bookings.todayBookings.viewAll"
            fallback="View All..."
          />
        </ActionLink>
      </TitleContainer>
      {!appointments.length ? (
        <NoDataContainer>
          <div>
            <TranslatedText
              stringId="dashboard.bookings.todayBookings.noBookings"
              fallback="You have no bookings scheduled for today. To view other bookings, visit"
            />
            <Link onClick={onLocationBookingsClick}>
              <TranslatedText
                stringId="dashboard.bookings.todayBookings.locationBookings"
                fallback="Location bookings"
              />
            </Link>
          </div>
        </NoDataContainer>
      ) : (
        <>
          <StyledTimeline>
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
