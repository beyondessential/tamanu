import React, { useMemo, useState } from 'react';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { DateSelector } from '../DateSelector';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { GroupByToggle } from './GroupAppointmentToggle';
import { useAppointmentsQuery } from '../../../api/queries';
import { useLocationGroupsQuery } from '../../../api/queries/useLocationGroupsQuery';
import { useUsersQuery } from '../../../api/queries/useUsersQuery';
import { BookingsCalendar } from './BookingCalender';
import { endOfDay, startOfDay } from 'date-fns';
import { groupBy as lodashGroupBy } from 'lodash';

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  max-block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

const CalendarWrapper = styled.div`
  margin: 0.5rem;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})`
  & .MuiTypography-root {
    flex: 0;
  }
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const NewBookingButton = styled(Button)`
  margin-left: 1rem;
`;

const APPOINTMENT_GROUP_BY = {
  AREA: 'area',
  CLINICIANS: 'clinicians',
};

export const OutpatientAppointmentsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [groupBy, setGroupBy] = useState(APPOINTMENT_GROUP_BY.CLINICIANS);

  const handleChangeDate = event => {
    setSelectedDate(event.target.value);
  };

  const locationGroupsQuery = useLocationGroupsQuery();
  const usersQuery = useUsersQuery();

  const query = useMemo(
    () =>
      ({
        [APPOINTMENT_GROUP_BY.AREA]: locationGroupsQuery,
        [APPOINTMENT_GROUP_BY.CLINICIANS]: usersQuery,
      }[groupBy]),
    [groupBy, locationGroupsQuery, usersQuery],
  );

  const { data: appointmentData } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    clinicianId: '',
  });

  const apptData = appointmentData?.data || [];

  const partitionedAppointmentData = useMemo(() => lodashGroupBy(apptData, 'clinicianId'), [
    apptData,
  ]);

  console.log(partitionedAppointmentData);
  return (
    <PageContainer>
      <LocationBookingsTopBar>
        <GroupByToggle value={groupBy} onChange={setGroupBy} />
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
        <NewBookingButton onClick={null}>+ New booking</NewBookingButton>
      </LocationBookingsTopBar>
      <CalendarWrapper>
        <DateSelector value={selectedDate} onChange={handleChangeDate} />
        <BookingsCalendar query={query} cellData={partitionedAppointmentData} />
      </CalendarWrapper>
    </PageContainer>
  );
};
