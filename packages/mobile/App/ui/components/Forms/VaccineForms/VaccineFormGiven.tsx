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
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { Field } from '../FormField';
import { INJECTION_SITE_OPTIONS } from '~/types';
import { Dropdown } from '../../Dropdown';


const InjectionSiteDropdown = ({onChange, label}): JSX.Element => {
  return <Dropdown 
    options={INJECTION_SITE_OPTIONS.map(o => ({ label: o, value: o }))}
    onChange={onChange}
    label={label}
  />
};

export const VaccineFormGiven = (): JSX.Element => (
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(21.87, Orientation.Height)}
    >
      <Field component={DateField} name="date" label="Date" />
      <Field component={TextField} name="batch" label="Batch No." />
      <Field component={InjectionSiteDropdown} name="injectionSite" label="Injection site" />
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
    </StyledView>
  ));
