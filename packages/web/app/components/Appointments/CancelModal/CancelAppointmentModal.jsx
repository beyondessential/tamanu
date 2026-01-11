import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { isSameDay, parseISO } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  MODIFY_REPEATING_APPOINTMENT_MODE,
  OTHER_REFERENCE_TYPES,
} from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedText, BaseModal, useDateTimeFormat, DateDisplay } from '@tamanu/ui-components';
import {
  AppointmentDetailsColumn,
  AppointmentDetailsColumnLeft,
  AppointmentDetailsContainer,
  BodyContainer,
  BottomModalContainer,
  DetailDisplay,
  StyledConfirmCancelRow,
  OptionsContainer,
} from './BaseModalComponents';
import { BodyText } from '../../Typography';
import { RepeatCharacteristicsDescription } from '../OutpatientsBookingForm/RepeatCharacteristicsDescription';
import { ModifyModeRadioGroup } from '../ModifyModeRadioGroup';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 20px;
`;

const AppointmentDetailsDisplay = ({ appointment }) => {
  const { formatShortest } = useDateTimeFormat();
  const doesSpanMultipleDays = !isSameDay(parseISO(startTime), parseISO(endTime));
  const {
    patient,
    startTime,
    endTime,
    locationGroup,
    clinician,
    appointmentType,
    schedule = {},
  } = appointment;

  return (
    <AppointmentDetailsContainer data-testid="appointmentdetailscontainer-ov9t">
      <AppointmentDetailsColumnLeft data-testid="appointmentdetailscolumnleft-b9u5">
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.patient.label"
              fallback="Patient"
              data-testid="translatedtext-efjg"
            />
          }
          value={<PatientNameDisplay patient={patient} data-testid="patientnamedisplay-f15o" />}
          data-testid="detaildisplay-5dy2"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-oej8"
            />
          }
          value={<><DateDisplay date={startTime} format="shortest" /> - <DateDisplay date={endTime} showDate={doesSpanMultipleDays} format="shortest" /></>}
          data-testid="detaildisplay-l5s4"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-testid="translatedtext-shn4"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={locationGroup?.name}
              value={locationGroup?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION_GROUP}
              data-testid="translatedreferencedata-xbcx"
            />
          }
          data-testid="detaildisplay-zhsu"
        />
        {schedule.id && (
          <DetailDisplay
            label={
              <TranslatedText
                stringId="appointment.repeating.label"
                fallback="Repeating"
                data-testid="translatedtext-0e4t"
              />
            }
            value={
              <RepeatCharacteristicsDescription
                startTimeDate={parseISO(startTime)}
                frequency={schedule.frequency}
                interval={schedule.interval}
                data-testid="repeatcharacteristicsdescription-5emo"
              />
            }
            data-testid="detaildisplay-p356"
          />
        )}
      </AppointmentDetailsColumnLeft>
      <AppointmentDetailsColumn data-testid="appointmentdetailscolumn-8be5">
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.patientId.label"
              fallback="Patient ID"
              data-testid="translatedtext-f4qv"
            />
          }
          value={patient?.displayId}
          data-testid="detaildisplay-znan"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-3yof"
            />
          }
          value={clinician?.displayName}
          data-testid="detaildisplay-x54g"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label.short"
              fallback="Appt type"
              data-testid="translatedtext-b7ci"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType?.id}
              fallback={appointmentType?.name}
              category="appointmentType"
              data-testid="translatedreferencedata-ypda"
            />
          }
          data-testid="detaildisplay-qvtp"
        />
        {schedule.id && (
          <DetailDisplay
            label={
              <TranslatedText
                stringId="appointment.duration.label"
                fallback="Duration"
                data-testid="translatedtext-ryuq"
              />
            }
            value={
              schedule.untilDate ? (
                <TranslatedText
                  stringId="appointment.duration.endsOnDate"
                  fallback="Ends on :date"
                  replacements={{ date: formatShortest(schedule.untilDate) }}
                  data-testid="translatedtext-2xq6"
                />
              ) : (
                <TranslatedText
                  stringId="appointment.duration.endsAfterOccurrences"
                  fallback="Ends after :numberOfOccurrences occurrences"
                  replacements={{ numberOfOccurrences: schedule.occurrenceCount }}
                  data-testid="translatedtext-iwrg"
                />
              )
            }
            data-testid="detaildisplay-idwp"
          />
        )}
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

const RepeatingAppointmentOptions = ({ deletionType, setDeletionType }) => {
  return (
    <OptionsContainer data-testid="optionscontainer-e79a">
      <StyledBodyText data-testid="styledbodytext-lv64">
        <TranslatedText
          stringId="appointment.cancelRepeating.message"
          fallback="This is a repeating appointment. Would you like to cancel this appointment only or this
        appointment and all future appointments as well?"
          data-testid="translatedtext-xkr3"
        />
      </StyledBodyText>
      <ModifyModeRadioGroup
        onChange={event => setDeletionType(event.target.value)}
        value={deletionType}
        data-testid="modifymoderadiogroup-ky32"
      />
    </OptionsContainer>
  );
};

const BottomModalContent = ({ cancelBooking, onClose }) => (
  <BottomModalContainer data-testid="bottommodalcontainer-zxtt">
    <StyledConfirmCancelRow
      confirmText={
        <TranslatedText
          stringId="general.action.confirm"
          fallback="Confirm"
          data-testid="translatedtext-u8jk"
        />
      }
      cancelText={
        <TranslatedText
          stringId="general.action.goBack"
          fallback="Go back"
          data-testid="translatedtext-xkzl"
        />
      }
      onConfirm={cancelBooking}
      onCancel={onClose}
      data-testid="styledconfirmcancelrow-ns43"
    />
  </BottomModalContainer>
);

export const CancelAppointmentModal = ({ open, onClose, appointment }) => {
  const queryClient = useQueryClient();

  const [deletionType, setDeletionType] = useState(
    MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT,
  );

  const handleCloseModal = () => {
    setDeletionType(MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT);
    onClose();
  };

  const { mutateAsync: mutateAppointment } = useAppointmentMutation(appointment.id, {
    onSuccess: () => {
      if (deletionType === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelAppointment"
            fallback="Appointment cancelled successfully"
            data-testid="translatedtext-ddbn"
          />,
        );
      }
      if (deletionType === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelRepeatingAppointment"
            fallback="This and future appointments cancelled successfully"
            data-testid="translatedtext-9vv4"
          />,
        );
      }
      queryClient.invalidateQueries('appointments');
      handleCloseModal();
    },
    onError: () => {
      toast.error(
        <TranslatedText
          stringId="appointment.error.cancelAppointment"
          fallback="Error cancelling appointment"
          data-testid="translatedtext-08lk"
        />,
      );
    },
  });

  return (
    <BaseModal
      title={
        <TranslatedText
          stringId="appointment.action.cancel"
          fallback="Cancel appointment"
          data-testid="translatedtext-vo8q"
        />
      }
      // Ensures that bottom modal content can place a border across entire modal
      fixedBottomRow
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() => {
            mutateAppointment({
              ...appointment,
              status: APPOINTMENT_STATUSES.CANCELLED,
              modifyMode: deletionType,
            });
          }}
          onClose={handleCloseModal}
          data-testid="bottommodalcontent-464p"
        />
      }
      open={open}
      onClose={handleCloseModal}
      width="md"
      data-testid="basemodal-gt1i"
    >
      <BodyContainer data-testid="bodycontainer-mgm8">
        <TranslatedText
          stringId="appointment.modal.cancel.text"
          fallback="Are you sure you would like to cancel the below appointment?"
          data-testid="translatedtext-qp2g"
        />
        <AppointmentDetailsDisplay
          appointment={appointment}
          data-testid="appointmentdetailsdisplay-x32n"
        />
        {appointment.schedule && (
          <RepeatingAppointmentOptions
            deletionType={deletionType}
            setDeletionType={setDeletionType}
            data-testid="repeatingappointmentoptions-s84q"
          />
        )}
      </BodyContainer>
    </BaseModal>
  );
};
