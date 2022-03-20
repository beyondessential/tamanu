import React from 'react';
import { View } from 'react-native';
import { StyledView, RowView } from '/styled/common';
import { getOrientation, SCREEN_ORIENTATION } from '/helpers/screen';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { SectionHeader } from '/components/SectionHeader';

const SectionHeading = ({ text, ...props }) => (
  <StyledView marginBottom={5} marginTop={10} {...props}>
    <SectionHeader h3 style={{ textTransform: 'uppercase' }}>
      {text}
    </SectionHeader>
  </StyledView>
);

export const VaccineFormNotGiven = (): JSX.Element =>
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView>
      <SectionHeading text="Information" />
      <Field component={DateField} name="date" label="Date" />
      <Field component={TextField} name="reason" label="Reason" />
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
          <Field component={TextField} name="reason" label="Reason" />
        </StyledView>
        <StyledView width="49%">
          <CurrentUserField name="examiner" label="Examiner" />
        </StyledView>
      </RowView>
    </StyledView>
  );
