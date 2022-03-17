import React from 'react';
import { StyledView, RowView } from '/styled/common';
import {
  Orientation,
  screenPercentageToDP,
  getOrientation,
  SCREEN_ORIENTATION,
} from '/helpers/screen';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { SectionHeader } from '/components/SectionHeader';

export const VaccineFormNotGiven = (): JSX.Element =>
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(21.87, Orientation.Height)}
    >
      <StyledView marginBottom={5}>
        <SectionHeader h3>INFORMATION</SectionHeader>
      </StyledView>
      <Field component={DateField} name="date" label="Date" />
      <Field component={TextField} name="reason" label="Reason" />
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
