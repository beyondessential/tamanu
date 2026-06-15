import React from 'react';
import styled from 'styled-components/native';
import { theme } from '/styled/theme';
import { StyledText } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

const StyledLabel = styled(StyledText)`
  font-size: ${(props): string => {
    const v = props.$fontSize || screenPercentageToDP(2.1, Orientation.Height);
    return typeof v === 'number' ? `${v}px` : v;
  }};
  font-weight: 600;
  margin-bottom: ${screenPercentageToDP(0.5, Orientation.Width)}px;
`;

interface LabelProps {
  children: string;
  labelColor?: string;
  labelFontSize?: string;
}

export const TextFieldLabel = ({
  children,
  labelColor,
  labelFontSize,
}: LabelProps): JSX.Element => (
  <StyledLabel
    style={{
      color: labelColor || theme.colors.TEXT_SUPER_DARK,
    }}
    $fontSize={labelFontSize}
  >
    {children}
  </StyledLabel>
);
