import React from 'react';
import { Card, CardBody, CardHeader, CardItem, CardDivider } from '../../app/components';
import { LabRequestCard } from '../../app/views/patients/components/LabRequestCard';

export default {
  title: 'Card',
  component: Card,
};

export const LabRequest = args => <LabRequestCard {...args} />;
LabRequest.args = {
  labRequest: { disabled: 'xyz', requestedDate: '2022/12/01' },
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
