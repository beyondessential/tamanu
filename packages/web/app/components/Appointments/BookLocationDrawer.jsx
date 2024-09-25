import React from 'react';
import { AutocompleteField, DateField, Field, SelectField } from '../Field';
import styled from 'styled-components';
import { BodyText, Heading3 } from '../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useFormikContext } from 'formik';
import { Button } from '../Button';
import { usePatientSuggester, useSuggester } from '../../api';

const Container = styled.div`
  width: 329px;
`;

export const BookLocationDrawer = () => {
  const { values, onSubmit } = useFormikContext();
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const patientSuggester = usePatientSuggester();

  return (
    <Container>
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
      <Button>Cancel</Button>
      <Button onClick={onSubmit}>Confirm</Button>
    </Container>
  );
};
