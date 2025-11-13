import React from 'react';
import { Box } from '@material-ui/core';
import { OutlinedButton } from '@tamanu/ui-components';
import { MenuButton } from '../../app/components';
import { LabRequestCard } from '../../app/views/patients/components/LabRequestCard';

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
        actions={[{ label: 'Action 1', action: () => console.log('Action 1') }]}
      />
    </Box>
  ),
};
