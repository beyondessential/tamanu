import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

const Header = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;

  h3.MuiTypography-root {
    font-weight: 700;
    font-size: 16px;
    line-height: 18px;
    margin-bottom: 6px;
  }
`;

const LogoImage = styled.img`
  position: absolute;
  top: -5px;
  left: -10px;
  height: auto;
  width: 90px;
`;

const HeaderText = styled.div`
  text-align: center;
`;

export const PrintLetterhead = ({ title, subTitle, logoSrc }) => (
  <Header>
    {logoSrc && <LogoImage src={logoSrc} />}
    <HeaderText>
      <Typography variant="h3">{title}</Typography>
      <Typography variant="h3">{subTitle}</Typography>
    </HeaderText>
  </Header>
);
