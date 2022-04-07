import React from 'react';
import { StyledView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';

export const FormSectionHeading = ({ text, ...props }) => (
  <StyledView marginBottom={5} marginTop={10} {...props}>
    <SectionHeader h3 style={{ textTransform: 'uppercase' }}>
      {text}
    </SectionHeader>
  </StyledView>
);
