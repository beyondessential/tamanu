import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card, CardBody, CardHeader, CardDivider, CardItem } from '../app/components';
import { TriageDashboard } from '../app/components/TriageDashboard';
import { ApiContext } from '../app/api';

const dummyApi = {
  get: () => {
    return {
      data: [
        {
          score: '2',
          encounterType: 'triage',
          triageTime: '2022-06-30T22:22:34.875Z',
        },
        {
          score: '2',
          encounterType: 'triage',
          triageTime: '2022-06-30T22:22:34.875Z',
        },
      ],
      count: 2,
    };
  },
};

storiesOf('Cards', module).add('TriageDashboard', () => (
  <ApiContext.Provider value={dummyApi}>
    <div style={{ margin: '1rem' }}>
      <TriageDashboard />
    </div>
  </ApiContext.Provider>
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
