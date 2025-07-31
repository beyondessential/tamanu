import React from 'react';
import { FileChooserField, FILTER_PHOTOS } from './FileChooserField';
import { TranslatedText } from '../Translation';

export const PhotoField = ({ ...props }) => (
  <FileChooserField
    {...props}
    filters={[FILTER_PHOTOS]}
    data-testid="field-ph0t"
    smallDisplay
    buttonText={
      <TranslatedText
        stringId="general.questionComponent.photoField.buttonText"
        fallback="Upload image"
        data-testid="translatedtext-k3dl"
      />
    }
  />
);
