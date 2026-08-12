import React from 'react';
import { omit } from 'es-toolkit/compat';
import styled from 'styled-components';
import Timeline from '@material-ui/lab/Timeline';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineDot from '@material-ui/lab/TimelineDot';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import { USER_PREFERENCES_KEYS, WS_EVENTS } from '@tamanu/constants';
import { useNavigate } from 'react-router';
import { Box } from '@material-ui/core';
import {
  DateDisplay,
  TimeDisplay,
  TranslatedText,
  useDateRangeSpan,
  useDateTime,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { Heading4 } from '../../../components';
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
  min-inline-size: 22.875rem;
  min-block-size: 41%;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding-block-start: 0.9375rem;
  background-color: ${Colors.white};
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-block-end: 1px solid ${Colors.outline};
  padding-block-end: 6px;
  margin-inline: 1.25rem;
  margin-block-end: 11px;
`;

const ActionLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
`;

/**
 * One grid for the whole list, with each row a subgrid of it, so the time column is
 * a single track as wide as the widest row needs and every card starts at the same
 * place. The track's floor is in `ch` rather than pixels because the times and dates
 * are locale-formatted and their width belongs to the reader, not to the design.
 */
const StyledTimeline = styled(Timeline)`
  display: grid;
  grid-template-columns: auto minmax(15ch, max-content) 1fr;
  column-gap: 5px;
  padding-block: 0;
  padding-inline: 0.75rem 1.25rem;
  margin: 0;
  margin-block-end: -1rem;
  overflow-y: auto;
  ${({ length }) => `max-block-size: calc(${length} * (3.75rem + 1lh) + 21px);`}
`;

const StyledTimelineContent = styled(TimelineContent)`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 2 / -1;
  align-items: center;
  font-size: 14px;
  padding: 0;
`;

const StyledTimelineConnector = styled(TimelineConnector)`
  background-color: ${Colors.outline};
  inline-size: 1px;
`;

const StyledTimelineItem = styled(TimelineItem)`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  min-block-size: 3.75rem;
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

/* Sized in lines of text, so it grows rather than clipping when a row wraps */
const Card = styled.div`
  min-block-size: 3lh;
  border-radius: 3px;
  padding-block: 8px;
  padding-inline: 1rem;
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
  padding-inline-start: 6px;
`;

/**
 * Each end of the range is its own line rather than one inline run that wraps. An
 * icon is an atomic inline, so line breaks are allowed either side of it: left to
 * wrap on its own it lands on a line of its own, and the width the grid track needs
 * becomes hard to predict. As explicit lines, each one is unbreakable and the track
 * is simply as wide as the wider of the two.
 */
const RangeLine = styled.div`
  white-space: nowrap;
`;

const OvernightIcon = styled(Brightness2Icon)`
  /* Tracks the text beside it rather than pinning a pixel size against 14px type */
  font-size: 1em;
  color: ${Colors.primary};
  vertical-align: -0.1em;
  margin-inline-start: 0.3em;
`;

const Footer = styled.div`
  margin-inline: 1.25rem;
  margin-block-start: 4px;
  flex-grow: 1;
  min-block-size: 1.25rem;
  border-block-start: 1px solid ${Colors.outline};
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

/**
 * One end of a booking's time range, isolated so a right-to-left month name cannot
 * absorb the digits beside it and reorder the date against the time.
 */
const RangeEnd = ({ date, withDate, testIdSuffix }) => (
  <bdi>
    {withDate ? (
      <DateDisplay
        date={date}
        format="dayMonth"
        timeFormat="default"
        noTooltip
        data-testid={`datedisplay-${testIdSuffix}-w2kf`}
      />
    ) : (
      <TimeDisplay date={date} noTooltip data-testid={`timedisplay-${testIdSuffix}-qz61`} />
    )}
  </bdi>
);

const BookingsTimelineItem = ({ appointment, today }) => {
  const { startTime, endTime, location, patient, status } = appointment;
  const { locationGroup } = location;

  const { spansMultipleDays, hasEnd, showStartDate, showEndDate } = useDateRangeSpan({
    start: startTime,
    end: endTime,
    onDate: today,
  });

  const [headingRef, isHeadingOverflowing] = useOverflow();
  const [bodyRef, isBodyOverflowing] = useOverflow();
  const showTooltip = isHeadingOverflowing || isBodyOverflowing;

  return (
    <StyledTimelineItem data-testid="styledtimelineitem-fyu7">
      <StyledTimelineSeparator data-testid="styledtimelineseparator-vte2">
        <StyledTimelineDot data-testid="styledtimelinedot-9oqv">
          <AppointmentStatusIndicator
            appointmentStatus={status}
            width={13}
            height={13}
            data-testid="appointmentstatusindicator-1xys"
          />
        </StyledTimelineDot>
        <StyledTimelineConnector data-testid="styledtimelineconnector-qmh4" />
      </StyledTimelineSeparator>
      <StyledTimelineContent data-testid="styledtimelinecontent-ptdu">
        {/* A booking within the day keeps its single line. One that spans days takes
            two, so neither line has to be broken to fit the column. */}
        <TimeText data-testid="timetext-4k7e">
          {spansMultipleDays ? (
            <>
              <RangeLine data-testid="rangeline-start-8ptz">
                <RangeEnd date={startTime} withDate={showStartDate} testIdSuffix="start" />
                &nbsp;&ndash;
              </RangeLine>
              <RangeLine data-testid="rangeline-end-4vqx">
                <RangeEnd date={endTime} withDate={showEndDate} testIdSuffix="end" />
                <OvernightIcon
                  aria-label="Overnight booking"
                  aria-hidden={undefined}
                  data-testid="overnighticon-p8ka"
                />
              </RangeLine>
            </>
          ) : (
            <RangeLine data-testid="rangeline-start-8ptz">
              <RangeEnd date={startTime} withDate={showStartDate} testIdSuffix="start" />
              {hasEnd && (
                <>
                  &nbsp;&ndash; <RangeEnd date={endTime} withDate={false} testIdSuffix="end" />
                </>
              )}
            </RangeLine>
          )}
        </TimeText>
        {/* min-width rather than width: in a grid track it is what lets the card
            shrink below its content so the headings can ellipsise */}
        <Box minWidth={0} data-testid="box-i72x">
          <ConditionalTooltip
            visible={showTooltip}
            title={
              <div>
                {locationGroup.name} {location.name}
                <Box fontWeight={400} data-testid="box-qs48">
                  {patient.firstName} {patient.lastName}
                </Box>
              </div>
            }
            data-testid="conditionaltooltip-u7j6"
          >
            <Card $color={APPOINTMENT_STATUS_COLORS[status]} data-testid="card-iw4n">
              <CardHeading ref={headingRef} data-testid="cardheading-1aj8">
                {locationGroup.name} {location.name}
              </CardHeading>
              <CardBody ref={bodyRef} data-testid="cardbody-id09">
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
  const { getCurrentDate, getDayBoundaries } = useDateTime();
  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);

  // Get today's date boundaries in facility timezone, converted to primary timezone for query
  const todayFacility = getCurrentDate();
  const { start, end } = getDayBoundaries(todayFacility);
  const appointments =
    useAutoUpdatingQuery(
      'appointments',
      {
        locationId: '',
        all: true,
        after: start,
        before: end,
        clinicianId: currentUser?.id,
        facilityId,
      },
      `${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${currentUser?.id}`,
    ).data?.data ?? [];
  const navigate = useNavigate();

  const onViewAll = () => {
    navigate(`/appointments/locations?clinicianId=${currentUser?.id}`);
  };

  const onLocationBookingsClick = async () => {
    await mutateUserPreferences({
      key: USER_PREFERENCES_KEYS.LOCATION_BOOKING_FILTERS,
      value: omit(LOCATION_BOOKINGS_EMPTY_FILTER_STATE, ['patientNameOrId']),
    });
    navigate(`/appointments/locations`);
  };

  return (
    <Container showTasks={showTasks} data-testid="container-jfr4">
      <TitleContainer data-testid="titlecontainer-xwsk">
        <Heading4 margin={0} data-testid="heading4-htzn">
          <TranslatedText
            stringId="dashboard.bookings.todayBookings.title"
            fallback="Today's bookings"
            data-testid="translatedtext-ekxd"
          />
        </Heading4>
        {!!appointments.length && (
          <ActionLink onClick={onViewAll} data-testid="actionlink-5g8z">
            <TranslatedText
              stringId="dashboard.bookings.todayBookings.viewAll"
              fallback="View all…"
              data-testid="translatedtext-hiv0"
            />
          </ActionLink>
        )}
      </TitleContainer>
      {!appointments.length ? (
        <NoDataContainer data-testid="nodatacontainer-68oz">
          <Box maxWidth={285} data-testid="box-yia1">
            <TranslatedText
              stringId="dashboard.bookings.todayBookings.noBookings"
              fallback="You have no bookings scheduled for today. To view other bookings, visit"
              data-testid="translatedtext-6kc9"
            />
            <Link onClick={onLocationBookingsClick} data-testid="link-7f7w">
              <TranslatedText
                stringId="dashboard.bookings.todayBookings.locationBookings"
                fallback="Location bookings"
                data-testid="translatedtext-rq0g"
              />
            </Link>
          </Box>
        </NoDataContainer>
      ) : (
        <>
          <StyledTimeline length={appointments.length} data-testid="styledtimeline-j8uu">
            {appointments.map((appointment, index) => (
              <BookingsTimelineItem
                key={appointment.id}
                appointment={appointment}
                today={todayFacility}
                data-testid={`bookingstimelineitem-kl6a-${index}`}
              />
            ))}
          </StyledTimeline>
          <Footer data-testid="footer-02ym" />
        </>
      )}
    </Container>
  );
};
