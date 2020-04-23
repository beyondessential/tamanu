import styled from 'styled-components/native';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const StyledCardContainer = styled.View`
  background: ${theme.colors.WHITE};
  height: ${screenPercentageToDP(20.26, Orientation.Height)};
  width: 130px;
  border-radius: 3px;
  padding: 20px 10px 10px 15px;
`;
