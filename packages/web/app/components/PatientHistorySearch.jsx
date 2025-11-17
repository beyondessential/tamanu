import React, { useEffect } from 'react';
import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import {
  AutocompleteField,
  Field,
  Form,
  TextButton,
  TranslatedSelectField,
  TranslatedText,
  useSuggester,
} from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { usePatientSearchParameters } from '../contexts/PatientViewSearchParameters';

const StyledField = styled(Field)`
  width: 150px;
  & .label-field {
    font-size: 12px;
    font-weight: 500;
  }
`;

const Container = styled(Box)`
  display: flex;
  padding-top: 2px;
  padding-bottom: 5px;
  gap: 5px;
`;

const ClearButton = styled(TextButton)`
  text-decoration: none;
  align-self: center;
  margin-bottom: 15px;
  font-size: 12px;
`;

const SearchForm = ({ values, clearForm  }) => {
  const { setPatientHistoryParameters } = usePatientSearchParameters();
  const facilitySuggester = useSuggester('facility', { baseQueryParameters: { noLimit: true } });
  const dischargingClinicianSuggester = useSuggester('practitioner');


  useEffect(() => {
     setPatientHistoryParameters(values);
  }, [setPatientHistoryParameters, values]);

  return (
    <Container>
      <TranslatedSelectField
        name="encounterType"
        label={<TranslatedText stringId="general.type.label" fallback="Type" />}
        enumValues={ENCOUNTER_TYPE_LABELS}
      />
      <AutocompleteField
        name="facility"
        label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
        suggester={facilitySuggester}
      />
      <StyledField
        name="dischargingClinician"
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
      <Box display="flex" flexDirection="column" justifyContent="flex-end">
        <ClearButton
          onClick={() => {
            clearForm();
          }}
          size="small"
          data-testid="clearbutton-esac"
        >
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </ClearButton>
      </Box>
    </Container>
  );
};

export const PatientHistorySearch = () => {
  return (
    // TODO ditch formik likely?
    <Form
      initialValues={{
        encounterType: null,
        facility: null,
        dischargingClinician: null,
      }}
      onSubmit={async () => {}}
      render={props => <SearchForm {...props} />}
    />
  );
};
