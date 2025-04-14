import React from 'react';
import { AutocompleteField, HierarchyFields, TextField } from '../../../../../components';
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
        <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />
      ),
    },
    ...(isUsingLocationHierarchy
      ? {}
      : {
          subdivisionId: {
            component: AutocompleteField,
            suggester: subdivisionSuggester,
            label: (
              <TranslatedText
                stringId="general.localisedField.subdivisionId.label"
                fallback="Sub division"
              />
            ),
          },
          divisionId: {
            component: AutocompleteField,
            suggester: divisionSuggester,
            label: (
              <TranslatedText
                stringId="general.localisedField.divisionId.label"
                fallback="Division"
              />
            ),
          },
        }),
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />
      ),
    },
    ...(isUsingLocationHierarchy
      ? {}
      : {
          settlementId: {
            component: AutocompleteField,
            suggester: settlementSuggester,
            label: (
              <TranslatedText
                stringId="general.localisedField.settlementId.label"
                fallback="Settlement"
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
        />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
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
      />
    </>
  );
};
