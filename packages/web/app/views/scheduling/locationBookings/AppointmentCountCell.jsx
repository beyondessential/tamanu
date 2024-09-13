import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components';
import { CalendarRowHeader } from './TableComponents';

const StyledHead = styled(CalendarRowHeader)`
  color: ${Colors.midText};
  font-weight: 400;
  text-align: end;
`;

const Value = styled.span`
  color: ${Colors.darkestText};
  display: contents;
  font-weight: 500;
`;

export const AppointmentCountCell = ({ count }) => {
  const unit =
    count === 1 ? (
      <TranslatedText stringId="scheduling.appointment.abbr" fallback="appt" />
    ) : (
      <TranslatedText stringId="scheduling.appointments.abbr" fallback="appts" />
    );

  return (
    <StyledHead>
      <Value>{count}</Value>&nbsp;{unit}
    </StyledHead>
  );
};
