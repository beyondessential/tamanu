import React from 'react';
import { StyledView } from '/styled/common';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { FormSectionHeading } from '../FormSectionHeading';
import { SuggesterDropdown } from '../../Dropdown';
import { ReferenceDataType } from '~/types';

export function VaccineFormNotGiven(): JSX.Element {
  return (
    <StyledView paddingTop={10}>
      <FormSectionHeading text="Date" />
      <Field component={DateField} name="date" label="Date" />
      <FormSectionHeading text="Reason" />
      <Field
        component={SuggesterDropdown}
        name="notGivenReasonId"
        label="Reason"
        referenceDataType={ReferenceDataType.VaccineNotGivenReason}
      />
      <StyledView width="100%">
        <FormSectionHeading text="Given by" />
        <Field component={TextField} name="givenBy" marginTop={0} />
      </StyledView>
      <StyledView width="100%">
        <FormSectionHeading text="Recorded by" />
        <CurrentUserField name="recorderId" />
      </StyledView>
    </StyledView>
  );
}
