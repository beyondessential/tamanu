import React from 'react';
import styled from 'styled-components';

import { PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { FilterPane } from '../../components/Appointments/FilterPane';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { Colors } from '../../constants';

const Container = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

export const AppointmentsCalendar = () => {
  return (
    <PageContainer>
      <TwoColumnDisplay>
        <Container>
          <TopBar title="Calendar" />
          <FilterPane />
        </Container>
        <div>
          <TopBar>
            <NewAppointmentButton />
          </TopBar>
          <DailySchedule />
        </div>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
