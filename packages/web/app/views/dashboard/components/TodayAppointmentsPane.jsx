import React from 'react';
import styled from 'styled-components';
import { WS_EVENTS } from '@tamanu/constants';
import { useHistory } from 'react-router-dom';
import { endOfDay, startOfDay } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { Box, Link } from '@material-ui/core';

import { Heading4, TranslatedText } from '../../../components';
import { Colors } from '../../../constants';
import { useAutoUpdatingQuery } from '../../../api/queries/useAutoUpdatingQuery';
import { useAuth } from '../../../contexts/Auth';
import { APPOINTMENT_GROUP_BY } from '../../scheduling/outpatientBookings/OutpatientAppointmentsView';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';

const Container = styled.div`
  ${({ showTasks }) => showTasks && 'flex-grow: 1; width: 100%;'}
  min-width: 366px;
  min-height: 51%;
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

const StyledContentContainer = styled(Box)`
  padding: 0 20px 20px;
  margin: 0;
  flex;
  overflow-y: auto;
`;

const StyledProgressBarContainer = styled.div`
  padding: 10px;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  background-color: ${Colors.offWhite};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 10px;
  margin-top: 3px;
  background-color: rgba(25, 147, 78, 0.1);
  position: relative;
  &::after {
    content: '';
    display: block;
    width: ${({ percentage }) => `${percentage}%`};
    height: 100%;
    border-radius: 10px;
    background-color: ${Colors.green};
  }
`;

const AppointmentListContainer = styled.div`
  padding-top: 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledAppointmentTile = styled(AppointmentTile)`
  cursor: default;
  font-size: 14px;
  padding: 7px 10px !important;
  time {
    font-weight: 500;
  }
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

export const TodayAppointmentsPane = ({ showTasks }) => {
  const history = useHistory();
  const { currentUser, facilityId } = useAuth();
  const appointments =
    useAutoUpdatingQuery(
      'appointments',
      {
        locationGroupId: '',
        after: toDateTimeString(startOfDay(new Date())),
        before: toDateTimeString(endOfDay(new Date())),
        clinicianId: currentUser?.id,
        all: true,
        facilityId,
      },
      `${WS_EVENTS.CLINICIAN_APPOINTMENTS_UPDATE}:${currentUser?.id}`,
    ).data?.data ?? [];

  const totalSeenAppointments = appointments.filter(appointment => appointment.status === 'Seen')
    .length;

  const onViewAll = () => {
    history.push(`/appointments/outpatients?groupBy=${APPOINTMENT_GROUP_BY.CLINICIAN}`);
  };

  return (
    <Container showTasks={showTasks}>
      <TitleContainer>
        <Heading4 margin={0}>
          <TranslatedText
            stringId="dashboard.appointments.todayAppointments.title"
            fallback="Today's appointments"
            data-test-id='translatedtext-fru8' />
        </Heading4>
        {!!appointments.length && (
          <ActionLink onClick={onViewAll}>
            <TranslatedText
              stringId="dashboard.appointments.todayAppointments.viewAll"
              fallback="View all..."
              data-test-id='translatedtext-p9m8' />
          </ActionLink>
        )}
      </TitleContainer>
      {!appointments.length ? (
        <NoDataContainer>
          <Box maxWidth={285}>
            <TranslatedText
              stringId="dashboard.appointments.todayAppointments.noAppointments"
              fallback="You have no appointments scheduled for today. To view other appointments, visit"
              data-test-id='translatedtext-r5i7' />
            <Link
              href={`#/appointments/outpatients`}
              style={{ textDecoration: 'underline', display: 'block' }}
            >
              <TranslatedText
                stringId="dashboard.appointments.todayAppointments.outpatientAppointments"
                fallback="Outpatient appointments"
                data-test-id='translatedtext-dmb9' />
            </Link>
          </Box>
        </NoDataContainer>
      ) : (
        <>
          <StyledContentContainer>
            <StyledProgressBarContainer>
              <Box display={'flex'} justifyContent={'space-between'} fontSize={'14px'}>
                <TranslatedText
                  stringId="dashboard.appointments.todayAppointments.seen"
                  fallback="Seen"
                  data-test-id='translatedtext-61gi' />
                <span>{`${totalSeenAppointments} / ${appointments.length}`}</span>
              </Box>
              <ProgressBar
                percentage={Math.floor((totalSeenAppointments / (appointments.length || 1)) * 100)}
              />
            </StyledProgressBarContainer>
            <AppointmentListContainer>
              {appointments.map(appointment => (
                <StyledAppointmentTile
                  key={appointment.id}
                  appointment={appointment}
                  allowViewDetail={false}
                />
              ))}
            </AppointmentListContainer>
          </StyledContentContainer>
        </>
      )}
    </Container>
  );
};
