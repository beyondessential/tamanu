import React from 'react';
import { omit } from 'es-toolkit/compat';
import styled from 'styled-components';
import { USER_PREFERENCES_KEYS, WS_EVENTS } from '@tamanu/constants';
import { useNavigate } from 'react-router';
import { Box } from '@material-ui/core';
import { trimToDate } from '@tamanu/utils/dateTime';
import { RangeEndDisplay, TranslatedText, useDateTime } from '@tamanu/ui-components';
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
  flex-grow: 1;
  ${({ showTasks }) => showTasks && 'width: 100%;'}
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

/**
 * One grid for the whole list, each row a subgrid of it, so the time column is a single
 * track and every card starts in the same place.
 *
 * The floor is on the card track rather than the time track: the card's contents carry
 * `min-width: 0` to ellipsise, so without it the grid starves the card to nothing before
 * the range ever wraps.
 */
const BookingsList = styled.div`
  display: grid;
  grid-template-columns: auto minmax(min-content, max-content) minmax(17ch, 1fr);
  column-gap: 5px;
  padding-right: 20px;
  padding-left: 12px;
  /* Inherited from the MUI Timeline root this replaced; the -16px is tuned against it */
  padding-bottom: 6px;
  margin-bottom: -16px;
  overflow-y: auto;
`;

const BookingRow = styled.div`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  min-height: 60px;
`;

const RowContent = styled.div`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 2 / -1;
  align-items: center;
  font-size: 14px;
`;

/**
 * The rail shares the indicator's grid cell so one mechanism centres both. Centring it
 * with an inset and `translate: -50%` instead lands a 1px line on a half pixel, which
 * renders smeared across two columns. Sized only in percentages, it adds nothing to the
 * row's height.
 */
const Rail = styled.div`
  display: grid;
  grid-template-areas: 'indicator';
  place-items: center;

  &::before {
    content: '';
    grid-area: indicator;
    inline-size: 1px;
    block-size: 100%;
    justify-self: center;
    align-self: stretch;
    background-color: ${Colors.outline};
  }

  /* Starts at the first indicator and stops at the last: half a row, anchored towards
     the next one along */
  ${BookingRow}:first-child &::before {
    block-size: 50%;
    align-self: end;
  }
  ${BookingRow}:last-child &::before {
    block-size: 50%;
    align-self: start;
  }
  /* A lone booking has nothing to thread to, so no rail */
  ${BookingRow}:only-child &::before {
    content: none;
  }
`;

const StatusIndicator = styled.div`
  grid-area: indicator;
  /* Masks the rail, which would otherwise show through an outlined indicator */
  position: relative;
  background-color: ${Colors.white};
  padding-block: 3px;
  line-height: 0;
`;

/* Sized in lines of text, so it grows rather than clipping when a row wraps. Its lines
   are centred to sit level with the indicator and range, which are centred too. */
const Card = styled.div`
  min-block-size: 3lh;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

/* Inline text rather than a flex row, so the gap between the ends stays a real space and
   the range copies as "8:00am – 12 Aug". Centred so a wrap stays centred. */
const RangeText = styled.div`
  padding-left: 6px;
  text-align: center;
`;

/* Unbreakable, so the range can only wrap between its two ends */
const RangeEnd = styled.span`
  white-space: nowrap;
`;

/* Holds the gap below the last booking and absorbs the leftover height. Draws nothing:
   a rule here reads as an underline on the last booking, not the foot of the pane. */
const Footer = styled.div`
  margin: 4px 20px 0;
  flex-grow: 1;
  min-height: 20px;
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
 * The list is a snapshot of one day, so an end falling on that day shows its time alone
 * and any other end shows its date — a date at either end is then what says the booking
 * reaches beyond today. Days are compared as displayed, not as stored.
 */
const BookingRangeEnd = ({ date, today, withSeparator = false, ...props }) => {
  const { toFacilityDateTime } = useDateTime();
  const fallsToday = trimToDate(toFacilityDateTime(date)) === today;

  return (
    <RangeEnd {...props}>
      <RangeEndDisplay
        date={date}
        dateFormat={fallsToday ? null : 'dayMonth'}
        timeFormat={fallsToday ? 'default' : null}
      />
      {/* Held against this end so a wrap cannot strand it on the second line */}
      {withSeparator && <>&nbsp;&ndash;</>}
    </RangeEnd>
  );
};

const BookingRowItem = ({ appointment, today }) => {
  const { startTime, endTime, location, patient, status } = appointment;
  const { locationGroup } = location;
  const hasEnd = Boolean(endTime);

  const [headingRef, isHeadingOverflowing] = useOverflow();
  const [bodyRef, isBodyOverflowing] = useOverflow();
  const showTooltip = isHeadingOverflowing || isBodyOverflowing;

  return (
    <BookingRow data-testid="bookingrow-fyu7">
      <Rail data-testid="rail-3nqa">
        <StatusIndicator data-testid="statusindicator-9oqv">
          <AppointmentStatusIndicator
            appointmentStatus={status}
            width={13}
            height={13}
            data-testid="appointmentstatusindicator-1xys"
          />
        </StatusIndicator>
      </Rail>
      <RowContent data-testid="rowcontent-ptdu">
        <RangeText data-testid="rangetext-4k7e">
          <BookingRangeEnd
            date={startTime}
            today={today}
            withSeparator={hasEnd}
            data-testid="rangeend-start-8ptz"
          />
          {hasEnd && (
            <>
              {' '}
              <BookingRangeEnd date={endTime} today={today} data-testid="rangeend-end-4vqx" />
            </>
          )}
        </RangeText>
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
      </RowContent>
    </BookingRow>
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
          <BookingsList data-testid="bookingslist-j8uu">
            {appointments.map((appointment, index) => (
              <BookingRowItem
                key={appointment.id}
                appointment={appointment}
                today={todayFacility}
                data-testid={`bookingrowitem-kl6a-${index}`}
              />
            ))}
          </BookingsList>
          <Footer data-testid="footer-02ym" />
        </>
      )}
    </Container>
  );
};
