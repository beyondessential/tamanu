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
import { Field } from '../FormField';

export const VaccineFormGiven = (): JSX.Element => (
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(36.45, Orientation.Height)}
    >
      <Field component={DateField} name="date" label="Date" />
      <Field component={TextField} name="batch" label="Batch No." />
      <Field component={TextField} name="location" label="Given at" />
      <Field
        component={TextField}
        name="administered"
        label="Given by"
      />
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
          <Field
            component={TextField}
            name="administered"
            label="Administered by"
          />
        </StyledView>
      </RowView>
    </StyledView>
  ));
