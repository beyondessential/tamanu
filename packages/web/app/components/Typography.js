import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const Typography = styled(Box)`
  color: ${({ color }) => (color === 'textTertiary' ? Colors.midText : null)};
`;

export const LargeBodyText = styled(Typography)`
  font-size: 16px;
  line-height: 21px;
`;

export const BodyText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
`;

export const SmallBodyText = styled(Typography)`
  font-size: 11px;
  line-height: 15px;
`;

export const Heading1 = styled(Typography).attrs({ component: 'h1' })`
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
`;

export const Heading2 = styled(Typography).attrs({ component: 'h2' })`
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
`;

export const Heading3 = styled(Typography).attrs({ component: 'h3' })`
  font-weight: 500;
  font-size: 18px;
  line-height: 24px;
`;

export const Heading4 = styled(Typography).attrs({ component: 'h4' })`
  font-weight: 500;
  font-size: 16px;
  line-height: 21px;
`;

export const Heading5 = styled(Typography).attrs({ component: 'h5' })`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;
