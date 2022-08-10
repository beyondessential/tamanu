import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';

import { foreignKey } from '../utils/validation';
import {
  Form,
  Field,
  DateField,
  SelectField,
  AutocompleteField,
  TextField,
  Button,
  FormGrid,
  LocalisedField,
  SuggesterSelectField,
} from '../components';
import { encounterOptions, Colors } from '../constants';
import { useSuggester } from '../api';

const SelectorGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-gap: 0.7rem;
`;

const TypeImage = styled(Avatar)`
  margin-bottom: 10px;
`;

const EncounterOptionTypeButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 9rem;

  span {
    justify-items: center;
  }
`;

const EncounterOptionButton = ({ label, image, onClick }) => (
  <EncounterOptionTypeButton variant="contained" color="default" onClick={onClick}>
    <TypeImage alt={label} src={image} />
    {label}
  </EncounterOptionTypeButton>
);

const StartPage = ({ setValue }) => {
  const items = encounterOptions
    .filter(option => !option.hideFromMenu)
    .map(({ label, value, image }) => (
      <EncounterOptionButton
        key={value}
        label={label}
        value={value}
        image={image}
        onClick={() => setValue('encounterType', value)}
      />
    ));

  return <SelectorGrid>{items}</SelectorGrid>;
};

export const EncounterForm = React.memo(({ editedObject, onSubmit, patientBillingTypeId }) => {
  const locationSuggester = useSuggester('location');
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');

  const renderForm = ({ values, setFieldValue, submitForm }) => {
    if (!values.encounterType) {
      return <StartPage setValue={setFieldValue} />;
    }

    const buttonText = editedObject ? 'Update encounter' : 'Confirm';

    return (
      <FormGrid>
        <Field
          name="encounterType"
          label="Encounter type"
          disabled
          component={SelectField}
          options={encounterOptions}
        />
        <Field
          name="startDate"
          label="Check-in date"
          required
          component={DateField}
          options={encounterOptions}
        />
        <Field
          name="departmentId"
          label="Department"
          required
          component={AutocompleteField}
          suggester={departmentSuggester}
        />
        <Field
          name="locationId"
          label="Location"
          required
          component={AutocompleteField}
          suggester={locationSuggester}
        />
        <LocalisedField
          name="patientBillingTypeId"
          endpoint="patientBillingType"
          component={SuggesterSelectField}
        />
        <Field
          name="examinerId"
          label="Practitioner"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="reasonForEncounter"
          label="Reason for encounter"
          component={TextField}
          multiline
          rows={2}
          style={{ gridColumn: 'span 2' }}
        />
        <div style={{ gridColumn: 2, textAlign: 'right' }}>
          <Button variant="contained" onClick={submitForm} color="primary">
            {buttonText}
          </Button>
        </div>
      </FormGrid>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        startDate: new Date(),
        patientBillingTypeId,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        examinerId: foreignKey('Examiner is required'),
        locationId: foreignKey('Location is required'),
        departmentId: foreignKey('Department is required'),
        startDate: yup.date().required(),
        encounterType: yup
          .mixed()
          .oneOf(encounterOptions.map(x => x.value))
          .required(),
      })}
    />
  );
});

EncounterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
