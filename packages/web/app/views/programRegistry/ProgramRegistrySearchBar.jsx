import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Field } from 'formik';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
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
import { useSexOptions } from '../../hooks';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { MultiAutocompleteField } from '../../components/Field/MultiAutocompleteField';

const FacilityCheckbox = styled(Box)`
  display: flex;
  align-items: center;
  margin-left: 20px;
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

  const programRegistryConditionSuggester = useSuggester('programRegistryCondition', {
    baseQueryParameters: { programRegistryId: params.programRegistryId },
  });

  const divisionSuggester = useSuggester('division');
  const subdivisionSuggester = useSuggester('subdivision');

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
            label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
            component={BaseSelectField}
            options={sexOptions}
            size="small"
          />
          <Field
            name="registeringFacilityId"
            label={
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
              />
            }
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.division.label"
                fallback="Division"
              />
            }
            name="divisionId"
            component={AutocompleteField}
            suggester={divisionSuggester}
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.subdivision.label"
                fallback="Subdivision"
              />
            }
            name="subdivisionId"
            component={AutocompleteField}
            suggester={subdivisionSuggester}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <FacilityCheckbox marginTop="6px">
              <Field
                name="removed"
                label={
                  <TranslatedText
                    stringId="programRegistry.searchBar.includeRemovedPatients.label"
                    fallback="Include removed patients"
                  />
                }
                component={CheckField}
              />
            </FacilityCheckbox>
            <FacilityCheckbox marginTop="15px">
              <Field
                name="deceased"
                label={
                  <TranslatedText
                    stringId="patientList.table.includeDeceasedCheckbox.label"
                    fallback="Include deceased patients"
                  />
                }
                component={CheckField}
              />
            </FacilityCheckbox>
          </div>
        </>
      }
    >
      <LocalisedField
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
        label={
          <TranslatedText stringId="programRegistry.homeVillage.label" fallback="Home village" />
        }
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <Field
        label={
          <TranslatedText stringId="programRegistry.currentlyIn.label" fallback="Currently in" />
        }
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAtType === 'village'
            ? villageSuggester
            : facilitySuggester
        }
      />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.relatedCondition.label"
            fallback="Related condition"
          />
        }
        name="programRegistryCondition"
        component={MultiAutocompleteField}
        suggester={programRegistryConditionSuggester}
      />
      <Field
        label={<TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />}
        name="clinicalStatus"
        component={MultiAutocompleteField}
        suggester={programRegistryStatusSuggester}
      />
    </CustomisableSearchBar>
  );
};
