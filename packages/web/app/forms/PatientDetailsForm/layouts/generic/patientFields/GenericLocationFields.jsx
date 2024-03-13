import React from 'react';
import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';

import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useFilterPatientFields } from '../../../useFilterPatientFields';
import { REFERENCE_DATA_RELATION_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import HierarchyFields from '../../../../../components/Field/HierarchyFields';

export const GenericLocationFields = ({ filterByMandatory }) => {
  const LOCATION_FIELDS = {
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
        />
      ),
    },
    cityTown: {
      component: TextField,
      label: (
        <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />
      ),
    },
  };

  const LOCATION_HIERARCHY_FIELDS = {
    countryId: {
      referenceType: REFERENCE_TYPES.COUNTRY,
      label: (
        <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />
      ),
    },
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
    medicalAreaId: {
      referenceType: REFERENCE_TYPES.MEDICAL_AREA,
      label: (
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Medical area"
        />
      ),
    },
    nursingZoneId: {
      referenceType: REFERENCE_TYPES.NURSING_ZONE,
      label: (
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Nursing zone"
        />
      ),
    },
  };

  const { fieldsToShow: locationHierarchyFieldsToShow } = useFilterPatientFields({
    fields: LOCATION_HIERARCHY_FIELDS,
    filterByMandatory,
  });

  return (
    <>
      <ConfiguredMandatoryPatientFields
        fields={LOCATION_FIELDS}
        filterByMandatory={filterByMandatory}
      />
      <HierarchyFields
        relationType={REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY}
        baseLevel={REFERENCE_TYPES.NURSING_ZONE}
        fields={locationHierarchyFieldsToShow}
      />
    </>
  );
};
