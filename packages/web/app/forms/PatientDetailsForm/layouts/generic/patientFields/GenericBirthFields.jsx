import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';

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

const extractTime = value => (value.includes('T') ? value.split('T')[1] : value);

export const GenericBirthFields = ({ filterByMandatory, registeredBirthPlace }) => {
  const facilitySuggester = useSuggester('facility');
  const { values, setFieldValue } = useFormikContext();
  const { dateOfBirth, timeOfBirth } = values;
  const date = dateOfBirth?.slice(0, 10);

  /**
   * Keeps timeOfBirth in sync with dateOfBirth so the stored value is a full
   * datetime string (required by dateTimeType on the model). Without this,
   * TimeField emits a time-only string ("HH:mm:ss") which the server rejects.
   * Also strips the date prefix back to a bare time when dateOfBirth is cleared.
   */
  useEffect(() => {
    if (!date) {
      if (timeOfBirth?.includes('T')) {
        setFieldValue('timeOfBirth', extractTime(timeOfBirth));
      }
      return;
    }
    if (!timeOfBirth) return;
    const timePart = extractTime(timeOfBirth);
    if (!timePart) return;
    const expected = `${date}T${timePart}`;
    if (timeOfBirth !== expected) {
      setFieldValue('timeOfBirth', expected);
    }
  }, [date, timeOfBirth, setFieldValue]);

  const BIRTH_FIELDS = {
    timeOfBirth: {
      component: TimeField,
      label: (
        <TranslatedText
          stringId="general.localisedField.timeOfBirth.label"
          fallback="Time of birth"
          data-testid="translatedtext-ji7u"
        />
      ),
    },
    gestationalAgeEstimate: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.gestationalAgeEstimate.label"
          fallback="Gestational age (weeks)"
          data-testid="translatedtext-9vhb"
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
          data-testid="translatedtext-yzpn"
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
          data-testid="translatedtext-dwju"
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
          data-testid="translatedtext-m4fi"
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
          data-testid="translatedtext-zlcg"
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
          data-testid="translatedtext-jj08"
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
          data-testid="translatedtext-f37p"
        />
      ),
      prefix: 'localisedField.property.birthType',
    },
    birthOrder: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.birthOrder.label"
          fallback="Birth order"
          data-testid="translatedtext-f37p"
        />
      ),
    },
    birthWeight: {
      component: TextField,
      type: 'number',
      label: (
        <TranslatedText
          stringId="general.localisedField.birthWeight.label"
          fallback="Birth weight (kg)"
          data-testid="translatedtext-qbv4"
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
          data-testid="translatedtext-cx9n"
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
          data-testid="translatedtext-f0zx"
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
          data-testid="translatedtext-80p2"
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
          data-testid="translatedtext-gr51"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={BIRTH_FIELDS}
      filterByMandatory={filterByMandatory}
      data-testid="configuredmandatorypatientfields-dsxk"
    />
  );
};
