import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import tamanuLogo from '../assets/images/tamanu_logo.svg';

const LogoImage = styled.img`
  display: inline-block;
  width: ${ p => p.size };
`;

export const TamanuLogo = ({ size }) => (
  <LogoImage src={ tamanuLogo } size={ size } />
);
