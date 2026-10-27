import React from 'react';
import { TranslatedText } from '@tamanu/ui-components';
import { useCurrentUser } from '@routes/PrivateRoute';
import { PageColumn, PageTitle } from '@components/layout';
import { ToDoSection } from '../features/dashboard/ToDoSection';
import { AppointmentsSection } from '../features/dashboard/AppointmentsSection';
import { HealthRecordSection } from '../features/dashboard/HealthRecordSection';
import { YourDetailsSection } from '../features/details/DetailsRecord';

export const DashboardView = () => {
  const { firstName } = useCurrentUser();

  return (
    <PageColumn>
      <PageTitle>
        <TranslatedText
          stringId="patientPortal.dashboard.greeting"
          fallback="Hi :firstName"
          replacements={{ firstName }}
        />
      </PageTitle>
      <ToDoSection />
      <AppointmentsSection />
      <YourDetailsSection />
      <HealthRecordSection />
    </PageColumn>
  );
};
