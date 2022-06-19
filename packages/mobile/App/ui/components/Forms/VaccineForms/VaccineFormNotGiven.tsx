import React from 'react';
import { StyledView } from '/styled/common';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { FormSectionHeading } from '../FormSectionHeading';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export function VaccineFormNotGiven(): JSX.Element {
  const { models } = useBackend();
  const userSuggester = new Suggester(
    models.User,
    {
      column: 'displayName',
    },
    user => ({ label: user.displayName, value: user.id }),
  );

  return (
    <StyledView paddingTop={10}>
      <FormSectionHeading text="Date" />
      <Field component={DateField} name="date" label="Date" />
      <FormSectionHeading text="Reason" />
      <Field component={TextField} name="reason" label="Reason" />
      <StyledView width="100%">
        <FormSectionHeading text="Given by" />
        <Field
          component={AutocompleteModalField}
          placeholder="Select practitioner"
          suggester={userSuggester}
          modalRoute={Routes.Autocomplete.Modal}
          name="giverId"
          marginTop={0}
        />
      </StyledView>
      <StyledView width="100%">
        <FormSectionHeading text="Recorded by" />
        <CurrentUserField name="recorderId" />
      </StyledView>
    </StyledView>
  );
}
