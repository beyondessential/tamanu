// AppointmentsAccordion.jsx
import React from 'react';
import { Stack } from '@mui/material';
import { AccordionContainer } from './AccordionContainer';
import { DetailCard } from './DetailCard';
import { useOutpatientAppointmentsQuery } from '../../../api/queries';

const appointmentFields = [
  { label: 'Date & time', field: 'date_time' },
  { label: 'Facility', field: 'facility' },
  { label: 'Area', field: 'area' },
  { label: 'Clinician', field: 'clinician' },
  { label: 'Appt type', field: 'appt_type' },
];

export const AppointmentsAccordion = ({
  appointments = [
    {
      date_time: '2024-01-15T10:30:00',
      facility: 'Central Medical Clinic',
      area: 'Dermatology',
      clinician: 'Dr. Sarah Smith',
      appt_type: 'Face Consultation',
    },
  ],
}) => {
  return (
    <AccordionContainer
      title="Upcoming Appointments"
      count={appointments.length}
      defaultExpanded={true}
    >
      <Stack spacing={2}>
        {appointments.map((appointment, index) => (
          <DetailCard
            key={index}
            items={appointmentFields}
            data={appointment}
            elevation={0}
            rootSx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          />
        ))}
      </Stack>
    </AccordionContainer>
  );
};
