import React from 'react';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { StyledView } from '/styled/common';
import { useBackendEffect } from '~/ui/hooks';
import { ReferenceDataType, ReferenceDataRelationType } from '~/types';

interface LocationHierarchyField {
  name: string;
  referenceType: ReferenceDataType;
  label: JSX.Element;
}

const useAddressHierarchy = (fields: LocationHierarchyField[], leafNodeType: ReferenceDataType) => {
  const [heirarchy, error, loading] = useBackendEffect(async ({ models }) => {
    // choose any single entity from the leaf node level of the hierarchy
    // then get its ancestors - that will serve as an example that gives us
    // the types used at each level of this hierarchy
    const entity = await models.ReferenceData.getNode({
      type: leafNodeType,
    });
    const ancestors = await entity?.getAncestors();
    return [...ancestors, entity]
  });

  const configuredFieldTypes =
    error || loading || !heirarchy
      ? [leafNodeType] // If there is an error, or nothing is configured just display the bottom level field
      : heirarchy.map(entity => entity.type).reverse();
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
