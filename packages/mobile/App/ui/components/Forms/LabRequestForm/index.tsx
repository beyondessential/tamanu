import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { Field } from '/components/Forms/FormField';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { ReadOnlyBanner } from '~/ui/components/ReadOnlyBanner';
import { MultiCheckbox } from '~/ui/components/MultiCheckbox';
import { DateField } from '~/ui/components/DateField/DateField';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { SubmitButton } from '../SubmitButton';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';
import { TranslatedText } from '../../Translations/TranslatedText';
import { TranslatedReferenceData } from '../../Translations/TranslatedReferenceData';
import { useAuth } from '~/ui/contexts/AuthContext';

export const LabRequestForm = ({ errors, handleSubmit, navigation }): ReactElement => {
  const { ability } = useAuth();
  const canCreateSensitive = ability.can('create', 'SensitiveLabRequest');
  const [labTestTypes, setLabTestTypes] = useState([]);
  const { models } = useBackend();

  const labRequestCategorySuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: {
            type: ReferenceDataType.LabTestCategory,
          },
        },
      }),
    [models.ReferenceData],
  );
  const labRequestPrioritySuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: {
            type: ReferenceDataType.LabTestPriority,
          },
        },
      }),
    [models.ReferenceData],
  );
  const labSampleSiteSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: {
            type: ReferenceDataType.LabSampleSite,
          },
        },
      }),
    [models.ReferenceData],
  );
  const specimenTypeSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: {
            type: ReferenceDataType.SpecimenType,
          },
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

  const handleLabRequestTypeSelected = useCallback(async (selectedValue) => {
    const where: any = {
      labTestCategory: { id: selectedValue },
      visibilityStatus: VisibilityStatus.Current,
    };
    if (!canCreateSensitive) {
      where.isSensitive = false;
    }
    const selectedLabTestTypes = await models.LabTestType.find({
      where,
      order: { name: 'ASC' },
    });
    const labTestTypeOptions = selectedLabTestTypes.map((labTestType) => ({
      id: labTestType.id,
      text: (
        <TranslatedReferenceData
          fallback={labTestType.name}
          value={labTestType.id}
          category="labTestType"
        />
      ),
      value: false,
    }));
    setLabTestTypes(labTestTypeOptions);
  }, []);

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
        required
        mode="date"
        name="requestedDate"
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="lab.requestTime.label" fallback="Request time" />}
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
                  data-testid="translatedtext-9ywm"
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
        required
        mode="date"
        name="sampleDate"
      />
      <Field
        component={DateField}
        label={<TranslatedText stringId="lab.sampleTime.label" fallback="Sample time" />}
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
        onChange={handleLabRequestTypeSelected}
      />
      <Field name="labTestTypeIds" component={MultiCheckbox} options={labTestTypes} />
      <FormValidationMessage message={errors.form} />
      <SubmitButton marginTop={15} onSubmit={handleSubmit} />
    </FormScreenView>
  );
};
