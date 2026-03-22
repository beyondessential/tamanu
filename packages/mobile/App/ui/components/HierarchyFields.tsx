import React from 'react';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import styled from 'styled-components';
import { REFERENCE_TYPES } from '@tamanu/constants';

import { StyledView } from '/styled/common';
import { useBackendEffect } from '~/ui/hooks';
import { ReferenceDataType, ReferenceDataRelationType } from '~/types';
import { theme } from '../styled/theme';

const HierarchyFieldContainer = styled(StyledView)`
  padding: 10px 8px 0 10px;
  border: 1px solid ${theme.colors.BOX_OUTLINE};
  border-radius: 3px;
  margin-bottom: 10px;
`;

interface LocationHierarchyField {
  name: string;
  referenceType: ReferenceDataType;
  label: JSX.Element;
}

const useAddressHierarchy = (fields: LocationHierarchyField[], leafNodeType: ReferenceDataType) => {
  const [hierarchy, error, loading] = useBackendEffect(async ({ models }) => {
    // pick a representative node from the requested leaf type; if not present, fall back
    // through known address types so incomplete hierarchies still render correctly
    const fallbackOrder = [
      leafNodeType,
      REFERENCE_TYPES.SETTLEMENT,
      REFERENCE_TYPES.SUBDIVISION,
      REFERENCE_TYPES.DIVISION,
    ] as ReferenceDataType[];

    let entity = null as any;
    for (const candidateType of fallbackOrder) {
      const found = await models.ReferenceData.getNode({
        type: candidateType,
      });
      if (found) {
        entity = found;
        break;
      }
    }

    if (!entity) return null;
    const ancestors = await entity.getAncestors();
    return [...ancestors, entity];
  });

  const configuredFieldTypes =
    error || loading || !hierarchy ? [leafNodeType] : hierarchy.map(entity => entity.type);
  return fields.filter(f => configuredFieldTypes.includes(f.referenceType));
};

interface HierarchyFieldsProps {
  fields: LocationHierarchyField[];
  leafNodeType?: ReferenceDataType;
  relationType?: ReferenceDataRelationType;
}

export const HierarchyFields = ({
  fields,
  leafNodeType = ReferenceDataType.Village,
  relationType = ReferenceDataRelationType.AddressHierarchy,
}: HierarchyFieldsProps) => {
  const { values } = useFormikContext();
  const hierarchyFields = useAddressHierarchy(fields, leafNodeType);

  return (
    <HierarchyFieldContainer>
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
    </HierarchyFieldContainer>
  );
};
