import styled from 'styled-components';
import { Typography } from '@material-ui/core';

export const LargeBodyText = styled(Typography)`
  font-size: 16px;
  line-height: 21px;
  color: ${props => props.theme.palette.text[props.color || 'primary']};
`;

export const BodyText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text[props.color || 'primary']};
`;

export const SmallBodyText = styled(Typography)`
  font-size: 11px;
  line-height: 15px;
  color: ${props => props.theme.palette.text[props.color || 'primary']};
`;

export const Heading2 = styled(Typography)`
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  color: ${props => props.theme.palette.text[props.color || 'primary']};
`;
