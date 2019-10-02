import React from 'react';

import { storiesOf } from '@storybook/react';

import { PatientStatisticsCard } from '../app/components/PatientStatisticsCard';

storiesOf('Cards', module).add('PatientStatisticsCard', () => (
  <PatientStatisticsCard
    numberOfPatients={28}
    percentageIncrease={15}
    averageWaitTime={68}
    priorityLevel={1}
  />
));
