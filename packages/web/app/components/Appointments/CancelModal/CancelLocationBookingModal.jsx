import React from 'react';
import { toast } from 'react-toastify';

import { APPOINTMENT_STATUSES, OTHER_REFERENCE_TYPES } from '@tamanu/constants';
import { useQueryClient } from '@tanstack/react-query';

import { useLocationBookingMutation } from '../../../api/mutations';
import { formatDateTimeRange } from '../../../utils/dateTime';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedText, BaseModal } from '@tamanu/ui-components';
import {
  AppointmentDetailsColumn,
  AppointmentDetailsColumnLeft,
  AppointmentDetailsContainer,
  BodyContainer,
  BottomModalContainer,
  DetailDisplay,
  StyledConfirmCancelRow,
} from './BaseModalComponents';

const AppointmentDetailsDisplay = ({ appointment }) => {
  const { locationGroup, location, patient, bookingType, clinician, startTime, endTime } =
    appointment;
  return (
    <AppointmentDetailsContainer data-testid="appointmentdetailscontainer-1t7p">
      <AppointmentDetailsColumnLeft data-testid="appointmentdetailscolumnleft-9zxe">
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-testid="translatedtext-x8qp"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.locationGroup?.name || locationGroup?.name}
              value={location?.locationGroup?.id || locationGroup?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION_GROUP}
              data-testid="translatedreferencedata-l059"
            />
          }
          data-testid="detaildisplay-q0n4"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
              data-testid="translatedtext-zb1s"
            />
          }
          value={
            <TranslatedReferenceData
              category={OTHER_REFERENCE_TYPES.LOCATION}
              fallback={location?.name}
              placeholder={<>&mdash;</>}
              value={location?.id}
              data-testid="translatedreferencedata-g9m7"
            />
          }
          data-testid="detaildisplay-5c4m"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-cis2"
            />
          }
          value={formatDateTimeRange(startTime, endTime)}
          data-testid="detaildisplay-nwk8"
        />
      </AppointmentDetailsColumnLeft>
      <AppointmentDetailsColumn data-testid="appointmentdetailscolumn-yrgf">
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.patient.label"
              fallback="Patient"
              data-testid="translatedtext-if09"
            />
          }
          value={<PatientNameDisplay patient={patient} data-testid="patientnamedisplay-oq93" />}
          data-testid="detaildisplay-x32c"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="scheduling.bookingType.label"
              fallback="Booking type"
              data-testid="translatedtext-x43g"
            />
          }
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
              data-testid="translatedreferencedata-ahdk"
            />
          }
          data-testid="detaildisplay-efhb"
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-ydhg"
            />
          }
          value={clinician?.displayName}
          data-testid="detaildisplay-hedi"
        />
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

const BottomModalContent = ({ cancelBooking, onClose }) => (
  <BottomModalContainer data-testid="bottommodalcontainer-5ki3">
    <StyledConfirmCancelRow
      onConfirm={cancelBooking}
      onCancel={onClose}
      cancelText={
        <TranslatedText
          stringId="general.action.goBack"
          fallback="Go back"
          data-testid="translatedtext-boic"
        />
      }
      confirmText={
        <TranslatedText
          stringId="scheduling.action.cancelBooking"
          fallback="Cancel booking"
          data-testid="translatedtext-wf3i"
        />
      }
      data-testid="styledconfirmcancelrow-pcfd"
    />
  </BottomModalContainer>
);

export const CancelLocationBookingModal = ({ appointment, open, onClose }) => {
  const queryClient = useQueryClient();
  const { mutateAsync: updateBooking } = useLocationBookingMutation(
    { isEdit: true, skipConflictCheck: true },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['upcomingAppointments', appointment.patientId]);
        toast.success(
          <TranslatedText
            stringId="scheduling.success.cancelBooking"
            fallback="Booking cancelled successfully"
            data-testid="translatedtext-p5cn"
          />,
        );
        onClose();
      },
      onError: () => {
        toast.error(
          <TranslatedText
            stringId="scheduling.error.cancelBooking"
            fallback="Error cancelling booking"
            data-testid="translatedtext-izml"
          />,
        );
      },
    },
  );

  return (
    <BaseModal
      title={
        <TranslatedText
          stringId="locationBooking.action.cancel"
          fallback="Cancel location booking"
          data-testid="translatedtext-mdxv"
        />
      }
      // Ensures that bottom modal content can place a border across entire modal
      fixedBottomRow
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() =>
            updateBooking({ ...appointment, status: APPOINTMENT_STATUSES.CANCELLED })
          }
          onClose={onClose}
          data-testid="bottommodalcontent-olbd"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="basemodal-nuoc"
    >
      <BodyContainer data-testid="bodycontainer-r768">
        <TranslatedText
          stringId="locationBooking.modal.cancel.text"
          fallback="Are you sure you would like to cancel the below location booking?"
          data-testid="translatedtext-dm2p"
        />
        <AppointmentDetailsDisplay
          appointment={appointment}
          data-testid="appointmentdetailsdisplay-ntqe"
        />
      </BodyContainer>
    </BaseModal>
  );
};
