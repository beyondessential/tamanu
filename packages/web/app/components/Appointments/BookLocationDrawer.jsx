import React, { useEffect } from 'react';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocationField,
  SelectField,
  TranslatedSelectField,
} from '../Field';
import styled, { css, keyframes } from 'styled-components';
import { BodyText, Heading4 } from '../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useFormikContext } from 'formik';
import { usePatientSuggester, useSuggester } from '../../api';
import { FormSubmitCancelRow } from '../ButtonRow';
import { Colors } from '../../constants';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import { FormGrid } from '../FormGrid';
import { APPOINTMENT_TYPE_LABELS } from '@tamanu/constants';

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

const StyledField = styled(Field)``;

export const BookLocationDrawer = ({ open, onCancel }) => {
  // TODO: this should probably be the form and submit to the endpoint and close on submit
  const { values, onSubmit, resetForm, setFieldValue } = useFormikContext();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');

  // TODO: make this better
  useEffect(() => {
    if (!values.locationId) setFieldValue('date', null);
  }, [values.locationId, setFieldValue]);

  return (
    <Container columns={1} $open={open}>
      <Heading>Book location</Heading>
      <Description>
        Create a new booking by completing the below details and selecting ‘Confirm’.
      </Description>
      <FormGrid columns={1}>
        <Field
          locationGroupLabel="Area"
          label="Location"
          name="locationId"
          component={LocationField}
          value={values.locationId}
        />
        <div>
          <StyledField
            name="overnight"
            label={'Overnight stay'}
            component={CheckField}
            disabled={!values.locationId}
          />
          <Brightness2Icon fontSize="small" />
        </div>
        <StyledField name="date" label="Date" component={DateField} disabled={!values.locationId} />
        <BookingTimeField disabled={!values.date} />
        <StyledField
          name="patientId"
          label="Patient"
          component={AutocompleteField}
          suggester={patientSuggester}
        />
        <StyledField
          name="bookingType"
          label="Booking type"
          component={TranslatedSelectField}
          enumValues={APPOINTMENT_TYPE_LABELS}
        />
        <StyledField
          name="clinicianId"
          label="Clinician"
          component={AutocompleteField}
          suggester={clinicianSuggester}
        />
        <FormSubmitCancelRow
          onCancel={() => {
            onCancel();
            resetForm();
          }}
          onConfirm={onSubmit}
          confirmDisabled={!values.startTime}
        />
      </FormGrid>
    </Container>
  );
};
