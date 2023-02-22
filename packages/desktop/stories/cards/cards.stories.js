import React from 'react';
import { Box } from '@material-ui/core';
import { OutlinedButton, MenuButton } from '../../app/components';
import { LabRequestCard } from '../../app/views/patients/components/LabRequestCard';
import { EncounterInfoPane } from '../../app/views/patients/panes/EncounterInfoPane';

export default {
  title: 'Card',
  component: LabRequestCard,
};

export const LabRequest = args => <LabRequestCard {...args} />;
LabRequest.args = {
  labRequest: {
    displayId: 'HGU59KRC',
    requestedDate: '2022/12/01',
    requestedBy: { displayName: 'Alan Chan' },
  },
  Actions: (
    <Box display="flex" alignItems="center">
      <OutlinedButton>Print request</OutlinedButton>
      <MenuButton
        status="Pending Approval"
        actions={{
          'Action 1': () => {
            console.log('action 1');
          },
        }}
      />
    </Box>
  ),
};

export const EncounterInfoCard = args => <EncounterInfoPane {...args} />;
EncounterInfoCard.args = {
  patientBillingType: 'Private',
  getLocalisation: key => {
    const config = {
      'fields.referralSourceId.shortLabel': 'Referral',
    };
    return config[key];
  },
  encounter: {
    reasonForEncounter: 'Heart attack',
    encounterType: 'admission',
    department: { name: 'Cardiology' },
    location: { name: 'Clinical treatment room' },
    referralSource: { name: 'Alan Chan' },
  },
};
