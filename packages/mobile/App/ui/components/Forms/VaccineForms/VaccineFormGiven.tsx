import React from 'react';
import { StyledView, RowView } from '/styled/common';
import {
  Orientation,
  screenPercentageToDP,
  getOrientation,
  SCREEN_ORIENTATION,
} from '/helpers/screen';
import { DateField } from '../../DateField/DateField';
import { TextField } from '../../TextField/TextField';
import { Checkbox } from '../../Checkbox';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { Field } from '../FormField';
import { INJECTION_SITE_OPTIONS } from '~/types';
import { Dropdown } from '../../Dropdown';
import { SectionHeader } from '/components/SectionHeader';

const InjectionSiteDropdown = ({ onChange, label }): JSX.Element => {
  return (
    <Dropdown
      options={INJECTION_SITE_OPTIONS.map(o => ({ label: o, value: o }))}
      onChange={onChange}
      label={label}
    />
  );
};

const SectionHeading = ({ text, ...props }) => (
  <StyledView marginBottom={5} marginTop={10} {...props}>
    <SectionHeader h3 style={{ textTransform: 'uppercase' }}>
      {text}
    </SectionHeader>
  </StyledView>
);

export const VaccineFormGiven = (): JSX.Element =>
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(21.87, Orientation.Height)}
    >
      <SectionHeading text="Information" />
      <Field
        component={Checkbox}
        name="consent"
        text="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
      />
      <SectionHeading text="Date" />
      <Field component={DateField} name="date" label="Date" />
      <SectionHeading text="Batch" />
      <Field component={TextField} name="batch" label="Batch No." />
      <SectionHeading text="Injection site" marginBottom={0} />
      <Field component={InjectionSiteDropdown} name="injectionSite" label="Select" />
      <SectionHeading text="Examiner" />
      <CurrentUserField name="examiner" label="Examiner" />
    </StyledView>
  ) : (
    <StyledView>
      <RowView marginTop={10}>
        <Field component={DateField} name="date" label="Date" />
      </RowView>
      <RowView marginTop={10} justifyContent="space-between">
        <StyledView width="49%">
          <Field component={TextField} name="batch" label="Batch No." />
        </StyledView>
        <StyledView width="49%">
          <Field component={InjectionSiteDropdown} name="injectionSite" label="Injection site" />
        </StyledView>
      </RowView>
      <StyledView width="100%">
        <CurrentUserField name="examiner" label="Examiner" />
      </StyledView>
      <StyledView width="100%">
        <CurrentUserField name="examiner" label="Examiner" />
      </StyledView>
      <StyledView width="100%">
        <CurrentUserField name="examiner" label="Examiner" />
      </StyledView>
      <StyledView width="100%">
        <CurrentUserField name="examiner" label="Examiner" />
      </StyledView>
    </StyledView>
  );
