import React, { ReactElement } from 'react';
// Components
import { Section } from './Section';
import { Field } from '/components/Forms/FormField';
import { Dropdown } from '/components/Dropdown';
import { dropdownItems } from '/components/Dropdown/fixture';

export const SortBySection = (): ReactElement => (
  <Section title="Sort by">
    <Field name="sortBy" component={Dropdown} options={dropdownItems} />
  </Section>
);
