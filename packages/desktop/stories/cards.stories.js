import React from 'react';

import { storiesOf } from '@storybook/react';

import { PatientStatisticsCard } from '../app/components/PatientStatisticsCard';

storiesOf('Cards', module).add('PatientStatisticsCard', () => (
  <PatientStatisticsCard
    title="Level 1 Patient"
    numberOfPatients={28}
    percentageIncrease={15}
    averageWaitTime="1hr 8mins"
    themeColor="#F76853"
  />
));
