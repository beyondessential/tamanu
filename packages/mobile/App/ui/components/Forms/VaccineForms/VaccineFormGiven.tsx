import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { getOrientation, SCREEN_ORIENTATION } from '/helpers/screen';
import { DateField } from '../../DateField/DateField';
import { TextField } from '../../TextField/TextField';
import { Checkbox } from '../../Checkbox';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { Field } from '../FormField';
import { INJECTION_SITE_OPTIONS } from '~/types';
import { Dropdown } from '../../Dropdown';
import { FormSectionHeading } from '../FormSectionHeading';

const InjectionSiteDropdown = ({ onChange, label }): JSX.Element => {
  return (
    <Dropdown
      options={INJECTION_SITE_OPTIONS.map(o => ({ label: o, value: o }))}
      onChange={onChange}
      label={label}
    />
  );
};

export function VaccineFormGiven(): JSX.Element {
  return getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView>
      <FormSectionHeading text="Consent" />
      <Field
        component={Checkbox}
        name="consent"
        text="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
      />
      <FormSectionHeading text="Date" />
      <Field component={DateField} name="date" label="Date" />
      <FormSectionHeading text="Batch" />
      <Field component={TextField} name="batch" label="Batch No." />
      <FormSectionHeading text="Injection site" marginBottom={0} />
      <Field component={InjectionSiteDropdown} name="injectionSite" label="Select" />
      <FormSectionHeading text="Examiner" />
      <CurrentUserField name="examiner" label="Examiner" />
    </StyledView>
  ) : (
    <StyledView paddingTop={10}>
      <FormSectionHeading text="Consent" />
      <Field
        component={Checkbox}
        name="consent"
        text="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
      />
      <FormSectionHeading text="Date" />
      <Field component={DateField} name="date" label="Date" />
      <RowView marginTop={10} justifyContent="space-between">
        <StyledView width="49%">
          <FormSectionHeading text="Batch" />
          <Field component={TextField} name="batch" label="Batch No." />
        </StyledView>
        <StyledView width="49%">
          <FormSectionHeading text="Injection site" marginBottom={-5} />
          <Field component={InjectionSiteDropdown} name="injectionSite" label="Injection site" />
        </StyledView>
      </RowView>
      <StyledView width="100%">
        <FormSectionHeading text="Examiner" />
        <CurrentUserField name="examiner" label="Examiner" />
      </StyledView>
    </StyledView>
  );
}
