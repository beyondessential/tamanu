import React from 'react';
import { AutocompleteField, DateField, Field, SelectField } from '../Field';
import styled, { css, keyframes } from 'styled-components';
import { BodyText, Heading3 } from '../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useFormikContext } from 'formik';
import { usePatientSuggester, useSuggester } from '../../api';
import { FormSubmitCancelRow } from '../ButtonRow';
import { Colors } from '../../constants';

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
  width: 329px;
  padding: 16px;
  background-color: ${Colors.background};
  border: 1px solid ${Colors.outline};
  height: 100%;
  position: absolute;
  right: 0;
  animation: ${({ $open }) =>
    $open
      ? css`
          ${slideIn} 0.3s ease-out
        `
      : css`
          ${slideOut} 0.3s ease-out forwards
        `};
`;

export const BookLocationDrawer = ({ open, onCancel }) => {
  const { values, onSubmit } = useFormikContext();
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const patientSuggester = usePatientSuggester();

  return (
    <Container $open={open}>
      <Heading3>Book location</Heading3>
      <BodyText>
        Create a new booking by completing the below details and selecting ‘Confirm’.
      </BodyText>
      <Field
        name="locationGroupId"
        label="Area"
        component={AutocompleteField}
        suggester={locationGroupSuggester}
      />
      <Field name="locationId" label="Location" component={AutocompleteField} />
      <Field name="date" label="Date" component={DateField} />
      {/* TODO: field shouldnt error if no date */}
      <BookingTimeField disabled={!values.date} />
      <Field
        name="patient"
        label="Patient"
        component={AutocompleteField}
        suggester={patientSuggester}
      />
      <Field name="bookingType" label="Booking type" component={SelectField} />
      <FormSubmitCancelRow onCancel={onCancel} onConfirm={onSubmit} />
    </Container>
  );
};
