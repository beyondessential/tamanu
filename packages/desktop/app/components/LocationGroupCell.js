import React from 'react';
import { LocationCell } from './LocationCell';

export const LocationGroupCell = ({ locationGroupName, plannedLocationGroupName }) => (
  <LocationCell
    locationName={locationGroupName}
    plannedLocationName={plannedLocationGroupName}
    style={{ minWidth: 150 }}
  />
);
