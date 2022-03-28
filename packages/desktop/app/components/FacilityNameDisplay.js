import React from 'react';
import { useFacility } from '../contexts/Facility';

export const FacilityNameDisplay = () => {
  const facilityInfo = useFacility();
  const name = facilityInfo.name;
  return <div>{name}</div>;
};
