import React from 'react';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { TranslatedText } from '../Translation/TranslatedText';

export const UnsupportedPhotoField = ({ label, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props} data-testid="outerlabelfieldwrapper-96zn">
    <p>
      <TranslatedText
        stringId="survey.photoField.unsupported.message"
        fallback="Photos and images questions cannot be completed on desktop. If required, this needs to be completed in Tamanu Mobile."
        data-testid="translatedtext-photo-unsupported"
      />
    </p>
  </OuterLabelFieldWrapper>
);
