import React from 'react';

import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';
import { AutocompleteField, TextField, TimeField } from '..';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { SelectField } from '../Translation/TranslatedSelectField.jsx';

export const BirthDetailsFields = ({ registeredBirthPlace, showMandatory }) => {
  const facilitySuggester = useSuggester('facility');

  const BIRTH_DETAILS_FIELDS_PROPS = {
    timeOfBirth: {
      component: TimeField,
      saveDateAsString: true,
      label: (
        <TranslatedText
          stringId="general.localisedField.timeOfBirth.label"
          fallback="Time of birth"
        />
      ),
    },
    gestationalAgeEstimate: {
      component: TextField,
      saveDateAsString: true,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.gestationalAgeEstimate.label"
          fallback="Gestational age (weeks)"
        />
      ),
    },
    registeredBirthPlace: {
      component: SelectField,
      options: PLACE_OF_BIRTH_OPTIONS,
      label: (
        <TranslatedText
          stringId="general.localisedField.registeredBirthPlace.label"
          fallback="Place of birth"
        />
      ),
      prefix: 'localisedField.property.registeredBirthPlace',
    },
    birthFacilityId: {
      component: AutocompleteField,
      suggester: facilitySuggester,
      condition: () => registeredBirthPlace === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthFacilityId.label"
          fallback="Name of health facility (if applicable)"
        />
      ),
    },
    attendantAtBirth: {
      component: SelectField,
      options: ATTENDANT_OF_BIRTH_OPTIONS,
      label: (
        <TranslatedText
          stringId="general.localisedField.attendantAtBirth.label"
          fallback="Attendant at birth"
        />
      ),
      prefix: 'localisedField.property.attendantAtBirth',
    },
    nameOfAttendantAtBirth: {
      component: TextField,
      type: 'text',
      label: (
        <TranslatedText
          stringId="general.localisedField.nameOfAttendantAtBirth.label"
          fallback="Name of attendant"
        />
      ),
    },
    birthDeliveryType: {
      component: SelectField,
      options: BIRTH_DELIVERY_TYPE_OPTIONS,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthDeliveryType.label"
          fallback="Delivery type"
        />
      ),
      prefix: 'localisedField.property.birthDeliveryType',
    },
    birthType: {
      component: SelectField,
      options: BIRTH_TYPE_OPTIONS,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthType.label"
          fallback="Single/Plural birth"
        />
      ),
      prefix: 'localisedField.property.birthType',
    },
    birthWeight: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.birthWeight.label"
          fallback="Birth weight (kg)"
        />
      ),
    },
    birthLength: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.birthLength.label"
          fallback="Birth length (cm)"
        />
      ),
    },
    apgarScoreOneMinute: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreOneMinute.label"
          fallback="Apgar score at 1 min"
        />
      ),
    },
    apgarScoreFiveMinutes: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreFiveMinutes.label"
          fallback="Apgar score at 5 min"
        />
      ),
    },
    apgarScoreTenMinutes: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreTenMinutes.label"
          fallback="Apgar score at 10 min"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={BIRTH_DETAILS_FIELDS_PROPS}
      showMandatory={showMandatory}
    />
  );
};
