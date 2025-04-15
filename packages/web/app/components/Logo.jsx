import React from 'react';
import styled from 'styled-components';
import { BRAND_IDS } from '@tamanu/constants';
import tamanuLogoWhite from '../assets/images/tamanu_logo_white.svg';
import tamanuLogoWhiteNoText from '../assets/images/tamanu_logo_white_no_text.svg';
import tamanuLogoDark from '../assets/images/tamanu_logo_blue.svg';
import { getBrandId } from '../utils';

const LogoImage = styled.img`
  display: inline-block;
  width: ${(p) => p.size || 'auto'};
  height: ${(p) => p.height || 'auto'};
`;

const logos = {
  [BRAND_IDS.TAMANU]: {
    light: tamanuLogoWhite,
    dark: tamanuLogoDark,
    lightNoText: tamanuLogoWhiteNoText,
  },
};

const Logo = ({ size, height, className, onClick, type = 'dark' }) => {
  const brandId = getBrandId();

  const src = logos[brandId]?.[type] ?? logos[BRAND_IDS.TAMANU][type];

  return (
    <LogoImage
      src={src}
      size={size}
      height={height}
      className={className}
      onClick={onClick ? onClick : null}
      data-testid="logoimage-tqik"
    />
  );
};

export const LogoLight = ({ size, height, className, onClick }) => (
  <Logo
    size={size}
    height={height}
    className={className}
    onClick={onClick}
    type="light"
    data-testid="logo-fuep"
  />
);
export const LogoDark = ({ size, height, className, onClick }) => (
  <Logo
    size={size}
    height={height}
    className={className}
    onClick={onClick}
    type="dark"
    data-testid="logo-1lsz"
  />
);
export const LogoLightNoText = ({ size, height, className, onClick }) => (
  <Logo
    size={size}
    height={height}
    className={className}
    onClick={onClick}
    type="lightNoText"
    data-testid="logo-yuto"
  />
);
