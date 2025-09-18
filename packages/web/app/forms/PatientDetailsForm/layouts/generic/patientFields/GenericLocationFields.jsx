import React from 'react';
import { TextField } from '@tamanu/ui-components';
import { AutocompleteField, HierarchyFields } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';

import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { REFERENCE_DATA_RELATION_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { useFilterPatientFields } from '../../../useFilterPatientFields';
import { useSettings } from '../../../../../contexts/Settings';

export const GenericLocationFields = ({ filterByMandatory }) => {
  const { getSetting } = useSettings();

  const isUsingLocationHierarchy = getSetting('features.patientDetailsLocationHierarchy');

  const subdivisionSuggester = useSuggester('subdivision');
  const divisionSuggester = useSuggester('division');
  const settlementSuggester = useSuggester('settlement');
  const countrySuggester = useSuggester('country');
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nursingZoneSuggester = useSuggester('nursingZone');

  const LOCATION_FIELDS = {
    cityTown: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.cityTown.label"
          fallback="City/town"
          data-testid="translatedtext-mhce"
        />
      ),
    },
    ...(!isUsingLocationHierarchy && {
      subdivisionId: {
        component: AutocompleteField,
        suggester: subdivisionSuggester,
        label: (
          <TranslatedText
            stringId="general.localisedField.subdivisionId.label"
            fallback="Sub division"
            data-testid="translatedtext-mlmz"
          />
        ),
      },
      divisionId: {
        component: AutocompleteField,
        suggester: divisionSuggester,
        label: (
          <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" data-testid="translatedtext-s0p5" />
        ),
      },
    }),
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryId.label"
          fallback="Country"
          data-testid="translatedtext-k8xy"
        />
      ),
    },
    ...(!isUsingLocationHierarchy && {
      settlementId: {
        component: AutocompleteField,
        suggester: settlementSuggester,
        label: (
          <TranslatedText
            stringId="general.localisedField.settlementId.label"
            fallback="Settlement"
            data-testid="translatedtext-evid"
          />
        ),
      },
    }),
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Medical area"
          data-testid="translatedtext-73sd"
        />
      ),
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Nursing zone"
          data-testid="translatedtext-iour"
        />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
          data-testid="translatedtext-26lx"
        />
      ),
    },
  };

  const CURRENT_LOCATION_HIERARCHY_FIELDS = {
    divisionId: {
      referenceType: REFERENCE_TYPES.DIVISION,
      label: (
        <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />
      ),
    },
    subdivisionId: {
      referenceType: REFERENCE_TYPES.SUBDIVISION,
      label: (
        <TranslatedText
          stringId="general.localisedField.subdivisionId.label"
          fallback="Sub division"
        />
      ),
    },
    settlementId: {
      referenceType: REFERENCE_TYPES.SETTLEMENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.settlementId.label"
          fallback="Settlement"
        />
      ),
    },
    villageId: {
      referenceType: REFERENCE_TYPES.VILLAGE,
      label: (
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      ),
    },
  };

  const { fieldsToShow: locationHierarchyFieldsToShow } = useFilterPatientFields({
    fields: CURRENT_LOCATION_HIERARCHY_FIELDS,
    filterByMandatory,
  });

  return (
    <>
      {isUsingLocationHierarchy && (
        <HierarchyFields
          relationType={REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY}
          leafNodeType={REFERENCE_TYPES.VILLAGE}
          fields={locationHierarchyFieldsToShow}
        />
      )}
      <ConfiguredMandatoryPatientFields
        fields={LOCATION_FIELDS}
        filterByMandatory={filterByMandatory}
        data-testid="configuredmandatorypatientfields-kh6c"
      />
    </>
  );
};
