import React from 'react';

import { storiesOf } from '@storybook/react';

import { StatisticsCard, StatisticsCardContainer } from '../app/components/StatisticsCard';
import { Card, CardBody, CardHeader, CardDivider, CardItem } from '../app/components';

storiesOf('Cards', module).add('StatisticsCard', () => (
  <StatisticsCardContainer>
    <StatisticsCard title="Emergency" value={28} color="#e67e22" />
    <StatisticsCard title="Urgent" value={28} color="#2980b9" />
    <StatisticsCard title="Non Urgent" value={28} color="#27ae60" />
  </StatisticsCardContainer>
));

storiesOf('Cards', module).add('EncounterInfoCard', () => (
  <div style={{ maxWidth: 750 }}>
    <Card>
      <CardHeader>
        <CardItem
          label="Planned move"
          value="Colonial War Memorial Divisional Hospital General Clinic, Hospital General Clinic"
        />
      </CardHeader>
      <CardBody>
        <CardDivider />
        <CardItem label="Department" value="Cardiology" />
        <CardItem label="Patient type" value="Private" />
        <CardItem
          label="Location"
          value="Bua Nursing Station General Clinic, Bua Nursing Station General Clinic"
        />
        <CardItem label="Encounter type" value="Hospital Admission" />
        <CardItem
          style={{ gridColumn: '1/-1' }}
          label="Reason for encounter"
          value="Admitted from Emergency Department - signs of renal failure"
        />
      </CardBody>
    </Card>
  </div>
));
