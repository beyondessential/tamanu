import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import styled from 'styled-components/native';

export const StyledCardContainer = styled.View`
  background: ${theme.colors.WHITE};
  height: ${screenPercentageToDP(21.26, Orientation.Height)};
  width: ${screenPercentageToDP(31.63, Orientation.Width)};
  border-radius: 3px;
  padding: ${screenPercentageToDP(2.43, Orientation.Height)}px ${
  screenPercentageToDP(1.43, Orientation.Width)
}px;
`;
