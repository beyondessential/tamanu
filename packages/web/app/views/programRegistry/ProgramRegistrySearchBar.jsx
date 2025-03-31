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
              data-testid='translatedtext-w28c' />}
            component={BaseSelectField}
            options={sexOptions}
            size="small"
            data-testid='localisedfield-i4wd' />
          <Field
            name="registeringFacilityId"
            label={
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
                data-testid='translatedtext-ryfg' />
            }
            component={AutocompleteField}
            suggester={facilitySuggester}
            data-testid='field-v1p0' />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.division.label"
                fallback="Division"
                data-testid='translatedtext-y134' />
            }
            name="divisionId"
            component={AutocompleteField}
            suggester={divisionSuggester}
            data-testid='field-jdtj' />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.subdivision.label"
                fallback="Subdivision"
                data-testid='translatedtext-1bg9' />
            }
            name="subdivisionId"
            component={AutocompleteField}
            suggester={subdivisionSuggester}
            data-testid='field-f6tf' />
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
                    data-testid='translatedtext-ko6t' />
                }
                component={CheckField}
                data-testid='field-0r8s' />
            </FacilityCheckbox>
            <FacilityCheckbox marginTop="15px">
              <Field
                name="deceased"
                label={
                  <TranslatedText
                    stringId="patientList.table.includeDeceasedCheckbox.label"
                    fallback="Include deceased patients"
                    data-testid='translatedtext-cnut' />
                }
                component={CheckField}
                data-testid='field-b9t2' />
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
            data-testid='translatedtext-rl70' />
        }
        component={SearchField}
        data-testid='localisedfield-2hww' />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid='translatedtext-vnrr' />
        }
        component={SearchField}
        data-testid='localisedfield-1x10' />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid='translatedtext-zn5c' />
        }
        component={SearchField}
        data-testid='localisedfield-pi0a' />
      <LocalisedField
        name="dateOfBirth"
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
            data-testid='translatedtext-ohj3' />
        }
        saveDateAsString
        component={DateField}
        max={getCurrentDateString()}
        data-testid='localisedfield-3lnf' />
      <Spacer />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.homeVillage.label"
            fallback="Home village"
            data-testid='translatedtext-5lo5' />
        }
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
        data-testid='field-3wws' />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.currentlyIn.label"
            fallback="Currently in"
            data-testid='translatedtext-o1rg' />
        }
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAtType === 'village'
            ? villageSuggester
            : facilitySuggester
        }
        data-testid='field-5ezr' />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.relatedCondition.label"
            fallback="Related condition"
            data-testid='translatedtext-nh9y' />
        }
        name="programRegistryCondition"
        component={MultiAutocompleteField}
        suggester={programRegistryConditionSuggester}
        data-testid='field-qp8h' />
      <Field
        label={<TranslatedText
          stringId="programRegistry.clinicalStatus.label"
          fallback="Status"
          data-testid='translatedtext-pif1' />}
        name="clinicalStatus"
        component={MultiAutocompleteField}
        suggester={programRegistryStatusSuggester}
        data-testid='field-iarj' />
    </CustomisableSearchBar>
  );
};
