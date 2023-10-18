import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Field } from 'formik';
import styled from 'styled-components';
import { useSuggester } from '../../api';
import {
  CustomisableSearchBar,
  LocalisedField,
  AutocompleteField,
  DateField,
  CheckField,
  SearchField,
  SelectField,
} from '../../components';
import { useProgramRegistry } from '../../api/queries/useProgramRegistry';
import { useProgramRegistryConditions } from '../../api/queries/useProgramRegistryConditions';

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

  const { data: programRegistry } = useProgramRegistry(params.programRegistryId);

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: params.programRegistryId },
  });

  const programRegistryConditionSuggester = useProgramRegistryConditions(params.programRegistryId);

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
            component={SelectField}
            options={[
              { label: 'Male', value: 'M' },
              { label: 'Female', value: 'F' },
            ]}
          />
          <LocalisedField
            name="registeringFacilityId"
            defaultLabel="Registering Facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
            size="small"
          />
          <FacilityCheckbox>
            <Field name="removed" label="Include removed patients" component={CheckField} />
          </FacilityCheckbox>
          <FacilityCheckbox>
            <Field name="deceased" label="Include deceased patients" component={CheckField} />
          </FacilityCheckbox>
        </>
      }
    >
      <LocalisedField useShortLabel keepLetterCase name="displayId" component={SearchField} />
      <LocalisedField useShortLabel name="firstName" component={SearchField} />
      <LocalisedField useShortLabel name="lastName" component={SearchField} />
      <LocalisedField useShortLabel name="dateOfBirth" component={DateField} />
      <Spacer />

      <LocalisedField
        defaultLabel="Home village"
        name="homeVillage"
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <LocalisedField
        defaultLabel="Currently in"
        name="currentlyIn"
        component={AutocompleteField}
        suggester={
          programRegistry && programRegistry.currentlyAt === 'village'
            ? villageSuggester
            : facilitySuggester
        }
      />
      <LocalisedField
        defaultLabel="Condition"
        name="programRegistryCondition"
        component={AutocompleteField}
        suggester={programRegistryConditionSuggester}
      />
      <LocalisedField
        defaultLabel="Status"
        name="clinicalStatus"
        component={AutocompleteField}
        suggester={programRegistryStatusSuggester}
      />
    </CustomisableSearchBar>
  );
};
