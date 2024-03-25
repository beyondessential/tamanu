import React from 'react';
import { Typography } from '@material-ui/core';
import { Colors } from '../constants';
import { TranslatedReferenceData } from './Translation';

export const LocationCell = ({
  locationName,
  locationId,
  plannedLocationName,
  style,
  category = 'location',
}) => {
  // TODO: get this working with location group and location. maybe just duplicate logic
  return (
    <div style={{ minWidth: 100, ...style }}>
      {locationId ? (
        <TranslatedReferenceData value={locationId} fallback={locationName} category={category} />
      ) : (
        locationName
      )}
      {plannedLocationName && (
        <Typography style={{ fontSize: 12, color: Colors.darkText }}>
          (Planned - {plannedLocationName})
        </Typography>
      )}
    </div>
  );
};

export const LocationGroupCell = ({ locationGroupName, plannedLocationGroupName }) => (
  <LocationCell
    locationName={locationGroupName}
    plannedLocationName={plannedLocationGroupName}
    style={{ minWidth: 100 }}
  />
);
