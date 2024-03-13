import React from 'react';
import { useHierarchyTypesQuery } from '../../api/queries';
import HierarchyFieldItem from './HierarchyFieldItem';
import { useFormikContext } from 'formik';
import { get } from 'lodash';

const HierarchyFields = ({ fields, baseLevel, relationType }) => {
  const { values } = useFormikContext();
  const { data } = useHierarchyTypesQuery({ baseLevel, relationType });

  const hierarchyToShow = data?.filter(type => fields.find(f => f.referenceType === type));

  if (!hierarchyToShow?.length) return null;

  return (
    <>
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
    </>
  );
};

export default HierarchyFields;
