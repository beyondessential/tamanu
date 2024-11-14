import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

import { FlexCol } from './SharedComponents';
import { APPOINTMENT_STATUS_VALUES, APPOINTMENT_STATUSES } from '@tamanu/constants';
import { AppointmentStatusChip } from '../AppointmentStatusChip';
import { ConditionalTooltip } from '../../Tooltip';
import { TextButton } from '../../Button';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../Translation';

const AppointmentStatusContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block: 0.5rem 0.75rem;
  gap: 0.5rem;
  align-items: center;
`;

const AppointmentStatusGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-row-gap: 0.5rem;
  grid-column-gap: 0.3125rem;
  justify-items: center;
`;

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  .MuiTooltip-tooltip {
    padding-inline: 1rem;
    max-width: 7.5rem;
  }
`;

const CheckInButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 0.6875rem;
  text-decoration: underline;
  text-transform: none;
`;

export const AppointmentStatusSelector = ({
  selectedStatus,
  updateAppointmentStatus,
  onOpenEncounterModal,
  createdEncounter,
  disabled,
}) => {
  return (
    <AppointmentStatusContainer>
      <AppointmentStatusGrid>
        {APPOINTMENT_STATUS_VALUES.filter(status => status !== APPOINTMENT_STATUSES.CANCELLED).map(
          status => {
            const isSelected = status === selectedStatus;
            return (
              <AppointmentStatusChip
                key={status}
                appointmentStatus={status}
                onClick={() => updateAppointmentStatus(status)}
                disabled={disabled || isSelected}
                role="radio"
                selected={isSelected}
              />
            );
          },
        )}
      </AppointmentStatusGrid>
      <StyledConditionalTooltip
        title={
          <TranslatedText
            stringId="scheduling.tooltip.alreadyAdmitted"
            fallback="Patient already admitted"
          />
        }
        visible={!!createdEncounter}
      >
        <CheckInButton onClick={() => onOpenEncounterModal()} disabled={!!createdEncounter}>
          <TranslatedText
            stringId="scheduling.action.admitOrCheckIn"
            fallback="Admit or check-in"
          />
        </CheckInButton>
      </StyledConditionalTooltip>
    </AppointmentStatusContainer>
  );
};
