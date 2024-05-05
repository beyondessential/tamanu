import React from 'react';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { StyledView } from '/styled/common';
import { TranslatedText } from './Translations/TranslatedText';
import { useBackendEffect } from '~/ui/hooks';

export const REFERENCE_TYPES = {
  VILLAGE: 'village',
  COUNTRY: 'country',
  DIVISION: 'division',
  SUBDIVISION: 'subdivision',
  SETTLEMENT: 'settlement',
  CATCHMENT: 'catchment',
};

const LOCATION_HIERARCHY_FIELDS = [
  {
    name: 'divisionId',
    referenceType: REFERENCE_TYPES.DIVISION,
    label: <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />,
  },
  {
    name: 'subdivisionId',
    referenceType: REFERENCE_TYPES.SUBDIVISION,
    label: <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />,
  },
  {
    name: 'settlementId',
    referenceType: REFERENCE_TYPES.SETTLEMENT,
    label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
  },
  {
    name: 'villageId',
    referenceType: REFERENCE_TYPES.VILLAGE,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

export const REFERENCE_DATA_RELATION_TYPES = {
  ADDRESS_HIERARCHY: 'address_hierarchy',
  FACILITY_CATCHMENT: 'facility_catchment',
};

const useAddressHierarchy = (baseLevel = REFERENCE_TYPES.VILLAGE) => {
  const [configuredFieldTypes, error, loading] = useBackendEffect(async ({ models }) => {
    const entity = await models.ReferenceData.getNode({
      id: 'village-Tai', // Todo: remove this filter once good data is loaded
      type: baseLevel,
    });
    if (!entity) {
      return [];
    }
    const ancestors = await entity.getAncestors();
    return ancestors.map(entity => entity.type).reverse();
  });

  if (error || loading) {
    return [];
  }

  return configuredFieldTypes.length > 0
    ? LOCATION_HIERARCHY_FIELDS.filter(f => configuredFieldTypes.includes(f.referenceType))
    : [LOCATION_HIERARCHY_FIELDS.find(f => f.referenceType === baseLevel)];
};

export const HierarchyFields = ({
  baseLevel = REFERENCE_TYPES.VILLAGE,
  relationType = REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
}) => {
  const { values } = useFormikContext();
  const hierarchyFields = useAddressHierarchy(baseLevel);

  return (
    <StyledView>
      {hierarchyFields.map(({ label, name, referenceType }, index) => {
        const parentFieldData = hierarchyFields[index - 1];
        const parentId = get(values, parentFieldData?.name);

        return (
          <HierarchyFieldItem
            key={name}
            relationType={relationType}
            isFirstLevel={index === 0}
            parentId={parentId}
            name={name}
            label={label}
            referenceType={referenceType}
          />
        );
      })}
    </StyledView>
  );
};
