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
import { DateDisplay } from '../components/DateDisplay';
import { Button } from '../components/Button';

import { encounterOptions, Colors } from '../constants';

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
  <EncounterOptionTypeButton  variant="contained" onClick={onClick}>
    <TypeImage alt={label} src={image} />
    {label}
  </EncounterOptionTypeButton>
);

const getReferralLabel = referral => {
  const { date, referringDoctor, location } = referral;
  const parts = [
    `${DateDisplay.rawFormat(date)}:`,
    location && location.name,
    referringDoctor && referringDoctor.displayName && `(by ${referringDoctor.displayName})`,
  ];
  return parts.filter(x => x).join(' ');
};

const ReferralField = ({ referrals = [] }) => {
  const referralOptions = [{ value: null, label: 'No linked referral' }].concat(
    referrals
      .filter(r => !r.closedDate)
      .map(r => ({
        value: r.id,
        label: getReferralLabel(r),
      })),
  );

  return (
    <Field
      name="referralId"
      label="Referral"
      disabled={referrals.length === 0}
      component={SelectField}
      options={referralOptions}
    />
  );
};

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

export class EncounterForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ values, setFieldValue, submitForm }) => {
    if (!values.encounterType) {
      return <StartPage setValue={setFieldValue} />;
    }

    const {
      locationSuggester,
      practitionerSuggester,
      departmentSuggester,
      editedObject,
      referrals,
    } = this.props;
    const buttonText = editedObject ? 'Update encounter' : 'Start encounter';

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
          label="Check-in"
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
        <Field
          name="examinerId"
          label="Practitioner"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <ReferralField referrals={referrals} />
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
  }
}
