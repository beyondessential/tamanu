import React from 'react';
import { StyledView, RowView } from '/styled/common';
import {
  Orientation,
  screenPercentageToDP,
  getOrientation,
} from '/helpers/screen';
import { DateField } from '/components/DateField/DateField';
import { TextField } from '/components/TextField/TextField';
import { SCREEN_ORIENTATION } from '/helpers/constants';
import { Dropdown } from '/components/Dropdown';
import { Field } from '../FormField';

interface VaccineModalFormTakenProps {
  typeOptions: any[];
  manufactureOptions: any[];
  administeredOptions: any[];
}

export const VaccineFormTaken = ({
  typeOptions,
  manufactureOptions,
  administeredOptions,
}: VaccineModalFormTakenProps): JSX.Element =>
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT ? (
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(36.45, Orientation.Height)}
    >
      <Field component={DateField} name="date" label="Date" />
      <Field
        component={Dropdown}
        options={typeOptions}
        name="type"
        label="Type"
      />
      <Field component={TextField} name="batch" label="Batch No." />
      <Field
        component={Dropdown}
        options={manufactureOptions}
        name="manufacture"
        label="Manufacture"
      />
      <Field
        component={Dropdown}
        options={administeredOptions}
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
          <Field
            component={Dropdown}
            options={typeOptions}
            name="type"
            label="Type"
          />
        </StyledView>
        <StyledView width="49%">
          <Field
            component={Dropdown}
            options={manufactureOptions}
            name="manufacture"
            label="Manufacture"
          />
        </StyledView>
      </RowView>
      <RowView marginTop={10} justifyContent="space-between">
        <StyledView width="49%">
          <Field component={TextField} name="batch" label="Batch No." />
        </StyledView>
        <StyledView width="49%">
          <Field
            component={Dropdown}
            options={administeredOptions}
            name="administered"
            label="Administered by"
          />
        </StyledView>
      </RowView>
    </StyledView>
  );
