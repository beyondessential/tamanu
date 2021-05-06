import React, { ReactElement } from 'react';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';
import { GenderOptions } from '/helpers/constants';
import { RadioButtonGroup } from '../../../RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';

export const KeyInformationSection = (): ReactElement => (
  <FormGroup sectionName="KEY INFORMATION" marginTop>
    <Field
      label="Gender"
      name="sex"
      options={GenderOptions}
      component={RadioButtonGroup}
    />
    <Field component={DateField} name="dateOfBirth" label="Date of Birth" />
  </FormGroup>
);
