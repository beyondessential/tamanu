import React from 'react';
import styled from 'styled-components';

import tamanuLogo from '../assets/images/tamanu_logo.svg';
import tamanuLogoWhite from '../assets/images/tamanu_logo_white.svg';
import tamanuLogoWhiteNoText from '../assets/images/tamanu_logo_white_no_text.svg';
import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';
import tamanuLogoLeftIconBlue from '../assets/images/tamanu_logo_left_icon_blue.svg';

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

export const TamanuLogoBlue = ({ size, height, className }) => (
  <LogoImage src={tamanuLogoBlue} size={size} height={height} className={className} />
);

export const TamanuLogoLeftIconBlue = ({ size, height, className, onClick }) => (
  <LogoImage
    src={tamanuLogoLeftIconBlue}
    size={size}
    height={height}
    className={className}
    onClick={onClick}
  />
);
