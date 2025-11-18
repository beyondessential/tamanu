import React from 'react';
import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import {
  AutocompleteInput,
  TextButton,
  TranslatedEnumField,
  TranslatedText,
  useSuggester,
  SelectInput,
} from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { PatientSearchKeys, usePatientSearch } from '../contexts/PatientSearch.jsx';

const StyledFieldWrapper = styled(Box)`
  width: 150px;
  & .label-field {
    font-size: 12px;
    font-weight: 500;
  }
`;

const Container = styled(Box)`
  display: flex;
  padding-top: 5px;
  padding-bottom: 5px;
  gap: 5px;
`;

const ClearButton = styled(TextButton)`
  text-decoration: none;
  align-self: center;
  margin-bottom: 15px;
  font-size: 12px;
`;

export const PatientHistorySearch = () => {
  const { searchParameters = {}, setSearchParameters } = usePatientSearch(PatientSearchKeys.PatientHistory);
  const facilitySuggester = useSuggester('facility', { baseQueryParameters: { noLimit: true } });
  const dischargingClinicianSuggester = useSuggester('practitioner');

  const handleChange = fieldName => event => {
    setSearchParameters({
      ...searchParameters,
      [fieldName]: event.target.value || undefined,
    })
  };

  const handleClear = () => {
    setSearchParameters({});
  };

  return (
    <Container>
      <StyledFieldWrapper>
        <TranslatedEnumField
          component={SelectInput}
          name="encounterType"
          value={searchParameters.encounterType || ''}
          onChange={handleChange('encounterType')}
          label={<TranslatedText stringId="general.type.label" fallback="Type" />}
          enumValues={ENCOUNTER_TYPE_LABELS}
        />
      </StyledFieldWrapper>
      <StyledFieldWrapper>
        <AutocompleteInput
          name="facilityId"
          value={searchParameters.facilityId || ''}
          onChange={handleChange('facilityId')}
          label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
          suggester={facilitySuggester}
        />
      </StyledFieldWrapper>
      <StyledFieldWrapper>
        <AutocompleteInput
          name="dischargingClinicianId"
          value={searchParameters.dischargingClinicianId || ''}
          onChange={handleChange('dischargingClinicianId')}
          label={
            <TranslatedText
              stringId="general.dischargingClinician.label"
              fallback="Discharging :clinician"
              replacements={{
                clinician: (
                  <TranslatedText
                    casing="lower"
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                  />
                ),
              }}
            />
          }
          suggester={dischargingClinicianSuggester}
        />
      </StyledFieldWrapper>
      <Box display="flex" flexDirection="column" justifyContent="flex-end">
        <ClearButton onClick={handleClear} size="small" data-testid="clearbutton-esac">
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </ClearButton>
      </Box>
    </Container>
  );
};
