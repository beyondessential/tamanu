import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import React from 'react';
import styled from 'styled-components/native';

const StyledLabel = styled(StyledText)`
  font-size: ${(props): string => props.$fontSize || screenPercentageToDP(2.1, Orientation.Height)};
  font-weight: 600;
  margin-bottom: ${screenPercentageToDP(0.5, Orientation.Width)};
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
