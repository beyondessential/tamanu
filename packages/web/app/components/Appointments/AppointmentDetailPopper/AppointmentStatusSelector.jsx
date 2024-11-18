import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_VALUES } from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { usePatientCurrentEncounter } from '../../../api/queries';
import { Colors } from '../../../constants';
import { TextButton } from '../../Button';
import { EncounterModal } from '../../EncounterModal';
import { ConditionalTooltip } from '../../Tooltip';
import { TranslatedText } from '../../Translation';
import { AppointmentStatusChip } from '../AppointmentStatusChip';
import { FlexCol } from './SharedComponents';

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
  appointment,
  additionalData,
  selectedStatus,
  updateAppointmentStatus,
  disabled,
}) => {
  const {
    data: initialEncounter,
    isLoading: isPatientEncounterLoading,
  } = usePatientCurrentEncounter(appointment?.patient?.id);

  const { mutateAsync: updateAppointment } = useAppointmentMutation({ isEdit: true });

  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [encounter, setEncounter] = useState(null);

  const updateEncounter = useCallback(
    e => {
      setEncounter(e);
      updateAppointment({ id: appointment?.id, encounterId: e?.id });
      setIsEncounterModalOpen(false);
      toast.success(
        <TranslatedText
          stringId="scheduling.success.encounterCreated"
          fallback="Encounter successfully started"
        />,
      );
    },
    [appointment, updateAppointment],
  );

  useEffect(() => {
    setEncounter(initialEncounter);
  }, [initialEncounter]);

  if (isPatientEncounterLoading) {
    return null;
  }

  return (
    <>
      <AppointmentStatusContainer>
        <AppointmentStatusGrid>
          {APPOINTMENT_STATUS_VALUES.filter(
            status => status !== APPOINTMENT_STATUSES.CANCELLED,
          ).map(status => {
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
          })}
        </AppointmentStatusGrid>
        <StyledConditionalTooltip
          title={
            <TranslatedText
              stringId="scheduling.tooltip.alreadyAdmitted"
              fallback="Patient already admitted"
            />
          }
          visible={!!encounter}
        >
          <CheckInButton onClick={() => setIsEncounterModalOpen(true)} disabled={!!encounter}>
            <TranslatedText
              stringId="scheduling.action.admitOrCheckIn"
              fallback="Admit or check-in"
            />
          </CheckInButton>
        </StyledConditionalTooltip>
      </AppointmentStatusContainer>

      <EncounterModal
        initialValues={{
          locationId: appointment?.location?.id,
          examinerId: appointment?.clinician?.id,
          practitionerId: appointment?.clinician?.id,
        }}
        open={isEncounterModalOpen}
        onClose={() => setIsEncounterModalOpen(false)}
        onSubmitEncounter={updateEncounter}
        noRedirectOnSubmit
        patient={appointment.patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
    </>
  );
};
