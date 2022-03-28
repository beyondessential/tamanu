import React from 'react';
import styled from 'styled-components';

import tamanuLogo from '../assets/images/tamanu_logo.svg';
import tamanuLogoWhite from '../assets/images/tamanu_logo_white.svg';

const LogoImage = styled.img`
  display: inline-block;
  width: ${p => p.size};
`;

export const TamanuLogo = ({ size }) => <LogoImage src={tamanuLogo} size={size} />;

export const TamanuLogoWhite = ({ size, className }) => (
  <LogoImage src={tamanuLogoWhite} size={size} className={className} />
);
