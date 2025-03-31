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
            label={<TranslatedText
              stringId="general.localisedField.sex.label"
              fallback="Sex"
              data-test-id='translatedtext-w28c' />}
            component={BaseSelectField}
            options={sexOptions}
            size="small"
            data-test-id='localisedfield-i4wd' />
          <Field
            name="registeringFacilityId"
            label={
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
                data-test-id='translatedtext-ryfg' />
            }
            component={AutocompleteField}
            suggester={facilitySuggester}
            data-test-id='field-v1p0' />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.division.label"
                fallback="Division"
                data-test-id='translatedtext-y134' />
            }
            name="divisionId"
            component={AutocompleteField}
            suggester={divisionSuggester}
            data-test-id='field-jdtj' />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.subdivision.label"
                fallback="Subdivision"
                data-test-id='translatedtext-1bg9' />
            }
            name="subdivisionId"
            component={AutocompleteField}
            suggester={subdivisionSuggester}
            data-test-id='field-f6tf' />
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
                    data-test-id='translatedtext-ko6t' />
                }
                component={CheckField}
                data-test-id='field-0r8s' />
            </FacilityCheckbox>
            <FacilityCheckbox marginTop="15px">
              <Field
                name="deceased"
                label={
                  <TranslatedText
                    stringId="patientList.table.includeDeceasedCheckbox.label"
                    fallback="Include deceased patients"
                    data-test-id='translatedtext-cnut' />
                }
                component={CheckField}
                data-test-id='field-b9t2' />
            </FacilityCheckbox>
          </div>
        </>
      }
    >
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-test-id='translatedtext-rl70' />
        }
        component={SearchField}
        data-test-id='localisedfield-2hww' />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-test-id='translatedtext-vnrr' />
        }
        component={SearchField}
        data-test-id='localisedfield-1x10' />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-test-id='translatedtext-zn5c' />
        }
        component={SearchField}
        data-test-id='localisedfield-pi0a' />
      <LocalisedField
        name="dateOfBirth"
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
            data-test-id='translatedtext-ohj3' />
        }
        saveDateAsString
        component={DateField}
        max={getCurrentDateString()}
        data-test-id='localisedfield-3lnf' />
      <Spacer />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.homeVillage.label"
            fallback="Home village"
            data-test-id='translatedtext-5lo5' />
        }
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
        data-test-id='field-3wws' />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.currentlyIn.label"
            fallback="Currently in"
            data-test-id='translatedtext-o1rg' />
        }
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAtType === 'village'
            ? villageSuggester
            : facilitySuggester
        }
        data-test-id='field-5ezr' />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.relatedCondition.label"
            fallback="Related condition"
            data-test-id='translatedtext-nh9y' />
        }
        name="programRegistryCondition"
        component={MultiAutocompleteField}
        suggester={programRegistryConditionSuggester}
        data-test-id='field-qp8h' />
      <Field
        label={<TranslatedText
          stringId="programRegistry.clinicalStatus.label"
          fallback="Status"
          data-test-id='translatedtext-pif1' />}
        name="clinicalStatus"
        component={MultiAutocompleteField}
        suggester={programRegistryStatusSuggester}
        data-test-id='field-iarj' />
    </CustomisableSearchBar>
  );
};
