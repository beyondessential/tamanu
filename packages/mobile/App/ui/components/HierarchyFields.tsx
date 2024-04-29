import React from 'react';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { StyledView } from '/styled/common';
import { TranslatedText } from './Translations/TranslatedText';

export const REFERENCE_TYPES = {
  VILLAGE: 'village',
  COUNTRY: 'country',
  DIVISION: 'division',
  SUBDIVISION: 'subdivision',
  SETTLEMENT: 'settlement',
  CATCHMENT: 'catchment',
};

const LOCATION_HIERARCHY_FIELDS = {
  divisionId: {
    referenceType: REFERENCE_TYPES.DIVISION,
    label: <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />,
  },
  subdivisionId: {
    referenceType: REFERENCE_TYPES.SUBDIVISION,
    label: <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />,
  },
  settlementId: {
    referenceType: REFERENCE_TYPES.SETTLEMENT,
    label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
  },
  villageId: {
    referenceType: REFERENCE_TYPES.VILLAGE,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
};

export const REFERENCE_DATA_RELATION_TYPES = {
  ADDRESS_HIERARCHY: 'address_hierarchy',
  FACILITY_CATCHMENT: 'facility_catchment',
};

export const HierarchyFields = ({
  baseLevel = REFERENCE_TYPES.VILLAGE,
  relationType = REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
}) => {
  const { values } = useFormikContext();
  const configuredFields = Object.values(LOCATION_HIERARCHY_FIELDS).map(f => f.referenceType);
  const fields = configuredFields;
  const hierarchyToShow = configuredFields.length > 0 ? configuredFields : [baseLevel];

  return (
    <StyledView>
      {hierarchyToShow.map((type, index) => {
        const fieldData = fields.find(f => f.referenceType === type);
        const parentFieldData = fields.find(f => f.referenceType === hierarchyToShow[index - 1]);
        const parentId = get(values, parentFieldData?.name);

        return (
          <HierarchyFieldItem
            key={type}
            relationType={relationType}
            isFirstLevel={index === 0}
            parentId={parentId}
            fieldData={fieldData}
          />
        );
      })}
    </StyledView>
  );
};
