import React, { ReactElement } from 'react';
import { StyledView, StyledViewProps } from '/styled/common';

interface SpacerProps extends StyledViewProps {
  height?: string | number;
}

export const Spacer = ({
  height = '32px',
  ...props
}: SpacerProps): ReactElement => (
  <StyledView width="100%" background="transparent" height={height} {...props} />
);
