import React, { ReactElement, useState, useCallback } from 'react';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { Field } from '/components/Forms/FormField';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { ReadOnlyBanner } from '~/ui/components/ReadOnlyBanner';
import { MultiCheckbox } from '~/ui/components/MultiCheckbox';
import { DateField } from '~/ui/components/DateField/DateField';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { SubmitButton } from '../SubmitButton';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';

export const LabRequestForm = ({ errors, handleSubmit, navigation }): ReactElement => {
  const [labTestTypes, setLabTestTypes] = useState([]);
  const { models } = useBackend();

  const labRequestCategorySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabTestCategory,
    },
  });
  const labRequestPrioritySuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabTestPriority,
    },
  });
  const labSampleSiteSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.LabSampleSite,
    },
  });
  const specimenTypeSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.SpecimenType,
    },
  });

  const practitionerSuggester = new Suggester(
    models.User,
    { column: 'displayName' },
    (model): OptionType => ({ label: model.displayName, value: model.id }),
  );

  const handleLabRequestTypeSelected = useCallback(async selectedValue => {
    const selectedLabTestTypes = await models.LabTestType.find({
      where: { labTestCategory: selectedValue, visibilityStatus: VisibilityStatus.Current },
      order: { name: 'ASC' },
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
      <Field component={DateField} label="Request date" required mode="date" name="requestedDate" />
      <Field component={DateField} label="Request time" mode="time" name="requestedTime" />
      <Field
        component={AutocompleteModalField}
        label="Requesting clinician"
        name="requestedById"
        required
        suggester={practitionerSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label="Priority"
        navigation={navigation}
        suggester={labRequestPrioritySuggester}
        name="priorityId"
      />
      <Field component={DateField} label="Sample date" required mode="date" name="sampleDate" />
      <Field component={DateField} label="Sample time" required mode="time" name="sampleTime" />
      <Field
        component={AutocompleteModalField}
        label="Collected by"
        name="collectedById"
        suggester={practitionerSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label="Specimen type"
        name="specimenTypeId"
        suggester={specimenTypeSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label="Site"
        navigation={navigation}
        suggester={labSampleSiteSuggester}
        name="labSampleSiteId"
      />
      <Field
        component={AutocompleteModalField}
        label="Test category"
        required
        placeholder="Test category"
        navigation={navigation}
        suggester={labRequestCategorySuggester}
        name="categoryId"
        onChange={handleLabRequestTypeSelected}
      />
      <Field name="labTestTypeIds" component={MultiCheckbox} options={labTestTypes} />
      <FormValidationMessage message={errors.form} />
      <SubmitButton marginTop={15} onSubmit={handleSubmit} />
    </FormScreenView>
  );
};
