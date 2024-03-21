import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Field } from 'formik';
import styled from 'styled-components';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  CheckField,
  CustomisableSearchBar,
  DateField,
  LocalisedField,
  SearchField,
  BaseSelectField,
} from '../../components';
import { useProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { useProgramRegistryConditions } from '../../api/queries/useProgramRegistryConditions';
import { useSexOptions } from '../../hooks';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const Spacer = styled.div`
  width: 100%;
`;

export const ProgramRegistrySearchBar = ({ searchParameters, setSearchParameters }) => {
  const params = useParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const facilitySuggester = useSuggester('facility');
  const villageSuggester = useSuggester('village');
  const sexOptions = useSexOptions(false);
  const { data: programRegistry } = useProgramRegistryQuery(params.programRegistryId);

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: params.programRegistryId },
  });

  const { data: programRegistryConditions } = useProgramRegistryConditions(
    params.programRegistryId,
  );

  return (
    <CustomisableSearchBar
      showExpandButton
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      onSearch={setSearchParameters}
      initialValues={searchParameters}
      hiddenFields={
        <>
          <LocalisedField
            name="sex"
            defaultLabel="Sex"
            label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
            component={BaseSelectField}
            options={sexOptions}
            size="small"
          />
          <Field
            name="registeringFacilityId"
            label="Registering Facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'flex-start',
              gridColumn: '3 / span 3',
            }}
          >
            <FacilityCheckbox>
              <Field name="removed" label="Include removed patients" component={CheckField} />
            </FacilityCheckbox>
            <FacilityCheckbox>
              <Field name="deceased" label="Include deceased patients" component={CheckField} />
            </FacilityCheckbox>
          </div>
        </>
      }
    >
      <LocalisedField
        keepLetterCase
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="dateOfBirth"
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
          />
        }
        saveDateAsString
        component={DateField}
        max={getCurrentDateString()}
      />
      <Spacer />

      <Field
        label="Home village"
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <Field
        label="Currently in"
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAtType === 'village'
            ? villageSuggester
            : facilitySuggester
        }
      />
      <Field
        label="Related condition"
        name="programRegistryCondition"
        component={BaseSelectField}
        options={programRegistryConditions?.data.map(x => ({ label: x.name, value: x.id }))}
        size="small"
      />
      <Field
        label="Status"
        name="clinicalStatus"
        component={AutocompleteField}
        suggester={programRegistryStatusSuggester}
      />
    </CustomisableSearchBar>
  );
};
