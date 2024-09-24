import React from 'react';
import { AutocompleteField, DateField, Field, SelectField } from '../Field';
import styled from 'styled-components';
import { BodyText, Heading3 } from '../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useFormikContext } from 'formik';

const Container = styled.div`
  width: 329px;
`;

export const BookLocationDrawer = () => {
  const { values } = useFormikContext();
  return (
    <Container>
      <Heading3>Book location</Heading3>
      <BodyText>
        Create a new booking by completing the below details and selecting ‘Confirm’.
      </BodyText>
      <Field name="locationGroupId" label="Area" component={AutocompleteField} />
      <Field name="locationId" label="Location" component={AutocompleteField} />
      <Field name="date" label="Date" component={DateField} />
      <BookingTimeField disabled={!values.date} />
      <Field name="patient" label="Patient" component={AutocompleteField} />
      <Field name="bookingType" label="Booking type" component={SelectField} />
    </Container>
  );
};
