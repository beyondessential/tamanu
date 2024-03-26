import React from 'react';
import { useAddressHierarchyQuery } from '../../api/queries';

// Todo: Create new component
// @see https://linear.app/bes/issue/NASS-1151/cascading-entity-hierarchy-select-component
export const AddressHierarchyField = () => {
  const { data: locationTypes, isLoading } = useAddressHierarchyQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>AddressHierarchyField</div>
      {locationTypes.map(locationType => {
        return <div key={locationType.id}>{locationType.name}</div>;
      })}
    </div>
  );
};
