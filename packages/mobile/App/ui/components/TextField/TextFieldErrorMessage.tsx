import React from 'react';
import styled from 'styled-components';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

const StyledErrorMessage = styled(StyledText)`
    color: ${theme.colors.ALERT};
    font-size: ${screenPercentageToDP(1.82, Orientation.Height)};
    font-weight: 400;
    margin-top: ${screenPercentageToDP(0.5, Orientation.Height)};
    padding-left: ${screenPercentageToDP(1, Orientation.Width)};
`;

export const TextFieldErrorMessage = ({ children }: { children: string }): JSX.Element => (
  <StyledErrorMessage>{children}</StyledErrorMessage>
);
