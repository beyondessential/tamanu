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
      component: TranslatedSelectField,
      enumValues: PLACE_OF_BIRTH_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.registeredBirthPlace.label"
          fallback="Place of birth"
        />
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
        />
      ),
    },
    attendantAtBirth: {
      component: TranslatedSelectField,
      enumValues: ATTENDANT_OF_BIRTH_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.attendantAtBirth.label"
          fallback="Attendant at birth"
        />
      ),
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
      component: TranslatedSelectField,
      enumValues: BIRTH_DELIVERY_TYPE_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthDeliveryType.label"
          fallback="Delivery type"
        />
      ),
    },
    birthType: {
      component: TranslatedSelectField,
      enumValues: BIRTH_TYPE_LABELS,
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
    <ConfiguredMandatoryPatientFields fields={BIRTH_FIELDS} filterByMandatory={filterByMandatory} />
  );
};
