import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

import { useAppointmentMutation } from '../../../api/mutations';
import { usePatientAdditionalDataQuery, usePatientCurrentEncounter } from '../../../api/queries';
import { Colors } from '../../../constants';
import { TextButton } from '../../Button';
import { EncounterModal } from '../../EncounterModal';
import { ConditionalTooltip } from '../../Tooltip';
import { TranslatedText } from '../../Translation';

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  // Prevent tooltip’s div wreaking havoc on children’s layout in parent flex/grid
  display: inherit;
  flex-direction: inherit;
  gap: inherit;

  .MuiTooltip-tooltip {
    max-inline-size: 7.5rem;
    padding-inline: 1rem;
  }
`;

const StyledButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 0.6875rem;
  padding-block: 0.125rem;
  text-decoration-thickness: from-font;
  text-decoration: underline;
  text-transform: none;
`;

export const CheckInButton = ({ appointment }) => {
  const { data: encounter } = usePatientCurrentEncounter(appointment?.patient?.id);
  const { data: additionalData } = usePatientAdditionalDataQuery(appointment.patient.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const { mutate: mutateAppointment, isLoading: isUpdatingAppointment } = useAppointmentMutation(
    {
      appointmentId: appointment?.id,
      isEdit: true,
    },
    {
      onSuccess: () => {
        closeModal();
        toast.success(
          <TranslatedText
            stringId="scheduling.action.createEncounter.success"
            fallback="Encounter successfully started"
          />,
        );
      },
      onError: () =>
        toast.error(
          <TranslatedText
            stringId="scheduling.action.createEncounter.error"
            fallback="Couldn’t start encounter"
          />,
        ),
    },
  );

  const updateEncounter = newEncounter => mutateAppointment({ encounterId: newEncounter?.id });

  return (
    <>
      <StyledConditionalTooltip
        title={
          <TranslatedText
            stringId="scheduling.tooltip.alreadyAdmitted"
            fallback="Patient already admitted"
          />
        }
        visible={!!encounter}
      >
        <StyledButton onClick={openModal} disabled={!!encounter || isUpdatingAppointment}>
          <TranslatedText
            stringId="scheduling.action.admitOrCheckIn"
            fallback="Admit or check in"
          />
        </StyledButton>
      </StyledConditionalTooltip>
      <EncounterModal
        initialValues={{
          locationId: appointment?.location?.id,
          examinerId: appointment?.clinician?.id,
          practitionerId: appointment?.clinician?.id,
        }}
        open={isModalOpen}
        onClose={closeModal}
        onSubmitEncounter={updateEncounter}
        noRedirectOnSubmit
        patient={appointment?.patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
    </>
  );
};
