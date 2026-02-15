import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Field } from 'formik';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  CheckField,
  CustomisableSearchBar,
  DateField,
  LocalisedField,
  SearchField,
} from '../../components';
import { BaseSelectField, useDateTime } from '@tamanu/ui-components';
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
  const { getCurrentDate } = useDateTime();
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
            label={
              <TranslatedText
                stringId="general.localisedField.sex.label"
                fallback="Sex"
                data-testid="translatedtext-5uft"
              />
            }
            component={BaseSelectField}
            options={sexOptions}
            size="small"
            data-testid="localisedfield-3iho"
          />
          <Field
            name="registeringFacilityId"
            label={
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
                data-testid="translatedtext-ytpa"
              />
            }
            component={AutocompleteField}
            suggester={facilitySuggester}
            data-testid="field-tipa"
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.division.label"
                fallback="Division"
                data-testid="translatedtext-5esf"
              />
            }
            name="divisionId"
            component={AutocompleteField}
            suggester={divisionSuggester}
            data-testid="field-9ad5"
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.subdivision.label"
                fallback="Subdivision"
                data-testid="translatedtext-ww6x"
              />
            }
            name="subdivisionId"
            component={AutocompleteField}
            suggester={subdivisionSuggester}
            data-testid="field-tpue"
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <FacilityCheckbox marginTop="6px" data-testid="facilitycheckbox-uoh9">
              <Field
                name="removed"
                label={
                  <TranslatedText
                    stringId="programRegistry.searchBar.includeRemovedPatients.label"
                    fallback="Include removed patients"
                    data-testid="translatedtext-mfuw"
                  />
                }
                component={CheckField}
                data-testid="field-8t5k"
              />
            </FacilityCheckbox>
            <FacilityCheckbox marginTop="15px" data-testid="facilitycheckbox-zzya">
              <Field
                name="deceased"
                label={
                  <TranslatedText
                    stringId="patientList.table.includeDeceasedCheckbox.label"
                    fallback="Include deceased patients"
                    data-testid="translatedtext-q44f"
                  />
                }
                component={CheckField}
                data-testid="field-5a31"
              />
            </FacilityCheckbox>
          </div>
        </>
      }
      data-testid="customisablesearchbar-alea"
    >
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-testid="translatedtext-k3v0"
          />
        }
        component={SearchField}
        data-testid="localisedfield-5oa9"
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-2x0c"
          />
        }
        component={SearchField}
        data-testid="localisedfield-4xja"
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-69oi"
          />
        }
        component={SearchField}
        data-testid="localisedfield-copw"
      />
      <LocalisedField
        name="dateOfBirth"
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
            data-testid="translatedtext-g5q2"
          />
        }
        saveDateAsString
        component={DateField}
        max={getCurrentDate()}
        data-testid="localisedfield-b6xj"
      />
      <Spacer data-testid="spacer-051k" />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.homeVillage.label"
            fallback="Home village"
            data-testid="translatedtext-b6wb"
          />
        }
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
        data-testid="field-uyf8"
      />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.currentlyIn.label"
            fallback="Currently in"
            data-testid="translatedtext-lyrq"
          />
        }
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAtType === 'village'
            ? villageSuggester
            : facilitySuggester
        }
        data-testid="field-fpd6"
      />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.relatedCondition.label"
            fallback="Related condition"
            data-testid="translatedtext-njvm"
          />
        }
        name="programRegistryCondition"
        component={MultiAutocompleteField}
        suggester={programRegistryConditionSuggester}
        data-testid="field-x1sx"
      />
      <Field
        label={
          <TranslatedText
            stringId="programRegistry.clinicalStatus.label"
            fallback="Status"
            data-testid="translatedtext-6nv2"
          />
        }
        name="clinicalStatus"
        component={MultiAutocompleteField}
        suggester={programRegistryStatusSuggester}
        data-testid="field-cw9p"
      />
    </CustomisableSearchBar>
  );
};
