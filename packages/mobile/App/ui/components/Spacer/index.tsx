import { StyledView, StyledViewProps } from '/styled/common';
import React, { ReactElement } from 'react';

interface SpacerProps extends StyledViewProps {
  height?: string | number;
}

export const Spacer = ({
  height,
  ...props
}: SpacerProps): ReactElement => (
  <StyledView width="100%" background="transparent" height={height} {...props} />
);

Spacer.defaultProps = {
  height: '32px',
};
