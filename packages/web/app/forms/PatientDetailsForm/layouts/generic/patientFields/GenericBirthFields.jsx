import React from 'react';

import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';
import { AutocompleteField, SelectField, TextField, TimeField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';

export const GenericBirthFields = ({ registeredBirthPlace, showMandatory, facilitySuggester }) => {
  const BIRTH_FIELDS = {
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
      fields={BIRTH_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
