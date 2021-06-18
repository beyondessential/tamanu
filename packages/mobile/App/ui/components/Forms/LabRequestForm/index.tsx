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
import { Text, View } from 'react-native';
import { DateField } from '~/ui/components/DateField/DateField';
import { CurrentUserField } from '~/ui/components/CurrentUserField/CurrentUserField';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';
import { Checkbox } from '../../Checkbox';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceData } from '~/models/ReferenceData';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';

const LabRequestNumberField = () => {
  return (
    <Field
      component={NumberField}
      label="Lab Request Number"
      name="displayId"
      disabled
    />);
}
interface LabRequestFormProps {
  handleSubmit: any,
  errors: any,
  labRequestCategorySuggester: Suggester<typeof ReferenceData>,
  navigation: any,
};

const DumbLabRequestForm = ({ handleSubmit, errors, labRequestCategorySuggester, navigation }: LabRequestFormProps): ReactElement => (
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
            <View style={{display: 'flex', flexDirection: 'row'}}>
              <Text>{'Urgent?:'}</Text>
              <Field
                component={Checkbox} // Binary Field
                label="Urgent?"
                name="urgent"
              />
            </View>
          </StyledView>
          <SectionHeader h3>SPECIMEN</SectionHeader>
          <Text>{'Cannot yet attach specimens on mobile (UI not built yet)'}</Text>
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

export const LabRequestForm = ({ handleSubmit, errors, navigation }) => {
  const { models } = useBackend();

  const labRequestCategorySuggester = new Suggester(
    models.ReferenceData,
    {
      where: {
        type: ReferenceDataType.LabTestCategory,
      },
    },
  );

  return <DumbLabRequestForm 
    handleSubmit={handleSubmit}
    errors={errors}
    navigation={navigation}
    labRequestCategorySuggester={labRequestCategorySuggester}
  />
};
