import React, { useEffect } from 'react';
import styled from 'styled-components';
import { DRUG_STOCK_STATUS_LABELS, PHARMACY_PRESCRIPTION_TYPE_LABELS } from '@tamanu/constants';
import { AutocompleteField, DateField, Field, SearchField, TranslatedSelectField } from '../Field';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import { useMedicationsContext } from '../../contexts/Medications';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { MEDICATIONS_SEARCH_KEYS } from '../../constants/medication';
import { Colors } from '../../constants';
import { useFormikContext } from 'formik';

const StyledCustomisableSearchBarWithPermissionCheck = styled(CustomisableSearchBarWithPermissionCheck)`
  .actions-container {
    justify-content: flex-end;
  }
`;

const StyledAutocompleteField = styled(AutocompleteField)`
  .MuiInputBase-root.Mui-disabled {
    background-color: ${Colors.background};
  }
`;

const advancedFields = ['date', 'stockStatus', 'paymentStatus'];

const MedicationRequestsSearchBarMainFields = () => {
  const { values, setFieldValue } = useFormikContext();

  const drugSuggester = useSuggester('drug');
  const prescriberSuggester = useSuggester('practitioner');
  const areaSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true, locationGroupId: values.locationGroupId },
  });

  useEffect(() => {
    if (!values.locationGroupId) {
      setFieldValue('locationId', undefined);
    }
  }, [values.locationGroupId, setFieldValue]);

  return (
    <>
      <Field
        name="displayId"
        label={
          <TranslatedText
            stringId="medication-requests.search.patient.label"
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
            stringId="medication-requests.search.firstName.label"
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
            stringId="medication-requests.search.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-last-name"
          />
        }
        component={SearchField}
        data-testid="field-last-name"
      />
      <Field
        name="locationGroupId"
        label={
          <TranslatedText
            stringId="medication-requests.search.area.label"
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
            stringId="medication-requests.search.location.label"
            fallback="Location"
            data-testid="translatedtext-location"
          />
        }
        component={StyledAutocompleteField}
        suggester={locationSuggester}
        size="small"
        data-testid="field-location"
        disabled={!values.locationGroupId}
      />
      <Field
        name="prescriptionType"
        label={
          <TranslatedText
            stringId="medication-requests.search.prescriptionType.label"
            fallback="Prescription type"
            data-testid="translatedtext-prescription-type"
          />
        }
        component={TranslatedSelectField}
        enumValues={PHARMACY_PRESCRIPTION_TYPE_LABELS}
        size="small"
        data-testid="field-prescription-type"
      />
      <div style={{ gridColumn: 'span 2' }}>
        <Field
          name="medicationId"
          label={
            <TranslatedText
              stringId="medication-requests.search.medication.label"
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
        name="prescriberId"
        label={
          <TranslatedText
            stringId="medication-requests.search.prescriber.label"
            fallback="Prescriber"
            data-testid="translatedtext-prescriber"
          />
        }
        component={AutocompleteField}
        suggester={prescriberSuggester}
        size="small"
        data-testid="field-prescriber"
      />
    </>
  );
};

export const MedicationRequestsSearchBar = () => {
  const { searchParameters, setSearchParameters } = useMedicationsContext(
    MEDICATIONS_SEARCH_KEYS.ACTIVE,
  );

  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    advancedFields,
    searchParameters,
  );

  const handleSearch = values => {
    setSearchParameters({
      ...values,
      date: values.date || undefined,
    });
  };

  return (
    <StyledCustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="Medication"
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      title="Search medication requests"
      onSearch={handleSearch}
      initialValues={{ ...searchParameters }}
      hiddenFields={
        <>
          <Field
            name="date"
            label={
              <TranslatedText
                stringId="medication-requests.search.date.label"
                fallback="Date"
                data-testid="translatedtext-date"
              />
            }
            saveDateAsString
            component={DateField}
            data-testid="field-date"
          />
          <Field
            name="stockStatus"
            label={
              <TranslatedText
                stringId="medication-requests.search.stock.label"
                fallback="Stock"
                data-testid="translatedtext-stock"
              />
            }
            component={TranslatedSelectField}
            enumValues={DRUG_STOCK_STATUS_LABELS}
            size="small"
            data-testid="field-stock"
          />
        </>
      }
      data-testid="customisablesearchbarwithpermissioncheck-medication"
    >
      <MedicationRequestsSearchBarMainFields />
    </StyledCustomisableSearchBarWithPermissionCheck>
  );
};
