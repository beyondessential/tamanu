import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

interface TextFieldErrorMessageProps {
  children: ReactNode;
}

const StyledErrorMessage = styled(StyledText)`
    color: ${theme.colors.ALERT};
    font-size: ${screenPercentageToDP(1.82, Orientation.Height)};
    font-weight: 400;
    padding-left: ${screenPercentageToDP(1, Orientation.Width)};
`;

export const TextFieldErrorMessage = ({ children }: TextFieldErrorMessageProps): JSX.Element => (
  <StyledErrorMessage>{children}</StyledErrorMessage>
);
