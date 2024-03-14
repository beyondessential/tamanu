import React from 'react';
import styled from 'styled-components';
import kmFlag from '../assets/images/languageflags/km.svg';
import fjFlag from '../assets/images/languageflags/fj.svg';
import gilFlag from '../assets/images/languageflags/gil.svg';
import gbFlag from '../assets/images/languageflags/gb.svg';

const LanguageFlagImage = styled.img`
  display: inline-block;
  width: ${props => props.size || 'auto'};
  height: ${props => props.height || 'auto'};
`;

export const LanguageFlag = ({ languageCode, size = "22px" }) => {
  const flags = {
    km: kmFlag,
    fj: fjFlag,
    gil: gilFlag,
    gb: gbFlag
  };

  if (!flags[languageCode]) return null;

  return (
    <LanguageFlagImage size={size} src={flags[languageCode]} alt={`${languageCode} flag`} />
  );
};
