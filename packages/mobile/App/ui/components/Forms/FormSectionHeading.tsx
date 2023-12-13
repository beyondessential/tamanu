import { SectionHeader } from '/components/SectionHeader';
import { StyledView, StyledViewProps } from '/styled/common';
import React from 'react';

interface FormSectionHeadingProps extends StyledViewProps {
  text: string;
}

export const FormSectionHeading = ({ text, ...props }: FormSectionHeadingProps): JSX.Element => (
  <StyledView marginBottom={5} marginTop={10} {...props}>
    <SectionHeader h3 style={{ textTransform: 'uppercase' }}>
      {text}
    </SectionHeader>
  </StyledView>
);
