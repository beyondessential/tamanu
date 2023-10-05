import React from 'react';

import { PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';

import { AutocompleteField, LocalisedField, SelectField, TextField, TimeField } from '..';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
} from '../../constants';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

export const BirthDetailsFields = ({ showMandatory }) => {
  const facilitySuggester = useSuggester('facility');

  const BIRTH_DETAILS_FIELDS_PROPS = {
    timeOfBirth: {
      component: TimeField,
      saveDateAsString: true,
    },
    gestationalAgeEstimate: {
      component: TimeField,
      saveDateAsString: true,
    },
    registeredBirthPlace: {
      component: SelectField,
      options: PLACE_OF_BIRTH_OPTIONS,
    },
    birthFacilityId: {
      component: AutocompleteField,
      suggester: facilitySuggester,
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

export const BirthDetailsFields2 = ({ values }) => {
  return (
    <>
      <LocalisedField name="timeOfBirth" component={TimeField} saveDateAsString />
      <LocalisedField name="gestationalAgeEstimate" component={TextField} type="number" />
      <LocalisedField
        name="registeredBirthPlace"
        component={SelectField}
        options={PLACE_OF_BIRTH_OPTIONS}
      />
      {values.registeredBirthPlace === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY && (
        <LocalisedField
          name="birthFacilityId"
          component={AutocompleteField}
          suggester={facilitySuggester}
        />
      )}
      <LocalisedField
        name="attendantAtBirth"
        component={SelectField}
        options={ATTENDANT_OF_BIRTH_OPTIONS}
      />
      <LocalisedField name="nameOfAttendantAtBirth" component={TextField} type="text" />
      <LocalisedField
        name="birthDeliveryType"
        component={SelectField}
        options={BIRTH_DELIVERY_TYPE_OPTIONS}
      />
      <LocalisedField name="birthType" component={SelectField} options={BIRTH_TYPE_OPTIONS} />
      <LocalisedField name="birthWeight" component={TextField} type="number" />
      <LocalisedField name="birthLength" component={TextField} type="number" />
      <LocalisedField name="apgarScoreOneMinute" component={TextField} type="number" />
      <LocalisedField name="apgarScoreFiveMinutes" component={TextField} type="number" />
      <LocalisedField name="apgarScoreTenMinutes" component={TextField} type="number" />
    </>
  );
};
