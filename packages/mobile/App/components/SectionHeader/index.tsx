import styled from 'styled-components/native';
import { StyledText, StyledTextProps } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';

interface SectionHeader extends StyledTextProps {
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
}
type StrNum = string | number | undefined;

export const SectionHeader = styled(StyledText)<SectionHeader>`
  ${({ color }): StrNum => color || `color: ${theme.colors.PRIMARY_MAIN}`};
  font-size: ${({ h1, h2, h3, fontSize }): StrNum => {
    if (h1) return screenPercentageToDP('2.18', Orientation.Height);
    if (h2) return screenPercentageToDP('1.82', Orientation.Height);
    if (h3) return screenPercentageToDP('1.59', Orientation.Height);
    return fontSize;
  }};
  font-weight: ${({ h1, h2, h3, fontWeight }): StrNum => {
    if (h1) return 500;
    if (h2) return 400;
    if (h3) return 400;
    return fontWeight;
  }};
`;
