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

/**
 * One grid for the whole list, with each row a subgrid of it, so the time column is
 * a single track as wide as the widest row needs and every card starts at the same
 * place.
 *
 * The time track is sized from its content rather than given a floor: the times and
 * dates are locale-formatted, so their width belongs to the reader, and a floor wide
 * enough for the longest of them would stop the track ever shrinking.
 *
 * What makes the range wrap is the floor on the *card* track, not anything on the time
 * track. The card's contents carry `min-width: 0` so their headings can ellipsise,
 * which also lets the card shrink to nothing; without a floor the grid starves the card
 * long before it squeezes the time track, so the range never wraps and the card is
 * crushed to "War… / Sara…" instead. The floor is what states the priority the design
 * asks for: a bed and a name are worth more room than keeping a range on one line. It
 * is in `ch` for the same reason the rest of this is content-sized — it tracks the
 * reader's font, not a pixel guess.
 */
const BookingsList = styled.div`
  display: grid;
  grid-template-columns: auto minmax(min-content, max-content) minmax(17ch, 1fr);
  column-gap: 5px;
  padding-right: 20px;
  padding-left: 12px;
  /* Kept from the MUI Timeline root this replaced, whose 6px 16px padding had only its
     top, left and right overridden. The -16px below is tuned against it. */
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
 * The status indicator, and the rail threading the indicators together.
 *
 * The rail shares the indicator's grid cell and is centred by the same mechanism, so
 * it lands exactly on the indicator's centre rather than near it. Centring it instead
 * with a percentage inset and a -50% translate puts a 1px line on a half pixel, which
 * renders smeared across two columns: visibly off, and blurry with it.
 *
 * It is also sized only as a percentage of a cell it shares, and has no content, so it
 * contributes nothing to the row's intrinsic height and cannot leave the row taller
 * than it draws. An earlier rail built from laid-out flex segments could, and did:
 * the overhang became scrollable overflow, which showed as a scrollbar on a list that
 * plainly fit.
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

  /* The rail threads the indicators and goes no further, so it starts at the first and
     stops at the last: half a row, anchored to the side the next indicator is on. */
  ${BookingRow}:first-child &::before {
    block-size: 50%;
    align-self: end;
  }
  ${BookingRow}:last-child &::before {
    block-size: 50%;
    align-self: start;
  }
  /* Which is why a lone booking shows no rail: with nothing to thread it to, the line
     reads as an artefact rather than as a list. Implied by the two rules above, and
     stated outright so it cannot be lost. */
  ${BookingRow}:only-child &::before {
    content: none;
  }
`;

const StatusIndicator = styled.div`
  grid-area: indicator;
  /* Sits over the rail rather than letting it show through an outlined indicator,
     which is transparent in the middle. The pane is white, so this reads as nothing. */
  position: relative;
  background-color: ${Colors.white};
  padding-block: 3px;
  line-height: 0;
`;

/* Sized in lines of text, so it grows rather than clipping when a row wraps. Its two
   lines are centred within that height rather than sitting at the top: the row's status
   indicator and range are both centred, and text pinned to the top of a card taller
   than it reads as sitting above them. */
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

/**
 * The range sits on one line, and is centred so that where the pane is too narrow to
 * hold it the two ends stack centred against each other rather than left-ragged.
 *
 * It stays ordinary inline text rather than becoming a flex row: the space between
 * the ends is then a real space, so the range reads and copies as "8:00am – 12 Aug"
 * rather than losing the separator's spacing to a CSS gap.
 */
const RangeText = styled.div`
  padding-left: 6px;
  text-align: center;
`;

/* Each end is unbreakable, so the track is as wide as the wider of the two and the
   range can only ever wrap between them */
const RangeEnd = styled.span`
  white-space: nowrap;
`;

/* Holds the gap below the last booking and takes up whatever height is left, so a
   short list sits at the top of the pane rather than stretching down it. It draws
   nothing: a rule here reads as an underline beneath the last booking rather than as
   the foot of the pane, which already has its own border. */
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
 * One end of a booking's range, as this list states it.
 *
 * The list is a snapshot of a single day, so it says only what the reader does not
 * already know: they know the day they are looking at, so an end falling on it is
 * given as a time alone, and any other end as the date it falls on. A date at either
 * end is then itself what tells them the booking reaches beyond today, and every day
 * a booking covers states its span without ambiguity.
 *
 * Which of the two an end gets is all this adds: the end itself is rendered by the
 * shared {@link RangeEndDisplay}, which owns how a date and a time sit together in a
 * right-to-left locale.
 *
 * Days are compared as they are displayed, not as they are stored: a booking can sit
 * within one day in the primary timezone and straddle midnight in the facility's.
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
      {/* Held against this end rather than standing between the two, so a range that
          wraps cannot leave the separator stranded at the head of the second line */}
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
