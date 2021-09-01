import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalisation } from '../../contexts/Localisation';
import { connectApi } from '../../api/connectApi';

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoImage = styled.img`
  position: absolute;
  left: 40px;
  width: 100px;
`;

const HeaderText = styled.div`
  text-align: center;
`;

const DumbPrintLetterhead = ({ getLetterheadSettings }) => {
  const { getLocalisation } = useLocalisation();
  const [letterheadLogo, setLetterheadLogo] = useState('');
  const [logoType, setLogoType] = useState('');
  useEffect(() => {
    getLetterheadSettings().then(response => {
      setLetterheadLogo(Buffer.from(response.data).toString('base64'));
      setLogoType(response.type);
    });
  }, []);
  return (
    <Header>
      {letterheadLogo && <LogoImage src={`data:${logoType};base64,${letterheadLogo}`} />}
      <HeaderText>
        <h3>{getLocalisation('templates.letterhead.title')}</h3>
        <p>
          <strong>{getLocalisation('templates.letterhead.subTitle')}</strong>
        </p>
      </HeaderText>
    </Header>
  );
};

export const PrintLetterhead = connectApi(api => ({
  async getLetterheadSettings() {
    return api.get('asset/letterhead-logo');
  },
}))(DumbPrintLetterhead);
