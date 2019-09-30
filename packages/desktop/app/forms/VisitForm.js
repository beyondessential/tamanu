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
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';

import { visitOptions, Colors } from '../constants';

const SelectorGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-gap: 0.7rem;
`;

const TypeImage = styled(Avatar)`
  margin-bottom: 10px;
`;

const VisitOptionTypeButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 9rem;
`;

const VisitOptionButton = ({ label, image, onClick }) => (
  <VisitOptionTypeButton variant="contained" onClick={onClick}>
    <TypeImage alt={label} src={image} />
    {label}
  </VisitOptionTypeButton>
);

const StartPage = ({ setValue }) => {
  const items = visitOptions.map(({ label, value, image }) => (
    <VisitOptionButton
      key={value}
      label={label}
      value={value}
      image={image}
      onClick={() => setValue('visitType', value)}
    />
  ));

  return <SelectorGrid>{items}</SelectorGrid>;
};

export class VisitForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ values, setFieldValue, submitForm }) => {
    if (!values.visitType) {
      return <StartPage setValue={setFieldValue} />;
    }

    const { locationSuggester, practitionerSuggester, editedObject } = this.props;
    const buttonText = editedObject ? 'Update visit' : 'Start visit';
    return (
      <FormGrid>
        <Field
          name="visitType"
          label="Visit type"
          disabled
          component={SelectField}
          options={visitOptions}
        />
        <Field
          name="startDate"
          label="Check-in"
          required
          component={DateField}
          options={visitOptions}
        />
        <Field
          name="location._id"
          label="Location"
          required
          component={AutocompleteField}
          suggester={locationSuggester}
        />
        <Field
          name="examiner._id"
          label="Practitioner"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="reasonForVisit"
          label="Reason for visit"
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

  render() {
    const { onSubmit, editedObject } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          startDate: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          examiner: foreignKey('Examiner is required'),
          location: foreignKey('Location is required'),
          startDate: yup.date().required(),
          visitType: yup
            .mixed()
            .oneOf(visitOptions.map(x => x.value))
            .required(),
        })}
      />
    );
  }
}
