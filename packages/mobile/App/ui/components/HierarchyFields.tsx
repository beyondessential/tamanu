import React from 'react';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { StyledView } from '/styled/common';
import { useBackendEffect } from '~/ui/hooks';
import { ReferenceDataType, ReferenceDataRelationType } from '~/types';
import { theme } from '../styled/theme';
import styled from 'styled-components';

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
    // choose any single entity from the leaf node level of the hierarchy
    // then get its ancestors - that will serve as an example that gives us
    // the types used at each level of this hierarchy
    // const entity = await models.ReferenceData.getNode({
    //   type: leafNodeType,
    // });

    const entity = await models.ReferenceData.getAnyOfType(leafNodeType);

    console.log('entity', entity);
    const ancestors = await entity?.getAncestors();
    return [...ancestors, entity];
  });

  const configuredFieldTypes =
    error || loading || !hierarchy
      ? [leafNodeType] // If there is an error, or nothing is configured just display the bottom level field
      : hierarchy.map((entity) => entity.type);

  console.log('error', error);
  return fields.filter((f) => configuredFieldTypes.includes(f.referenceType));
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
