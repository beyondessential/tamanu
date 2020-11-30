/* eslint-disable react/jsx-indent */
import React from 'react';
import { StyledView, RowView } from '/styled/common';
import {
  Orientation,
  screenPercentageToDP,
  getOrientation,
  SCREEN_ORIENTATION,
} from '/helpers/screen';
import { DateField } from '/components/DateField/DateField';
import { TextField } from '/components/TextField/TextField';
import { Field } from '../FormField';

export const VaccineFormTakenNotOnTime = ():
  Element => (getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
  <StyledView
    justifyContent="space-between"
    height={screenPercentageToDP(43.74, Orientation.Height)}
  >
    <Field component={DateField} name="date" label="Date" />
    <Field component={TextField} name="reason" label="Reason" />
    <Field component={TextField} name="batch" label="Batch No." />
    <Field
      component={TextField}
      name="administered"
      label="Administered by"
    />
  </StyledView>
) : (
  <StyledView>
    <RowView marginTop={10}>
      <Field component={DateField} name="date" label="Date" />
    </RowView>
    <RowView marginTop={10} justifyContent="space-between">
      <StyledView width="49%">
        <Field component={TextField} name="reason" label="Reason" />
        <Field component={TextField} name="batch" label="Batch No." />
      </StyledView>
    </RowView>
    <RowView marginTop={10} justifyContent="space-between">
      <StyledView width="49%">
        <Field
          component={TextField}
          name="administered"
          label="Administered by"
        />
      </StyledView>
    </RowView>
  </StyledView>
));
