import React from 'react';
import { Card, CardContent } from '@mui/material';
import { type Appointment } from '@tamanu/shared/schemas/patientPortal';

import { LabelValueList } from '../../../components/LabelValueList';
import {
  formatAppointmentDateTime,
  formatAppointmentClinician,
  formatAppointmentFacility,
  formatAppointmentArea,
  formatAppointmentType,
} from '@utils/format';

interface AppointmentCardProps {
  appointment: Appointment;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  return (
    <Card>
      <CardContent>
        <LabelValueList>
          <LabelValueList.ListItem
            label="Date & Time"
            value={formatAppointmentDateTime(appointment.startTime)}
          />
          <LabelValueList.ListItem
            label="Clinician"
            value={formatAppointmentClinician(appointment.clinician)}
          />
          <LabelValueList.ListItem
            label="Facility"
            value={formatAppointmentFacility(appointment.locationGroup)}
          />
          <LabelValueList.ListItem
            label="Area"
            value={formatAppointmentArea(null, appointment.locationGroup)}
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
