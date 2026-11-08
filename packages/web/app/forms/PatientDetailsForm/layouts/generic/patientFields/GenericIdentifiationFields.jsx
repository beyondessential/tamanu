import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { AutocompleteField, DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useSettings } from '../../../../../contexts/Settings';

export const GenericIdentificationFields = ({
  isEdit,
  patientRegistryType,
  filterByMandatory,
  heading,
  headingTestId,
  gridTestId,
}) => {
  const { getSetting } = useSettings();
  const insurerSuggester = useSuggester('insurer');
  const canEditDisplayId = isEdit && getSetting('features.editPatientDisplayId');
  const enablePatientInsurer = getSetting('features.enablePatientInsurer');

  const IDENTIFICATION_FIELDS = {
    displayId: {
      component: DisplayIdField,
      condition: () => !!canEditDisplayId,
    },
    birthCertificate: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthCertificate.label"
          fallback="Birth certificate"
          data-testid="translatedtext-3f67"
        />
      ),
    },
    insurerId: {
      component: AutocompleteField,
      suggester: insurerSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurer.label"
          fallback="Insurer"
          data-testid="translatedtext-b91c"
        />
      ),
      condition: () => !!enablePatientInsurer,
    },
    drivingLicense: {
      component: TextField,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.drivingLicense.label"
          fallback="Driving license"
          data-testid="translatedtext-pcri"
        />
      ),
    },
    passport: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.passport.label"
          fallback="Passport number"
          data-testid="translatedtext-nmaa"
        />
      ),
    },
    adoptionNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.adoptionNumber.label"
          fallback="Adoption number"
        />
      ),
    },
    marriageLicence: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.marriageLicence.label"
          fallback="Marriage licence"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={IDENTIFICATION_FIELDS}
      filterByMandatory={filterByMandatory}
      heading={heading}
      headingTestId={headingTestId}
      gridTestId={gridTestId}
      data-testid="configuredmandatorypatientfields-y6v9"
    />
  );
};
