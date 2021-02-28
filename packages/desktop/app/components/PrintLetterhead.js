import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { connectApi } from '../api/connectApi';

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
  const [letterheadLogo, setLetterheadLogo] = useState();
  const [letterheadTitle, setLetterheadTitle] = useState();
  const [letterheadSubtitle, setLetterheadSubtitle] = useState();
  useEffect(() => {
    getLetterheadSettings().then(response => {
      setLetterheadLogo(response['letterhead-logo']);
      setLetterheadTitle(response['letterhead-title']);
      setLetterheadSubtitle(response['letterhead-subtitle']);
    });
  }, []);
  return (
    <Header>
      <LogoImage src={letterheadLogo} />
      <HeaderText>
        <h3>{letterheadTitle}</h3>
        <p>
          <strong>{letterheadSubtitle}</strong>
        </p>
      </HeaderText>
    </Header>
  );
};

export const PrintLetterhead = connectApi(api => ({
  async getLetterheadSettings() {
    return await api.get('setting?names=letterhead-logo,letterhead-title,letterhead-subtitle');
  },
}))(DumbPrintLetterhead);
