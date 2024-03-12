import React from 'react';
import styled from 'styled-components';
import kmFlag from '../assets/images/flag_km.png';
import fjFlag from '../assets/images/flag_fj.png';
import gilFlag from '../assets/images/flag_gil.png';
import enFlag from '../assets/images/flag_en.png';

const CountryFlagImage = styled.img`
  display: inline-block;
  width: ${props => props.size || 'auto'};
  height: ${props => props.height || 'auto'};
`;

export const CountryFlag = ({ countryCode }) => {
  const flags = {
    km: kmFlag,
    fj: fjFlag,
    gil: gilFlag,
    en: enFlag
  };

  if (!flags[countryCode]) return null;

  return (
    <CountryFlagImage size="22px" src={flags[countryCode]} alt={`${countryCode} flag`} />
  );
};
