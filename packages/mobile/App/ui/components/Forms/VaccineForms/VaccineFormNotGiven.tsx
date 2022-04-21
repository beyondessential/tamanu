import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { getOrientation, SCREEN_ORIENTATION } from '/helpers/screen';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { FormSectionHeading } from '../FormSectionHeading';

export function VaccineFormNotGiven(): JSX.Element {
  return getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView>
      <FormSectionHeading text="Information" />
      <Field component={DateField} name="date" label="Date" />
      <Field component={TextField} name="reason" label="Reason" />
      <CurrentUserField name="examiner" label="Examiner" />
    </StyledView>
  ) : (
    <StyledView paddingTop={10}>
      <FormSectionHeading text="Information" />
      <RowView marginTop={10}>
        <Field component={DateField} name="date" label="Date" />
      </RowView>
      <RowView marginTop={10} justifyContent="space-between">
        <StyledView width="49%">
          <Field component={TextField} name="reason" label="Reason" />
        </StyledView>
        <StyledView width="49%">
          <CurrentUserField name="examiner" label="Examiner" />
        </StyledView>
      </RowView>
    </StyledView>
  );
}
