import React from 'react';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

export const UnsupportedPhotoField = ({ label, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <p data-testid='p-cfr2'>
      Photos and images questions cannot be completed on desktop. If required, this needs to be
      completed in Tamanu Mobile.
    </p>
  </OuterLabelFieldWrapper>
);
