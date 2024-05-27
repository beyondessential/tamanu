import React from 'react';
import styled from 'styled-components';
import { useHierarchyTypesQuery } from '../../api/queries';
import { HierarchyFieldItem } from './HierarchyFieldItem';
import { Colors } from '../../constants';
import { useFormikContext } from 'formik';
import { get } from 'lodash';
import { FormGrid } from '../FormGrid';

const Container = styled(FormGrid)`
  grid-column: 1 / 3;
  border-bottom: 1px solid ${Colors.outline};
  padding-bottom: 1.2rem;
`;

export const HierarchyFields = ({ fields, leafNodeType, relationType }) => {
  const { values } = useFormikContext();
  const { data = [] } = useHierarchyTypesQuery({ leafNodeType, relationType });
  const configuredFields = data.filter(type => fields.find(f => f.referenceType === type));
  const hierarchyToShow = configuredFields.length > 0 ? configuredFields : [leafNodeType];

  return (
    <Container>
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
    </Container>
  );
};
