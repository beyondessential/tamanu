import React, { useState } from 'react';
import { Button, Container } from '@mui/material';
import { AppointmentDetailPopper } from '../../app/components/Appointments';
import { Chance } from 'chance';

const chance = new Chance();
const patientId = chance.guid();

const partialAppointment = {
  id: chance.guid(),
  startTime: '2024-09-05 13:30:00',
  endTime: '2024-09-05 14:30:00',
  patientId,
  patient: {
    id: patientId,
    displayId: 'RQLN820387',
    firstName: chance.first(),
    middleName: chance.first(),
    lastName: chance.last(),
    culturalName: chance.last(),
    sex: 'Female',
    dateOfBirth: '1990-01-01',
  },
};

export default {
  title: 'Components/AppointmentDetailPopper',
  component: AppointmentDetailPopper,
};

export const Default = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    setOpen(!open);
  };

  return (
    <Container>
      <Button variant="contained" onClick={handleClick}>
        Toggle Appointment Details
      </Button>

      <AppointmentDetailPopper
        open={open}
        setOpen={setOpen}
        anchorEl={anchorEl}
        appointment={partialAppointment}
      />
    </Container>
  );
};
