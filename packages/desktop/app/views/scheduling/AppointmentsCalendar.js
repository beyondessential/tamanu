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

const DateDisplay = styled.span`
  margin-left: 1rem;
  font-size: 1.2em;
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
            <div>
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
              <Button
                variant="contained"
                onClick={() => {
                  setDate(new Date());
                }}
              >
                Today
              </Button>
              <DateDisplay>{format(date, 'EEEE dd MMMM yyyy')}</DateDisplay>
            </div>
            <NewAppointmentButton />
          </TopBar>
          <DailySchedule date={date} />
        </div>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
