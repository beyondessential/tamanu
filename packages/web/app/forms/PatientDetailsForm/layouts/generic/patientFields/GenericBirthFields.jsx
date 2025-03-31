import React from 'react';

import {
  ATTENDANT_OF_BIRTH_LABELS,
  BIRTH_DELIVERY_TYPE_LABELS,
  BIRTH_TYPE_LABELS,
  PLACE_OF_BIRTH_LABELS,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';
import {
  AutocompleteField,
  TextField,
  TimeField,
  TranslatedSelectField,
} from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericBirthFields = ({ filterByMandatory, registeredBirthPlace }) => {
  const facilitySuggester = useSuggester('facility');
  const BIRTH_FIELDS = {
    timeOfBirth: {
      component: TimeField,
      saveDateAsString: true,
      label: (
        <TranslatedText
          stringId="general.localisedField.timeOfBirth.label"
          fallback="Time of birth"
          data-test-id='translatedtext-i0yn' />
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
          data-test-id='translatedtext-t2y3' />
      ),
    },
    registeredBirthPlace: {
      component: TranslatedSelectField,
      enumValues: PLACE_OF_BIRTH_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.registeredBirthPlace.label"
          fallback="Place of birth"
          data-test-id='translatedtext-f8ow' />
      ),
    },
    birthFacilityId: {
      component: AutocompleteField,
      suggester: facilitySuggester,
      condition: () => registeredBirthPlace === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthFacilityId.label"
          fallback="Name of health facility (if applicable)"
          data-test-id='translatedtext-mpdy' />
      ),
    },
    attendantAtBirth: {
      component: TranslatedSelectField,
      enumValues: ATTENDANT_OF_BIRTH_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.attendantAtBirth.label"
          fallback="Attendant at birth"
          data-test-id='translatedtext-w7ws' />
      ),
    },
    nameOfAttendantAtBirth: {
      component: TextField,
      type: 'text',
      label: (
        <TranslatedText
          stringId="general.localisedField.nameOfAttendantAtBirth.label"
          fallback="Name of attendant"
          data-test-id='translatedtext-tsp0' />
      ),
    },
    birthDeliveryType: {
      component: TranslatedSelectField,
      enumValues: BIRTH_DELIVERY_TYPE_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthDeliveryType.label"
          fallback="Delivery type"
          data-test-id='translatedtext-h3fq' />
      ),
    },
    birthType: {
      component: TranslatedSelectField,
      enumValues: BIRTH_TYPE_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthType.label"
          fallback="Single/Plural birth"
          data-test-id='translatedtext-d559' />
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
          data-test-id='translatedtext-m1p7' />
      ),
    },
    birthLength: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.birthLength.label"
          fallback="Birth length (cm)"
          data-test-id='translatedtext-43e7' />
      ),
    },
    apgarScoreOneMinute: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreOneMinute.label"
          fallback="Apgar score at 1 min"
          data-test-id='translatedtext-2ecy' />
      ),
    },
    apgarScoreFiveMinutes: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreFiveMinutes.label"
          fallback="Apgar score at 5 min"
          data-test-id='translatedtext-14pp' />
      ),
    },
    apgarScoreTenMinutes: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.apgarScoreTenMinutes.label"
          fallback="Apgar score at 10 min"
          data-test-id='translatedtext-fajh' />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields fields={BIRTH_FIELDS} filterByMandatory={filterByMandatory} />
  );
};
