import React, { ReactElement } from 'react';
import { StyledView, StyledViewProps } from '/styled/common';
import { theme } from '/styled/theme';

interface SeparatorProps extends StyledViewProps {
  width?: string | number;
}

export const Separator = ({
  width = '100%',
  ...props
}: SeparatorProps): ReactElement => (
  <StyledView width="100%" height={1} {...props}>
    <StyledView
      width={width}
      height={1}
      background={theme.colors.BOX_OUTLINE}
    />
  </StyledView>
);
