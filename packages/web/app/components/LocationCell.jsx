import React from 'react';
import { Typography } from '@material-ui/core';
import { Colors } from '../constants';
import { TranslatedReferenceData } from './Translation';

export const LocationCell = ({
  locationName,
  locationId,
  plannedLocationName,
  plannedLocationId,
  style,
  category = 'location',
}) => {
  return (
    <div style={{ minWidth: 100, ...style }}>
      {locationId ? (
        <TranslatedReferenceData value={locationId} fallback={locationName} category={category} />
      ) : (
        locationName
      )}
      {plannedLocationName && (
        <Typography style={{ fontSize: 12, color: Colors.darkText }}>
          (Planned -{' '}
          {
            <TranslatedReferenceData
              value={plannedLocationId}
              fallback={plannedLocationName}
              category={category}
            />
          }
          )
        </Typography>
      )}
    </div>
  );
};

export const LocationGroupCell = ({
  locationGroupName,
  locationGroupId,
  plannedLocationGroupName,
  plannedLocationGroupId,
  style,
}) => {
  return (
    <LocationCell
      locationName={locationGroupName}
      locationId={locationGroupId}
      plannedLocationName={plannedLocationGroupName}
      plannedLocationId={plannedLocationGroupId}
      category="locationGroup"
      style={style}
    />
  );
};
