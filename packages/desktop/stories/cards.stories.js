import React from 'react';

import { storiesOf } from '@storybook/react';

import { DumbTriageStatisticsCard } from '../app/components/TriageStatisticsCard';
import { Card, CardBody, CardHeader, CardDivider, CardItem } from '../app/components';

storiesOf('Cards', module).add('TriageStatisticsCard', () => (
  <DumbTriageStatisticsCard
    numberOfPatients={28}
    percentageIncrease={15}
    averageWaitTime={68}
    priorityLevel={1}
  />
));

storiesOf('Cards', module).add('EncounterInfoCard', () => (
  <Card>
    <CardHeader>
      <CardItem label="Planned move" value="ED Bed 2" />
    </CardHeader>
    <CardBody>
      <CardDivider />
      <CardItem label="Department" value="Cardiology" />
      <CardItem label="Patient type" value="Private" />
      <CardItem label="Location" value="ED Bed 1" />
      <CardItem label="Encounter type" value="Hospital Admission" />
      <CardItem
        style={{ gridColumn: '1/-1' }}
        label="Reason for encounter"
        value="Admitted from Emergency Department - signs of renal failure"
      />
    </CardBody>
  </Card>
));
