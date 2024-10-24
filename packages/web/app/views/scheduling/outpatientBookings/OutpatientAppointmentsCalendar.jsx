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

const Container = styled(PageContainer)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CalendarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 1rem;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})`
  flex-grow: 0;
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
  CLINICIAN: 'clinician',
};

export const OutpatientAppointmentsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [groupBy, setGroupBy] = useState(APPOINTMENT_GROUP_BY.AREA);

  const handleChangeDate = event => {
    setSelectedDate(event.target.value);
  };

  const { data: locationGroupData } = useLocationGroupsQuery();
  const { data: userData } = useUsersQuery();

  const { data: appointmentData } = useAppointmentsQuery({
    after: selectedDate,
    before: endOfDay(selectedDate),
    clinicianId: '',
    locationGroupId: '',
  });

  const groupByConfig = useMemo(
    () => ({
      [APPOINTMENT_GROUP_BY.AREA]: {
        data: locationGroupData,
        key: 'locationGroupId',
        getTitle: ({ name }) => name,
      },
      [APPOINTMENT_GROUP_BY.CLINICIAN]: {
        data: userData?.data,
        key: 'clinicianId',
        getTitle: ({ displayName }) => displayName,
      },
    }),
    [locationGroupData, userData?.data],
  );

  const groupedAppointmentData = useMemo(() => {
    const { key } = groupByConfig[groupBy];
    return lodashGroupBy(appointmentData?.data, key);
  }, [appointmentData, groupBy, groupByConfig]);

  return (
    <Container>
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
        <BookingsCalendar
          getTitle={groupByConfig[groupBy].getTitle}
          headerData={groupByConfig[groupBy].data || []}
          cellData={groupedAppointmentData}
        />
      </CalendarWrapper>
    </Container>
  );
};
