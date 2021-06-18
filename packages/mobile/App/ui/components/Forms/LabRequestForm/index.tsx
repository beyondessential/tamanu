import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { SectionHeader } from '/components/SectionHeader';
import {
  Orientation,
  screenPercentageToDP,
} from '/helpers/screen';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { NumberField } from '~/ui/components/NumberField';
import { Dropdown } from '~/ui/components/Dropdown';
import { Text } from 'react-native';
import { DateField } from '~/ui/components/DateField/DateField';
import { CurrentUserField } from '~/ui/components/CurrentUserField/CurrentUserField';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';
import { Checkbox } from '../../Checkbox';

const LabRequestNumberField = () => {
  return (
    <Field
      component={NumberField}
      label="Lab Request Number"
      name="displayId"
    />);
}

export const LabRequestForm = ({ handleSubmit, errors, labRequestCategorySuggester, navigation }): ReactElement => (
      <FormScreenView>
        <StyledView
          height={screenPercentageToDP(89.64, Orientation.Height)}
          justifyContent="space-between"
        >
          <LabRequestNumberField />
          <SectionHeader h3>DETAILS</SectionHeader>
          <StyledView
            justifyContent="space-between"
          >
            <Field
              component={DateField}
              label="Date"
              name="requestedDate"
            />
            <Field
              component={CurrentUserField}
              label="Requested by"
              name="requestedBy"
            />
            <Field
              component={Checkbox} // Binary Field
              label="Urgent?"
              name="urgent"
            />
          </StyledView>
          <SectionHeader h3>SPECIMEN</SectionHeader>
          <Field
            component={TextField}
            label="comments"
            name="comments"
          />
          <SectionHeader h3>LAB REQUEST TYPE</SectionHeader>
          <Field
            component={AutocompleteModalField}
            label="Type"
            placeholder={'Search for types'}
            navigation={navigation}
            suggester={labRequestCategorySuggester}
            modalRoute={Routes.Autocomplete.Modal}
            name="categoryId"
          />
          <Text>{'All tests for this lab request type will be requested (UI not built yet)'}</Text>
          <FormValidationMessage message={errors.form} />
          <Button
            marginTop={20}
            backgroundColor={theme.colors.PRIMARY_MAIN}
            buttonText="Submit"
            onPress={handleSubmit}
          />
        </StyledView>
      </FormScreenView>
    );