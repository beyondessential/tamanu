import React from 'react';
import { useAddressHierarchy } from '../../api/queries';

export const AddressHierarchyField = () => {
  const { data: locationTypes, isLoading } = useAddressHierarchy();
  console.log('data', locationTypes);

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
