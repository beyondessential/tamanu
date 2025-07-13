import React from 'react';
import { Card, CardContent } from '@mui/material';
import { type Appointment } from '@tamanu/shared/schemas/responses/appointment.schema';

import { LabelValueList } from '../../LabelValueList';
import {
  formatAppointmentDateTime,
  formatAppointmentClinician,
  formatAppointmentFacility,
  formatAppointmentArea,
  formatAppointmentType,
} from '../../../utils/format';

interface AppointmentCardProps {
  appointment: Appointment;
}

export const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  return (
    <Card variant="secondary">
      <CardContent>
        <LabelValueList>
          <LabelValueList.ListItem
            label="Date & time"
            value={formatAppointmentDateTime(appointment.startTime)}
          />
          <LabelValueList.ListItem
            label="Facility"
            value={formatAppointmentFacility(appointment.location, appointment.locationGroup)}
          />
          <LabelValueList.ListItem
            label="Area"
            value={formatAppointmentArea(appointment.location, appointment.locationGroup)}
          />
          <LabelValueList.ListItem
            label="Clinician"
            value={formatAppointmentClinician(appointment.clinician)}
          />
          <LabelValueList.ListItem
            label="Appt type"
            value={formatAppointmentType(appointment.appointmentType)}
          />
        </LabelValueList>
      </CardContent>
    </Card>
  );
};
