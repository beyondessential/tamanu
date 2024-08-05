import React from 'react';
import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { PatientField } from '../../../PatientFields';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useLocalisation } from '../../../../../contexts/Localisation';
import { useSuggester } from '../../../../../api';

const NATIONAL_ID_DEFINITION_ID = 'fieldDefinition-nationalId';
const ID_POOR_CARD_NUMBER_DEFINITION_ID = 'fieldDefinition-idPoorCardNumber';
const PMRS_NUMBER_DEFINITION_ID = 'fieldDefinition-pmrsNumber';

export const CambodiaIdentificationFields = ({ filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const insurerSuggester = useSuggester('insurer');
  const enablePatientInsurer = getLocalisation('features.enablePatientInsurer');

  const IDENTIFICATION_FIELDS = {
    birthCertificate: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthCertificate.label"
          fallback="Birth certificate number"
        />
      ),
    },
    passport: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.passport.label"
          fallback="Passport number"
        />
      ),
    },
    insurerId: {
      component: AutocompleteField,
      suggester: insurerSuggester,
      label: <TranslatedText stringId="general.localisedField.insurer.label" fallback="Insurer" />,
      condition: () => !!enablePatientInsurer,
    },
    insurerPolicyNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurerPolicyNumber.label"
          fallback="Insurance policy number"
        />
      ),
      condition: () => !!enablePatientInsurer,
    },
  };

  return (
    <>
      <ConfiguredMandatoryPatientFields
        fields={IDENTIFICATION_FIELDS}
        filterByMandatory={filterByMandatory}
      />
      <PatientField
        definition={{
          name: (
            <TranslatedText
              stringId="cambodiaPatientDetails.nationalId.label"
              fallback="National ID"
            />
          ),
          definitionId: NATIONAL_ID_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
      <PatientField
        definition={{
          name: (
            <TranslatedText
              stringId="cambodiaPatientDetails.idPoorCardNumber.label"
              fallback="ID Poor Card Number"
            />
          ),
          definitionId: ID_POOR_CARD_NUMBER_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
      <PatientField
        definition={{
          name: (
            <TranslatedText
              stringId="cambodiaPatientDetails.pmrsNumber.label"
              fallback="PMRS Number"
            />
          ),
          definitionId: PMRS_NUMBER_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
    </>
  );
};
