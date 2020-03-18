import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { Orientation, screenPercentageToDP, getOrientation } from '/helpers/screen';
import { DateField } from '/components/DateField/DateField';
import { SCREEN_ORIENTATION } from '/helpers/constants';
import { Dropdown } from '/components/Dropdown';
import { Field } from '../FormField';

interface VaccineModalFormNotTakenProps {
  reasonOptions: any[];
  administeredOptions: any[];
}

export const VaccineFormNotTaken = ({
  reasonOptions,
  administeredOptions,
}: VaccineModalFormNotTakenProps): JSX.Element => (
  getOrientation() === SCREEN_ORIENTATION.PORTRAIT
    ? (
      <StyledView
        justifyContent="space-between"
        height={screenPercentageToDP(21.87, Orientation.Height)}
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
              options={administeredOptions}
              name="administered"
              label="Administered by"
            />
          </StyledView>
        </RowView>
      </StyledView>
    ));
