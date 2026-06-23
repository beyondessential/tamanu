import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { AutocompleteField, Field, SearchField, SelectField } from '../Field';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';
import { Colors } from '../../constants';

const ADVANCED_FIELDS = ['score', 'locationGroupId', 'locationId'];

const StyledAutocompleteField = styled(AutocompleteField)`
  .MuiInputBase-root.Mui-disabled {
    background-color: ${Colors.background};
  }
`;

const TriageSearchBarAdvancedFields = () => {
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');
  const { values, setFieldValue } = useFormikContext();

  const areaSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true, locationGroupId: values.locationGroupId },
  });

  const previousLocationGroupId = useRef();

  useEffect(() => {
    if (
      previousLocationGroupId.current !== undefined &&
      previousLocationGroupId.current !== values.locationGroupId
    ) {
      setFieldValue('locationId', undefined);
    }
    previousLocationGroupId.current = values.locationGroupId;

    if (!values.locationGroupId) {
      setFieldValue('locationId', undefined);
    }
  }, [values.locationGroupId, setFieldValue]);

  const categoryOptions =
    triageCategories?.map(category => ({
      value: category.level.toString(),
      label: `Level ${category.level} - ${category.label}`,
    })) || [];

  return (
    <>
      <Field
        name="score"
        label={
          <TranslatedText
            stringId="patientList.triage.search.triageCategory.label"
            fallback="Triage category"
            data-testid="translatedtext-triage-category"
          />
        }
        component={SelectField}
        options={categoryOptions}
        size="small"
        data-testid="field-triage-category"
      />
      <Field
        name="locationGroupId"
        label={
          <TranslatedText
            stringId="general.localisedField.locationGroupId.label"
            fallback="Area"
            data-testid="translatedtext-area"
          />
        }
        component={AutocompleteField}
        suggester={areaSuggester}
        size="small"
        data-testid="field-area"
      />
      <Field
        name="locationId"
        label={
          <TranslatedText
            stringId="general.localisedField.locationId.label"
            fallback="Location"
            data-testid="translatedtext-location"
          />
        }
        component={StyledAutocompleteField}
        suggester={locationSuggester}
        size="small"
        disabled={!values.locationGroupId}
        data-testid="field-location"
      />
    </>
  );
};

export const TriageSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    ADVANCED_FIELDS,
    searchParameters,
  );

  return (
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="Triage"
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={searchParameters}
      hiddenFields={<TriageSearchBarAdvancedFields data-testid="triagesearchbaradvancedfields" />}
      data-testid="customisablesearchbarwithpermissioncheck-triage"
    >
      <Field
        name="displayId"
        label={
          <TranslatedText
            stringId="patientList.triage.search.patientId.label"
            fallback="Patient ID"
            data-testid="translatedtext-display-id"
          />
        }
        component={SearchField}
        data-testid="field-display-id"
      />
      <Field
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-first-name"
          />
        }
        component={SearchField}
        data-testid="field-first-name"
      />
      <Field
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-last-name"
          />
        }
        component={SearchField}
        data-testid="field-last-name"
      />
      <Field
        name="clinicianId"
        label={
          <TranslatedText
            stringId="general.localisedField.clinicianId.label"
            fallback="Clinician"
            data-testid="translatedtext-clinician"
          />
        }
        component={AutocompleteField}
        suggester={practitionerSuggester}
        size="small"
        data-testid="field-clinician"
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
