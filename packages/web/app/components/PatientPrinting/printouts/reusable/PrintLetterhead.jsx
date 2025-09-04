import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';

const Header = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;

  h3.MuiTypography-root {
    font-weight: 700;
    font-size: 15px;
    line-height: 18px;
    margin-bottom: 6px;
  }
`;

const LogoImage = styled.img`
  position: absolute;
  top: 0px;
  left: 0px;
  height: auto;
  width: auto;
  max-height: 50px;
  max-width: 135px;
`;

const HeaderText = styled.div`
  text-align: right;
`;

const PageTitle = styled(Typography)`
  font-size: 18px;
  line-height: 21px;
  font-weight: bold;
  margin-bottom: 36px;
  text-align: right;
`;

export const PrintLetterhead = ({ title, subTitle, logoSrc, pageTitle }) => (
  <>
    <Header data-testid="header-gfu1">
      {logoSrc && <LogoImage src={logoSrc} data-testid="logoimage-xufa" />}
      <HeaderText data-testid="headertext-u17p">
        <Typography variant="h3" data-testid="typography-17ld">
          {title}
        </Typography>
        <Typography variant="h3" data-testid="typography-lzgx">
          {subTitle}
        </Typography>
      </HeaderText>
    </Header>
    {pageTitle && (
      <PageTitle variant="h3" data-testid="pagetitle-3kw8">
        {pageTitle}
      </PageTitle>
    )}
  </>
);
