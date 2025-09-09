import React from 'react';
import { Typography } from '@mui/material';
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
        <TranslatedReferenceData
          value={locationId}
          fallback={locationName}
          category={category}
          data-testid="translatedreferencedata-ne0n"
        />
      ) : (
        locationName
      )}
      {plannedLocationName && (
        <Typography style={{ fontSize: 12, color: Colors.darkText }} data-testid="typography-nnh6">
          (Planned -{' '}
          {
            <TranslatedReferenceData
              value={plannedLocationId}
              fallback={plannedLocationName}
              category={category}
              data-testid="translatedreferencedata-cvff"
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
      data-testid="locationcell-dk36"
    />
  );
};
