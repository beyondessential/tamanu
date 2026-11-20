import React from 'react';

import { useDateTime } from '@tamanu/ui-components';

import { TranslatedText } from '../../components';
import { SummaryList } from './kioskStyles';

export const AppointmentSummary = ({ appointment, style }) => {
  const { formatTime } = useDateTime();
  return (
    <SummaryList style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', ...style }}>
      <div>
        <dt>
          <TranslatedText stringId="kiosk.ready.appointment" fallback="Appointment" />
        </dt>
        <dd>
          <TranslatedText
            stringId="kiosk.ready.appointmentTime"
            fallback="Today, :time"
            replacements={{ time: formatTime(appointment.startTime) }}
          />
        </dd>
      </div>
      {appointment.clinician && (
        <div>
          <dt>
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />
          </dt>
          <dd>{appointment.clinician.displayName}</dd>
        </div>
      )}
    </SummaryList>
  );
};
