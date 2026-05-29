import React from 'react';
import { FileChooserField, FILTER_PHOTOS } from './FileChooserField';
import { TranslatedText } from '../Translation';

const filters = [FILTER_PHOTOS];

export const PhotoField = ({ WebcamCaptureModalComponent, ViewPhotoLinkComponent, ...props }) => (
  <FileChooserField
    {...props}
    filters={filters}
    data-testid="field-ph0t"
    smallDisplay
    WebcamCaptureModalComponent={WebcamCaptureModalComponent}
    ViewPhotoLinkComponent={ViewPhotoLinkComponent}
    buttonText={
      <TranslatedText
        stringId="general.questionComponent.photoField.buttonText"
        fallback="Upload image"
      />
    }
  />
);
