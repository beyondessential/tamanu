import React from 'react';

import { Button, PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { AppointmentsContextProvider } from './AppointmentsContext';
import { DailySchedule } from './DailySchedule';
import { FilterPane } from './FilterPane';

export const AllAppointmentsView = () => {
  return (
    <AppointmentsContextProvider>
      <PageContainer>
        <TwoColumnDisplay>
          <FilterPane />
          <div>
            <TopBar>
              <Button color="primary" variant="outlined">
                New Appointment
              </Button>
            </TopBar>
            <DailySchedule />
          </div>
        </TwoColumnDisplay>
      </PageContainer>
    </AppointmentsContextProvider>
  );
};
