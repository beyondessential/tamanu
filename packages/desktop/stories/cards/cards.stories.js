import React from 'react';
import { Card, CardBody, CardHeader, CardItem, CardDivider, LabsCard } from '../../app/components';

export default {
  title: 'Card',
  component: Card,
};

export const EncounterInfoCard = args => (
  <div style={{ maxWidth: 750 }}>
    <Card {...args}>
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
);
