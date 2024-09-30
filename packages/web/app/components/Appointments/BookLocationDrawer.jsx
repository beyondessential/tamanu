import React, { useEffect, useState } from 'react';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  LocationField,
  TranslatedSelectField,
} from '../Field';
import styled, { css, keyframes } from 'styled-components';
import { BodyText, Heading4 } from '../Typography';
import { BookingTimeField } from './BookingTimeField';
import { usePatientSuggester, useSuggester } from '../../api';
import { FormSubmitCancelRow } from '../ButtonRow';
import { Colors } from '../../constants';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import { FormGrid } from '../FormGrid';
import { APPOINTMENT_TYPE_LABELS } from '@tamanu/constants';
import { ClearIcon } from '../Icons/ClearIcon';
import { ConfirmModal } from '../ConfirmModal';

const slideIn = keyframes`
  from {
    transform: translateX(100%); // Start off-screen to the right
  }
  to {
    transform: translateX(0); // End at its final position
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0); // Start at its final position
  }
  to {
    transform: translateX(100%); // End off-screen to the right
  }
`;

const Container = styled.div`
  width: 330px;
  padding: 16px;
  background-color: ${Colors.background};
  border: 1px solid ${Colors.outline};
  height: 100%;
  position: absolute;
  right: 0;
  overflow-y: auto;
  animation: ${({ $open }) =>
    $open
      ? css`
          ${slideIn} 0.3s ease-out
        `
      : css`
          ${slideOut} 0.3s ease-out forwards
        `};
`;

const Heading = styled(Heading4)`
  font-size: 16px;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 11px;
  color: ${Colors.midText};
`;

const OvernightStayField = styled.div`
  display: flex;
  align-items: center;
`;

const OvernightIcon = styled(Brightness2Icon)`
  position: absolute;
  left: 145px;
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`;

export const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title="Cancel new booking"
      subText="Are you sure you would like to cancel the new booking?"
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText="Back to editing"
      onCancel={() => {
        handleClose(false);
      }}
    />
  );
};

export const BookLocationDrawer = ({ open, closeDrawer }) => {
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  return (
    <Container columns={1} $open={open}>
      <Heading>Book location</Heading>
      <Description>
        Create a new booking by completing the below details and selecting ‘Confirm’.
      </Description>
      <Form
        onSubmit={async () => console.log('submitting')}
        validateOnChange
        render={({ values, resetForm, setFieldValue, dirty }) => {
          const warnAndResetForm = async () => {
            const confirmed = !dirty || (await handleShowWarningModal());
            if (!confirmed) return;
            closeDrawer();
            resetForm();
          };

          return (
            <FormGrid columns={1}>
              <CloseDrawerIcon onClick={warnAndResetForm} />
              <Field
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                component={LocationField}
                value={values.locationId}
                required
                onChange={() => {
                  setFieldValue('overnight', null);
                  setFieldValue('date', null);
                }}
              />
              <OvernightStayField>
                <Field
                  name="overnight"
                  label="Overnight stay"
                  component={CheckField}
                  disabled={!values.locationId}
                />
                <OvernightIcon fontSize="small" />
              </OvernightStayField>
              <Field
                name="date"
                label="Date"
                component={DateField}
                disabled={!values.locationId}
                required
              />
              <BookingTimeField disabled={!values.date} />
              <Field
                name="patientId"
                label="Patient"
                component={AutocompleteField}
                suggester={patientSuggester}
                required
              />
              <Field
                name="bookingType"
                label="Booking type"
                component={TranslatedSelectField}
                enumValues={APPOINTMENT_TYPE_LABELS}
                required
              />
              <Field
                name="clinicianId"
                label="Clinician"
                component={AutocompleteField}
                suggester={clinicianSuggester}
              />
              <FormSubmitCancelRow
                onCancel={warnAndResetForm}
                confirmDisabled={!values.startTime}
              />
            </FormGrid>
          );
        }}
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </Container>
  );
};
