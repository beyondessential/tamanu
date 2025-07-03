import React from 'react';
import { FileChooserField, FILTER_PHOTOS } from './FileChooserField';

export const PhotoField = ({ ...props }) => (
  <FileChooserField
    {...props}
    filters={[FILTER_PHOTOS]}
    data-testid="field-ph0t"
    smallDisplay
  />
);
