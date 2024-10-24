import React, { useState } from 'react';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { DateSelector } from '../DateSelector';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { GroupByToggle } from './GroupAppointmentToggle';

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

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr;
  max-block-size: 100%;
`;

const CalendarWrapper = styled.div`
  margin: 0.5rem;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})``;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const NewBookingButton = styled(Button)`
  margin-left: 1rem;
`;

const APPOINTMENT_GROUP_BY = {
  AREA: 'area',
  CLINICIANs: 'clinicians',
};

export const OutpatientAppointmentsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [groupBy, setGroupBy] = useState(APPOINTMENT_GROUP_BY.AREA);

  const handleChangeDate = event => {
    setSelectedDate(event.target.value);
  };
  return (
    <Wrapper>
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
        </CalendarWrapper>
      </PageContainer>
    </Wrapper>
  );
};
