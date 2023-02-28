import styled from 'styled-components';
import { Typography as MuiTypography } from '@material-ui/core';
import { Colors } from '../constants';

const Typography = styled(MuiTypography)`
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

export const Heading2 = styled(Typography)`
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
`;
