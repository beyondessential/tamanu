import React from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { Card, CardBody, CardHeader, CardItem, OutlinedButton } from '../../app/components';
import { Colors } from '../../app/constants';
import { labsIcon } from '../../app/constants/images';

export default {
  title: 'Card',
  component: Card,
};

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;
`;

const Divider = styled.div`
  border-left: 1px solid ${Colors.softOutline};
  height: 40px;
`;

const LabIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

export const LabsCard = args => (
  <div style={{ minWidth: 750 }}>
    <Container {...args}>
      <LabIcon src={labsIcon} />
      <Box pr={3} pl={3}>
        <CardItem label="Lab test ID" value="HGU59KRC" />
        <CardItem label="Request date" value="01/01/2023" />
      </Box>
      <Divider />
      <Box pl={3} pr={3}>
        <CardItem label="Requesting clinician" value="Jane Smith" />
        <CardItem label="Department" value="Cardiology" />
      </Box>
      <Box>
        <OutlinedButton>Print request</OutlinedButton>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Container>
  </div>
);

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
