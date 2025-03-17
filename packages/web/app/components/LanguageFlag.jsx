import React from 'react';
import styled from 'styled-components';
import kmFlag from '../assets/images/languageflags/km.svg';
import fjFlag from '../assets/images/languageflags/fj.svg';
import gbFlag from '../assets/images/languageflags/gb.svg';
import { ReactCountryFlag } from 'react-country-flag';

const LanguageFlagImage = styled.img`
  display: inline-block;
  width: ${props => props.size || 'auto'};
  height: ${props => props.height || 'auto'};
`;

export const LanguageFlag = ({ languageCode, size = '22px' }) => {
  const flags = {
    km: kmFlag,
    fj: fjFlag,
    en: gbFlag,
  };

  if (!flags[languageCode]) return null;

  return <ReactCountryFlag countryCode={languageCode} size={size} svg />;
};
