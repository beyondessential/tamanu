import React from 'react';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

export const UnsupportedPhotoField = ({ label, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props} data-testid="outerlabelfieldwrapper-96zn">
    <p>
      Photos and images questions cannot be completed on desktop. If required, this needs to be
      completed in Tamanu Mobile.
    </p>
  </OuterLabelFieldWrapper>
);
