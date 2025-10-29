import React from 'react';
import styled from 'styled-components';
import { useHierarchyTypesQuery } from '../../api/queries';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

const Container = styled(FormGrid)`
  grid-column: 1 / 3;
  border-bottom: 1px solid ${Colors.outline};
  padding-bottom: 1.2rem;
`;

export const HierarchyFields = ({ fields, leafNodeType, relationType }) => {
  const { values } = useFormikContext();
  const { data: hierarchyTypes = [] } = useHierarchyTypesQuery({ leafNodeType, relationType });
  const configuredFields = hierarchyTypes.filter((type) =>
    fields.find((f) => f.referenceType === type),
  );
  const hierarchyToShow = configuredFields.length > 0 ? configuredFields : [leafNodeType];

  if (fields.length === 0) return null;

  return (
    <Container data-testid="container-bmjc">
      {hierarchyToShow.map((type, index) => {
        const fieldData = fields.find((f) => f.referenceType === type);
        const parentFieldData = fields.find((f) => f.referenceType === hierarchyToShow[index - 1]);
        const parentId = get(values, parentFieldData?.name);

        return (
          <HierarchyFieldItem
            key={fieldData?.name}
            relationType={relationType}
            isFirstLevel={index === 0}
            parentId={parentId}
            fieldData={fieldData}
            data-testid={`hierarchyfielditem-ybp2-${type}`}
          />
        );
      })}
    </Container>
  );
};
