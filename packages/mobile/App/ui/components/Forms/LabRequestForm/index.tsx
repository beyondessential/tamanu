import React, { ReactElement, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { SectionHeader } from '/components/SectionHeader';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { ReadOnlyBanner } from '~/ui/components/ReadOnlyBanner';
import { MultiCheckbox } from '~/ui/components/MultiCheckbox';
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
      component={ReadOnlyBanner}
      label='Lab Request Number'
      name='displayId'
      disabled
    />
  );
};
interface LabRequestFormProps {
  handleSubmit: any;
  errors: any;
  labRequestCategorySuggester: Suggester<typeof ReferenceData>;
  navigation: any;
}

const DumbLabRequestForm = ({
  handleSubmit,
  errors,
  labRequestCategorySuggester,
  navigation
}: LabRequestFormProps): ReactElement => {
  const { models } = useBackend();
  const [labTestTypes, setLabTestTypes] = useState([]);
  const handleLabRequestTypeSelected = useCallback(async selectedValue => {
    const labTestTypes = await models.LabTestType.find({
      where: { labTestCategory: selectedValue }
    });
    const labTestTypeOptions = labTestTypes.map(labTestType => ({
      id: labTestType.id,
      text: labTestType.name,
      value: false
    }));
    setLabTestTypes(labTestTypeOptions);
  }, []);
  return (
    <FormScreenView paddingRight={20} paddingLeft={20} paddingTop={20}>
      <StyledView justifyContent='space-between'>
        <LabRequestNumberField />
        <StyledView
          marginTop={screenPercentageToDP(2.105, Orientation.Height)}
          height={screenPercentageToDP(23.87, Orientation.Height)}
          justifyContent='space-between'
        >
          <SectionHeader h3>DETAILS</SectionHeader>
          <Field component={DateField} label='Date' name='requestedDate' />
          <Field
            component={CurrentUserField}
            label='Requested by'
            name='requestedBy'
          />
          <Field
            component={Checkbox}
            text='Urgent?'
            name='urgent'
            style={{ marginRight: '10' }}
          />
        </StyledView>
        <StyledView
          marginTop={screenPercentageToDP(2.105, Orientation.Height)}
          height={screenPercentageToDP(28.87, Orientation.Height)}
          justifyContent='space-between'
        >
          <SectionHeader h3>SPECIMEN</SectionHeader>
          <Field
            component={RadioButtonGroup}
            label='Specimen Attached?'
            name='specimenAttached'
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false }
            ]}
          />
          <Field
            component={DateField}
            label='Date'
            mode='date'
            name='sampleDate'
          />
          <Field
            component={DateField}
            label='Time'
            mode='time'
            name='sampleTime'
          />
        </StyledView>
        <StyledView
          marginTop={screenPercentageToDP(2.105, Orientation.Height)}
          marginBottom={20}
          justifyContent='space-between'
        >
          <SectionHeader h3>LAB REQUEST TYPE</SectionHeader>
          <Field
            component={AutocompleteModalField}
            label='Type'
            placeholder={'Search for types'}
            navigation={navigation}
            suggester={labRequestCategorySuggester}
            modalRoute={Routes.Autocomplete.Modal}
            name='categoryId'
            onChange={handleLabRequestTypeSelected}
          />
          <Field
            name='labTestTypes'
            component={MultiCheckbox}
            options={labTestTypes}
          />
        </StyledView>
        <FormValidationMessage message={errors.form} />
        <Button
          marginTop={20}
          backgroundColor={theme.colors.PRIMARY_MAIN}
          buttonText='Submit'
          onPress={handleSubmit}
        />
      </StyledView>
    </FormScreenView>
  );
};

export const LabRequestForm = ({ handleSubmit, errors, navigation }) => {
  const { models } = useBackend();

  const labRequestCategorySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabTestCategory
    }
  });

  return (
    <DumbLabRequestForm
      handleSubmit={handleSubmit}
      errors={errors}
      navigation={navigation}
      labRequestCategorySuggester={labRequestCategorySuggester}
    />
  );
};
