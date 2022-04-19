import React from 'react';
import styled from 'styled-components';

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

export const PrintLetterhead = ({ title, subTitle, logoSrc }) => (
  <Header>
    {logoSrc && <LogoImage src={logoSrc} />}
    <HeaderText>
      <h3>{title}</h3>
      <p>
        <strong>{subTitle}</strong>
      </p>
    </HeaderText>
  </Header>
);
