import React, { ReactElement } from 'react';
import { FormGroup } from '../FormGroup';
import { GenderOptions, MaritalStatusOptions } from '/helpers/constants';
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { Field } from '../../FormField';
import { Dropdown } from '/components/Dropdown';
import { TextField } from '/components/TextField/TextField';

export const KeyInformationSection = (): ReactElement => (
  <FormGroup sectionName="KEY INFORMATION">
    <Field label="Blood type" name="bloodType" component={TextField} />
    <Field
      label="Gender"
      name="gender"
      options={GenderOptions}
      component={RadioButtonGroup}
    />
    <Field
      label="Marital Status"
      name="maritalStatus"
      component={Dropdown}
      options={MaritalStatusOptions}
    />
  </FormGroup>
);
