import React from 'react';
import { StyledView, RowView } from '../../../styled/common';
import { Orientation, screenPercentageToDP, getOrientation } from '../../../helpers/screen';
import { Field } from '../FormField';
import { DateField } from '../../DateField/DateField';
import { TextField } from '../../TextField/TextField';
import { SCREEN_ORIENTATION } from '../../../helpers/constants';
import { Dropdown } from '../../Dropdown';

interface VaccineModalFormTakenProps {
  typeOptions: any[];
  manufactureOptions: any[];
  administeredOptions: any[];
}

export const VaccineModalFormTaken = ({
  typeOptions,
  manufactureOptions,
  administeredOptions,
}: VaccineModalFormTakenProps): JSX.Element => (
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT
    ? (
      <StyledView
        justifyContent="space-between"
        height={screenPercentageToDP(36.45, Orientation.Height)}
      >
        <Field
          component={DateField}
          name="date"
          label="Date"
          disabled
        />
        <Field
          component={Dropdown}
          options={typeOptions}
          name="type"
          label="Type"
          disabled
        />
        <Field
          component={TextField}
          name="batch"
          label="Batch No."
          disabled
        />
        <Field
          component={Dropdown}
          options={manufactureOptions}
          name="manufacture"
          label="Manufacture"
          disabled
        />
        <Field
          component={Dropdown}
          options={administeredOptions}
          name="administered"
          label="Administered by"
          disabled
        />
      </StyledView>
    )
    : (
      <StyledView>
        <RowView marginTop={10}>
          <Field
            component={DateField}
            name="date"
            label="Date"
            disabled
          />
        </RowView>
        <RowView marginTop={10} justifyContent="space-between">
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={typeOptions}
              name="type"
              label="Type"
              disabled
            />
          </StyledView>
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={manufactureOptions}
              name="manufacture"
              label="Manufacture"
              disabled
            />
          </StyledView>
        </RowView>
        <RowView marginTop={10} justifyContent="space-between">
          <StyledView width="49%">
            <Field
              component={TextField}
              name="batch"
              label="Batch No."
              disabled
            />
          </StyledView>
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={administeredOptions}
              name="administered"
              label="Administered by"
              disabled
            />
          </StyledView>
        </RowView>
      </StyledView>
    ));
