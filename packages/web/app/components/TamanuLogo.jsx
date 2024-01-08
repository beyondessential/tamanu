import React from 'react';
import styled from 'styled-components';

import tamanuLogo from '../assets/images/tamanu_logo.svg';
import tamanuLogoWhite from '../assets/images/tamanu_logo_white.svg';
import tamanuLogoWhiteNoText from '../assets/images/tamanu_logo_white_no_text.svg';

const LogoImage = styled.img`
  display: inline-block;
  width: ${p => p.size || 'auto'};
  height: ${p => p.height || 'auto'};
`;

export const TamanuLogo = ({ size }) => <LogoImage src={tamanuLogo} size={size} />;

export const TamanuLogoWhite = ({ size, height, className }) => (
  <LogoImage src={tamanuLogoWhite} size={size} height={height} className={className} />
);

export const TamanuLogoWhiteNoText = ({ size, height, className }) => (
  <LogoImage src={tamanuLogoWhiteNoText} size={size} height={height} className={className} />
);
