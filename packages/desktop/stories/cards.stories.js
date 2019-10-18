import React from 'react';

import { storiesOf } from '@storybook/react';

import { DumbTriageStatisticsCard } from '../app/components/TriageStatisticsCard';

storiesOf('Cards', module).add('TriageStatisticsCard', () => (
  <DumbTriageStatisticsCard
    numberOfPatients={28}
    percentageIncrease={15}
    averageWaitTime={68}
    priorityLevel={1}
  />
));
