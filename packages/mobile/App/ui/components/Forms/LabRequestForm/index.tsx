import React, { ReactElement, useState, useCallback } from 'react';
import { StyledView } from '/styled/common';
import { Field } from '/components/Forms/FormField';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { ReadOnlyBanner } from '~/ui/components/ReadOnlyBanner';
import { MultiCheckbox } from '~/ui/components/MultiCheckbox';
import { DateField } from '~/ui/components/DateField/DateField';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { SubmitButton } from '../SubmitButton';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceData } from '~/models/ReferenceData';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';
import { User } from '~/models/User';

interface LabRequestFormProps {
  handleSubmit: any;
  errors: any;
  labRequestCategorySuggester: Suggester<typeof ReferenceData>;
  labRequestPrioritySuggester: Suggester<typeof ReferenceData>;
  practitionerSuggester: Suggester<typeof User>;
  navigation: any;
}

const DumbLabRequestForm = ({
  handleSubmit,
  errors,
  labRequestCategorySuggester,
  labRequestPrioritySuggester,
  practitionerSuggester,
  navigation,
}: LabRequestFormProps): ReactElement => {
  const { models } = useBackend();
  const [labTestTypes, setLabTestTypes] = useState([]);
  const handleLabRequestTypeSelected = useCallback(async selectedValue => {
    const selectedLabTestTypes = await models.LabTestType.find({
      where: { labTestCategory: selectedValue, visibilityStatus: VisibilityStatus.Current },
    });
    const labTestTypeOptions = selectedLabTestTypes.map(labTestType => ({
      id: labTestType.id,
      text: labTestType.name,
      value: false,
    }));
    setLabTestTypes(labTestTypeOptions);
  }, []);
  return (
    <FormScreenView paddingRight={20} paddingLeft={20} paddingTop={20}>
      <Field component={ReadOnlyBanner} label="Test ID" name="displayId" disabled />
      <Field component={DateField} label="Request date" mode="date" name="requestedDate" />
      <Field component={DateField} label="Request time" mode="time" name="requestedTime" />
      <Field
        component={AutocompleteModalField}
        label="Requesting clinician"
        placeholder="Requesting clinician"
        name="requestedBy"
        suggester={practitionerSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label="Priority"
        placeholder="Priority"
        navigation={navigation}
        suggester={labRequestPrioritySuggester}
        modalRoute={Routes.Autocomplete.Modal}
        name="priorityId"
        marginTop={0}
      />
      <Field component={DateField} label="Sample date" mode="date" name="sampleDate" />
      <Field component={DateField} label="Sample time" mode="time" name="sampleTime" />
      <Field
        component={AutocompleteModalField}
        label="Type"
        placeholder="Test category"
        navigation={navigation}
        suggester={labRequestCategorySuggester}
        modalRoute={Routes.Autocomplete.Modal}
        name="categoryId"
        onChange={handleLabRequestTypeSelected}
        marginTop={0}
      />
      <Field name="labTestTypes" component={MultiCheckbox} options={labTestTypes} />
      <FormValidationMessage message={errors.form} />
      <SubmitButton marginTop={15} onSubmit={handleSubmit} />
    </FormScreenView>
  );
};

export const LabRequestForm = ({ handleSubmit, errors, navigation }): ReactElement => {
  const { models } = useBackend();

  const labRequestCategorySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabTestCategory,
      visibilityStatus: VisibilityStatus.Current,
    },
  });

  const labRequestPrioritySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabTestPriority,
      visibilityStatus: VisibilityStatus.Current,
    },
  });

  const practitionerSuggester = new Suggester(models.User);

  return (
    <DumbLabRequestForm
      handleSubmit={handleSubmit}
      errors={errors}
      navigation={navigation}
      labRequestCategorySuggester={labRequestCategorySuggester}
      labRequestPrioritySuggester={labRequestPrioritySuggester}
      practitionerSuggester={practitionerSuggester}
    />
  );
};
