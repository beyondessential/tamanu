import React from 'react';
import { Typography } from '@material-ui/core';
import { Colors } from '../constants';

export const LocationCell = ({ locationName, plannedLocationName, style }) => (
  <div style={{ minWidth: 180, ...style }}>
    {locationName}
    {plannedLocationName && (
      <Typography style={{ fontSize: 12, color: Colors.darkText }}>
        (Planned - {plannedLocationName})
      </Typography>
    )}
  </div>
);

export const LocationGroupCell = ({ locationGroupName, plannedLocationGroupName }) => (
  <LocationCell
    locationName={locationGroupName}
    plannedLocationName={plannedLocationGroupName}
    style={{ minWidth: 150 }}
  />
);
