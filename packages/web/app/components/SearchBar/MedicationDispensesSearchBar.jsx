import React from 'react';
import { AutocompleteField, DateField, Field, SearchField } from '../Field';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import { useMedicationsContext } from '../../contexts/Medications';
import { TranslatedText } from '../Translation/TranslatedText';
import { MEDICATIONS_SEARCH_KEYS } from '../../constants/medication';
import styled from 'styled-components';

const StyledCustomisableSearchBarWithPermissionCheck = styled(
  CustomisableSearchBarWithPermissionCheck,
)`
  .actions-container {
    justify-content: flex-end;
  }
`;

const MedicationDispensesSearchBarMainFields = () => {
  const drugSuggester = useSuggester('drug');
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <>
      <Field
        name="displayId"
        label={
          <TranslatedText
            stringId="medication-dispenses.search.patient.label"
            fallback="Patient ID"
            data-testid="translatedtext-patient-id"
          />
        }
        component={SearchField}
        data-testid="field-patient-id"
      />
      <Field
        name="firstName"
        label={
          <TranslatedText
            stringId="medication-dispenses.search.firstName.label"
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
            stringId="medication-dispenses.search.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-last-name"
          />
        }
        component={SearchField}
        data-testid="field-last-name"
      />
      <div style={{ gridColumn: 'span 2' }}>
        <Field
          name="medicationId"
          label={
            <TranslatedText
              stringId="medication-dispenses.search.medication.label"
              fallback="Medication"
              data-testid="translatedtext-drug"
            />
          }
          component={AutocompleteField}
          suggester={drugSuggester}
          size="small"
          data-testid="field-drug"
        />
      </div>
      <Field
        name="dispensedAt"
        label={
          <TranslatedText
            stringId="medication-dispenses.search.date.label"
            fallback="Date dispensed"
            data-testid="translatedtext-date"
          />
        }
        component={DateField}
        data-testid="field-date"
      />
      <Field
        name="dispensedByUserId"
        label={
          <TranslatedText
            stringId="medication-dispenses.search.dispensed-by.label"
            fallback="Dispensed by"
            data-testid="translatedtext-dispensed-by"
          />
        }
        component={AutocompleteField}
        suggester={practitionerSuggester}
        size="small"
        data-testid="field-dispensed-by"
      />
      <Field
        name="requestNumber"
        label={
          <TranslatedText
            stringId="medication-dispenses.search.request-number.label"
            fallback="Request no."
            data-testid="translatedtext-request-number"
          />
        }
        component={SearchField}
        data-testid="field-request-number"
      />
      <div />
    </>
  );
};

export const MedicationDispensesSearchBar = () => {
  const { searchParameters, setSearchParameters } = useMedicationsContext(
    MEDICATIONS_SEARCH_KEYS.DISPENSED,
  );

  const handleSearch = values => {
    setSearchParameters({
      ...values,
      dispensedAt: values.dispensedAt || undefined,
    });
  };

  return (
    <StyledCustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="Medication"
      title="Search dispensed medications"
      onSearch={handleSearch}
      initialValues={{ ...searchParameters }}
      data-testid="customisablesearchbarwithpermissioncheck-medication-dispense"
    >
      <MedicationDispensesSearchBarMainFields />
    </StyledCustomisableSearchBarWithPermissionCheck>
  );
};
