import React from 'react';
import { FileChooserField, FILTER_PHOTOS } from './FileChooserField';
import { TranslatedText } from '../Translation';

const filters = [FILTER_PHOTOS];

export const PhotoField = ({ WebcamCaptureModalComponent, ...props }) => (
  <FileChooserField
    {...props}
    filters={filters}
    data-testid="field-ph0t"
    smallDisplay
    WebcamCaptureModalComponent={WebcamCaptureModalComponent}
    buttonText={
      <TranslatedText
        stringId="general.questionComponent.photoField.buttonText"
        fallback="Upload image"
      />
    }
  />
);
