import React, { type ReactElement, useMemo } from 'react';
import type { LabTestType } from '~/models/LabTestType';
import { ReferenceDataType } from '~/types';
import { DateField } from '~/ui/components/DateField/DateField';
import { MultiCheckbox } from '~/ui/components/MultiCheckbox';
import { ReadOnlyBanner } from '~/ui/components/ReadOnlyBanner';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { TranslatedReferenceData } from '../../Translations/TranslatedReferenceData';
import { TranslatedText } from '../../Translations/TranslatedText';
import { SubmitButton } from '../SubmitButton';
import useLabTestTypesQuery from './useLabTestTypesQuery';
import { Field } from '/components/Forms/FormField';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';

const toMultiCheckboxOptions = (labTestTypes: LabTestType[]) =>
  labTestTypes.map(labTestType => ({
    id: labTestType.id,
    text: (
      <TranslatedReferenceData
        value={labTestType.id}
        fallback={labTestType.name}
        category={ReferenceDataType.LabTestType}
      />
    ),
  }));

export const LabRequestForm = ({ values, errors, handleSubmit, navigation }) => {
  const { models } = useBackend();

  const labRequestCategorySuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: { type: ReferenceDataType.LabTestCategory },
        },
      }),
    [models.ReferenceData],
  );
  const labRequestPrioritySuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: { type: ReferenceDataType.LabTestPriority },
        },
      }),
    [models.ReferenceData],
  );
  const labSampleSiteSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: { type: ReferenceDataType.LabSampleSite },
        },
      }),
    [models.ReferenceData],
  );
  const specimenTypeSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: { type: ReferenceDataType.SpecimenType },
        },
      }),
    [models.ReferenceData],
  );
  const practitionerSuggester = useMemo(
    () =>
      new Suggester({
        model: models.User,
        options: { column: 'displayName' },
      }),
    [models.User],
  );

  const { ability } = useAuth();
  const includeSensitive = ability.can('create', 'SensitiveLabRequest');
  const { data: labTestTypeOptions = [] } = useLabTestTypesQuery(
    { labTestCategoryId: values.categoryId, includeSensitive },
    { select: toMultiCheckboxOptions },
  );

  return (
    <FormScreenView paddingRight={20} paddingLeft={20} paddingTop={20}>
      <Field
        component={ReadOnlyBanner}
        label={<TranslatedText stringId="lab.requestId.label.short" fallback="Test ID" />}
        name="displayId"
        disabled
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="general.requestDate.label" fallback="Request date" />}
        labelFontSize="14"
        required
        mode="date"
        name="requestedDate"
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="lab.requestTime.label" fallback="Request time" />}
        labelFontSize="14"
        mode="time"
        name="requestedTime"
      />
      <Field
        component={AutocompleteModalField}
        label={
          <TranslatedText
            stringId="lab.requestingClinician.label"
            fallback="Requesting :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                />
              ),
            }}
          />
        }
        name="requestedById"
        required
        suggester={practitionerSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label={<TranslatedText stringId="lab.priority.label" fallback="Priority" />}
        navigation={navigation}
        suggester={labRequestPrioritySuggester}
        name="priorityId"
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="lab.sampleDate.label" fallback="Sample date" />}
        labelFontSize="14"
        required
        mode="date"
        name="sampleDate"
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="lab.sampleTime.label" fallback="Sample time" />}
        labelFontSize="14"
        required
        mode="time"
        name="sampleTime"
      />
      <Field
        component={AutocompleteModalField}
        label={<TranslatedText stringId="lab.collectedBy.label" fallback="Collected by" />}
        name="collectedById"
        suggester={practitionerSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label={<TranslatedText stringId="lab.specimenType.label" fallback="Specimen type" />}
        name="specimenTypeId"
        suggester={specimenTypeSuggester}
      />
      <Field
        component={AutocompleteModalField}
        label={<TranslatedText stringId="lab.site.label" fallback="Site" />}
        navigation={navigation}
        suggester={labSampleSiteSuggester}
        name="labSampleSiteId"
      />
      <Field
        component={AutocompleteModalField}
        label={<TranslatedText stringId="lab.testCategory.label" fallback="Test category" />}
        required
        placeholder={<TranslatedText stringId="lab.testCategory.label" fallback="Test category" />}
        navigation={navigation}
        suggester={labRequestCategorySuggester}
        name="categoryId"
      />
      <Field name="labTestTypeIds" component={MultiCheckbox} options={labTestTypeOptions} />
      <FormValidationMessage message={errors.form} />
      <SubmitButton marginTop={15} onSubmit={handleSubmit} />
    </FormScreenView>
  );
};
