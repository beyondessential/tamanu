import styled from 'styled-components/native';
import { StyledText, StyledTextProps } from '../../styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import theme from '../../styled/theme';

interface SectionHeader extends StyledTextProps {
  h1?: boolean;
  h2?: boolean;
}

export const SectionHeader = styled(StyledText)<SectionHeader>`
  ${({ color }) => color || `color: ${theme.colors.PRIMARY_MAIN}`};
  font-size: ${({ h1, h2, fontSize }) => {
    if (h1) return screenPercentageToDP('2.18', Orientation.Height);
    if (h2) return screenPercentageToDP('1.82', Orientation.Height);
    return fontSize;
  }};
  font-weight: ${({ h1, h2, fontWeight }) => {
    if (h1) return 500;
    if (h2) return 400;
    return fontWeight;
  }};
`;
