import React from 'react';

import { PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';
import { AutocompleteField, SelectField, TextField, TimeField } from '..';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
} from '../../constants';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

export const BirthDetailsFields = ({ registeredBirthPlace, showMandatory }) => {
  const facilitySuggester = useSuggester('facility');

  const BIRTH_DETAILS_FIELDS_PROPS = {
    timeOfBirth: {
      component: TimeField,
      saveDateAsString: true,
    },
    gestationalAgeEstimate: {
      component: TextField,
      saveDateAsString: true,
      type: 'number',
    },
    registeredBirthPlace: {
      component: SelectField,
      options: PLACE_OF_BIRTH_OPTIONS,
    },
    birthFacilityId: {
      component: AutocompleteField,
      suggester: facilitySuggester,
      condition: () => registeredBirthPlace === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
    },
    attendantAtBirth: {
      component: SelectField,
      options: ATTENDANT_OF_BIRTH_OPTIONS,
    },
    nameOfAttendantAtBirth: {
      component: TextField,
      type: 'text',
    },
    birthDeliveryType: {
      component: SelectField,
      options: BIRTH_DELIVERY_TYPE_OPTIONS,
    },
    birthType: {
      component: SelectField,
      options: BIRTH_TYPE_OPTIONS,
    },
    birthWeight: {
      component: TextField,
      type: 'number',
    },
    birthLength: {
      component: TextField,
      type: 'number',
    },
    apgarScoreOneMinute: {
      component: TextField,
      type: 'number',
    },
    apgarScoreFiveMinutes: {
      component: TextField,
      type: 'number',
    },
    apgarScoreTenMinutes: {
      component: TextField,
      type: 'number',
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={BIRTH_DETAILS_FIELDS_PROPS}
      showMandatory={showMandatory}
    />
  );
};
