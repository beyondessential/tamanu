import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

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

import { visitOptions } from '../constants';

const SelectorGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-auto-rows: 4rem;
  grid-gap: 0.7rem;
`;

const VisitOptionButton = ({ label, onClick }) => (
  <Button variant="contained" onClick={onClick}>
    {label}
  </Button>
);

const getReferralLabel = referral => {
  const { date, referringDoctor, location } = referral;
  const parts = [
    DateDisplay.rawFormat(referral.date) + ':',
    location && location.name,
    referringDoctor && referringDoctor.displayName && `(by ${referringDoctor.displayName})`
  ];
  return parts.filter(x => x).join(' ');
};

const ReferralField = ({ referrals = [] }) => {
  const referralOptions = [{ value: null, label: "No linked referral" }].concat(
    referrals
      .filter(r => !r.closedDate)
      .map(r => ({
        value: r._id,
        label: getReferralLabel(r),
      }))
  );

  return (
    <Field
      name="referral._id"
      label="Referral"
      disabled={referrals.length === 0}
      component={SelectField}
      options={referralOptions}
      style={{ gridColumn: 'span 2' }}
    />
  );
}

const StartPage = ({ setValue }) => {
  const items = visitOptions.map(({ label, value }) => (
    <VisitOptionButton
      key={value}
      label={label}
      value={value}
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

    const { locationSuggester, practitionerSuggester, editedObject, referrals } = this.props;
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
        <ReferralField referrals={referrals} />
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
