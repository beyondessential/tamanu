import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import { debounce } from 'lodash';
import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation, TranslatedText } from '@tamanu/ui-components';
import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_VALUES } from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { AppointmentStatusChip } from '../AppointmentStatusChip';
import { getEnumStringId } from '../../Translation/TranslatedEnum';

const NONCANCELLED_APPOINTMENT_STATUSES = APPOINTMENT_STATUS_VALUES.filter(
  status => status !== APPOINTMENT_STATUSES.CANCELLED,
);

const ChipGroup = styled(ToggleButtonGroup)`
  align-items: center;
  display: grid;
  font-size: 0.6875rem;
  gap: 0.5rem 0.3125rem;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
`;

const PlaceholderStatusSelector = () => (
  <ChipGroup exclusive role="radiogroup" data-testid="chipgroup-2hf3">
    {NONCANCELLED_APPOINTMENT_STATUSES.map(status => (
      <AppointmentStatusChip
        appointmentStatus={status}
        disabled
        key={status}
        selected={false}
        data-testid={`appointmentstatuschip-2imj-${status}`}
      />
    ))}
  </ChipGroup>
);

export const AppointmentStatusSelector = ({ appointment, disabled = false, ...props }) => {
  const { getTranslation } = useTranslation();
  const { mutateAsync: updateAppointment } = useAppointmentMutation(appointment.id, {
    onSuccess: () =>
      toast.success(
        <TranslatedText
          stringId="scheduling.action.changeStatus.success"
          fallback="Appointment status updated"
          data-testid="translatedtext-v67n"
        />,
      ),
    onError: () =>
      toast.error(
        <TranslatedText
          stringId="scheduling.action.changeStatus.error"
          fallback="Couldn’t update appointment status"
          data-testid="translatedtext-fqje"
        />,
      ),
  });

  if (!appointment.status)
    return <PlaceholderStatusSelector data-testid="placeholderstatusselector-j033" />;

  const updateAppointmentStatus = debounce(
    async newStatus => await updateAppointment({ status: newStatus }),
    200,
  );

  const handleChange = (_event, newStatus) => updateAppointmentStatus(newStatus);

  return (
    <ChipGroup
      aria-label="Appointment status"
      exclusive
      onChange={handleChange}
      role="radiogroup"
      value={appointment.status}
      {...props}
      data-testid="chipgroup-ldt5"
    >
      {NONCANCELLED_APPOINTMENT_STATUSES.map(status => {
        const isSelected = status === appointment.status;
        const stringId = getEnumStringId(status, APPOINTMENT_STATUSES);
        return (
          <AppointmentStatusChip
            appointmentStatus={getTranslation(stringId, status)}
            disabled={disabled || isSelected}
            key={status}
            selected={isSelected}
            value={status}
            data-testid={`appointmentstatuschip-05sr-${status}`}
          />
        );
      })}
    </ChipGroup>
  );
};
