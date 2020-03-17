import React from 'react';
import { StyledView, RowView } from '../../../styled/common';
import { Orientation, screenPercentageToDP, getOrientation } from '../../../helpers/screen';
import { Field } from '../FormField';
import { DateField } from '../../DateField/DateField';
import { SCREEN_ORIENTATION } from '../../../helpers/constants';
import { Dropdown } from '../../Dropdown';
import { TextField } from '../../TextField/TextField';

interface VaccineModalFormTakenNotOnTimeProps {
  typeOptions: any[];
  reasonOptions: any[];
  manufactureOptions: any[];
  administeredOptions: any[];
}

export const VaccineFormTakenNotOnTime = ({
  typeOptions,
  reasonOptions,
  manufactureOptions,
  administeredOptions,
}: VaccineModalFormTakenNotOnTimeProps): JSX.Element => (
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT
    ? (
      <StyledView
        justifyContent="space-between"
        height={screenPercentageToDP(43.74, Orientation.Height)}
      >
        <Field
          component={DateField}
          name="date"
          label="Date"
        />
        <Field
          component={Dropdown}
          options={reasonOptions}
          name="reason"
          label="Reason"
        />
        <Field
          component={Dropdown}
          options={typeOptions}
          name="type"
          label="Type"
        />
        <Field
          component={TextField}
          name="batch"
          label="Batch No."
        />
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
    )
    : (
      <StyledView>
        <RowView marginTop={10}>
          <Field
            component={DateField}
            name="date"
            label="Date"
          />
        </RowView>
        <RowView marginTop={10} justifyContent="space-between">
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={reasonOptions}
              name="reason"
              label="Reason"
            />
          </StyledView>
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={typeOptions}
              name="type"
              label="Type"
            />
          </StyledView>
        </RowView>
        <RowView marginTop={10} justifyContent="space-between">
          <StyledView width="49%">
            <Field
              component={Dropdown}
              options={reasonOptions}
              name="batch"
              label="Batch No."
            />
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
    ));
