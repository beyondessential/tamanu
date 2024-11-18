import { styled } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { APPOINTMENT_STATUS_VALUES, APPOINTMENT_STATUSES } from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { usePatientCurrentEncounter } from '../../../api/queries';
import { Colors } from '../../../constants';
import { TextButton } from '../../Button';
import { EncounterModal } from '../../EncounterModal';
import { ConditionalTooltip } from '../../Tooltip';
import { TranslatedText } from '../../Translation';
import { AppointmentStatusChip } from '../AppointmentStatusChip';
import { FlexCol } from './SharedComponents';

const NONCANCELLED_APPOINTMENT_STATUSES = APPOINTMENT_STATUS_VALUES.filter(
  status => status !== APPOINTMENT_STATUSES.CANCELLED,
);

const AppointmentStatusContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block: 0.5rem 0.75rem;
  gap: 0.5rem;
  align-items: center;
`;

const ChipGroup = styled('div')`
  display: grid;
  gap: 0.5rem 0.3125rem;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
`;

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  .MuiTooltip-tooltip {
    max-inline-size: 7.5rem;
    padding-inline: 1rem;
  }
`;

const CheckInButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 0.6875rem;
  text-decoration-thickness: from-font;
  text-decoration: underline;
  text-transform: none;
`;

const PlaceholderStatusSelector = () => (
  <ChipGroup role="radiogroup">
    {NONCANCELLED_APPOINTMENT_STATUSES.map(status => (
      <AppointmentStatusChip appointmentStatus={status} disabled key={status} selected={false} />
    ))}
  </ChipGroup>
);

export const AppointmentStatusSelector = ({
  appointment,
  additionalData,
  selectedStatus,
  updateAppointmentStatus,
  disabled,
}) => {
  const { data: encounter, isLoading: encounterIsLoading } = usePatientCurrentEncounter(
    appointment?.patient?.id,
  );

  const { mutateAsync: updateAppointment } = useAppointmentMutation({ isEdit: true });

  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const openEncounterModal = setIsEncounterModalOpen(true);
  const closeEncounterModal = setIsEncounterModalOpen(false);

  const updateEncounter = useCallback(
    newEncounter => {
      updateAppointment({
        id: appointment?.id,
        encounterId: newEncounter?.id,
      });
      closeEncounterModal();
      toast.success(
        <TranslatedText
          stringId="scheduling.success.encounterCreated"
          fallback="Encounter successfully started"
        />,
      );
    },
    [appointment?.id, closeEncounterModal, updateAppointment],
  );

  if (encounterIsLoading) return <PlaceholderStatusSelector />;

  return (
    <>
      <AppointmentStatusContainer>
        <ChipGroup role="radiogroup">
          {NONCANCELLED_APPOINTMENT_STATUSES.map(status => {
            const isSelected = status === selectedStatus;
            return (
              <AppointmentStatusChip
                key={status}
                appointmentStatus={status}
                onClick={() => updateAppointmentStatus(status)}
                disabled={disabled || isSelected}
                selected={isSelected}
              />
            );
          })}
        </ChipGroup>
        <StyledConditionalTooltip
          title={
            <TranslatedText
              stringId="scheduling.tooltip.alreadyAdmitted"
              fallback="Patient already admitted"
            />
          }
          visible={!!encounter}
        >
          <CheckInButton onClick={openEncounterModal} disabled={!!encounter}>
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
        onClose={closeEncounterModal}
        onSubmitEncounter={updateEncounter}
        noRedirectOnSubmit
        patient={appointment.patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
    </>
  );
};
