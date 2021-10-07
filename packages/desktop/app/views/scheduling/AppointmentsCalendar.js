import React, { useState } from 'react';
import styled from 'styled-components';
import { format, add } from 'date-fns';

import { PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { FilterPane } from '../../components/Appointments/FilterPane';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { BackButton, ForwardButton, Button } from '../../components/Button';
import { Colors } from '../../constants';

const Container = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const DateHeader = styled.div`
  display: flex;
  align-items: center;
`;

const DateDisplay = styled.span`
  margin-left: 1rem;
  font-size: 1.2em;
`;

const DateNav = styled.div`
  width: 3.5rem;
`;

const CalendarContainer = styled.div`
  margin-left: calc(25px + 3.5rem);
  margin-right: 25px;
`;

export const AppointmentsCalendar = () => {
  const [date, setDate] = useState(new Date());
  return (
    <PageContainer>
      <TwoColumnDisplay>
        <Container>
          <TopBar title="Calendar" />
          <FilterPane />
        </Container>
        <div>
          <TopBar>
            <DateHeader>
              <DateNav>
                <BackButton
                  text={false}
                  onClick={() => {
                    setDate(add(date, { days: -1 }));
                  }}
                />
                <ForwardButton
                  onClick={() => {
                    setDate(add(date, { days: 1 }));
                  }}
                />
              </DateNav>
              <Button
                variant="contained"
                onClick={() => {
                  setDate(new Date());
                }}
              >
                Today
              </Button>
              <DateDisplay>{format(date, 'EEEE dd MMMM yyyy')}</DateDisplay>
            </DateHeader>
            <NewAppointmentButton
              onSuccess={() => {
                // set date to trigger a refresh
                setDate(new Date());
              }}
            />
          </TopBar>
          <CalendarContainer>
            <DailySchedule date={date} />
          </CalendarContainer>
        </div>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
