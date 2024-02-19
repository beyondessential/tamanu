import React from 'react';
import styled from 'styled-components';
import { BRANDS } from '@tamanu/constants';
import tamanuLogoWhite from '../assets/images/tamanu_logo_white.svg';
import tamanuLogoWhiteNoText from '../assets/images/tamanu_logo_white_no_text.svg';
import tamanuLogoDark from '../assets/images/tamanu_logo_blue.svg';
import cambodiaLogoWhite from '../assets/cambodia/cambodia-logo-light.png';
import cambodiaLogoWhiteNoText from '../assets/cambodia/cambodia-logo-light-no-text.png';
import cambodiaLogoDark from '../assets/cambodia/cambodia-logo-dark.png';
import { BRAND_NAME } from '../utils';

const TamanuLogoImage = styled.img`
  display: inline-block;
  width: ${p => p.size || 'auto'};
  height: ${p => p.height || 'auto'};
`;

const CambodiaLogoImage = styled.img`
  display: inline-block;
  width: ${p => p.size || 'auto'};
  height: ${p => p.height || 'auto'};
`;

const logos = {
  [BRANDS.TAMANU]: {
    light: tamanuLogoWhite,
    dark: tamanuLogoDark,
    lightNoText: tamanuLogoWhiteNoText,
  },
  [BRANDS.KHMEIR]: {
    light: cambodiaLogoWhite,
    dark: cambodiaLogoDark,
    lightNoText: cambodiaLogoWhiteNoText,
  },
};

const Logo = ({ size, height, className, onClick, type = 'dark' }) => {
  const Component = BRAND_NAME === BRANDS.TAMANU ? TamanuLogoImage : CambodiaLogoImage;
  const src = logos[BRAND_NAME][type];
  console.log('size', size);
  return (
    <Component
      src={src}
      size={size}
      height={height}
      className={className}
      onClick={onClick ? onClick : null}
    />
  );
};

export const LogoLight = ({ size, height, className, onClick }) => (
  <Logo size={size} height={height} className={className} onClick={onClick} type="light" />
);
export const LogoDark = ({ size, height, className, onClick }) => (
  <Logo size={size} height={height} className={className} onClick={onClick} type="dark" />
);
export const LogoLightNoText = ({ size, height, className, onClick }) => (
  <Logo size={size} height={height} className={className} onClick={onClick} type="lightNoText" />
);
