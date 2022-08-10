import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

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
  top: -5px;
  left: 0px;
  height: auto;
  width: 90px;
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
    <Header>
      {logoSrc && <LogoImage src={logoSrc} />}
      <HeaderText>
        <Typography variant="h3">{title}</Typography>
        <Typography variant="h3">{subTitle}</Typography>
      </HeaderText>
    </Header>
    {pageTitle && <PageTitle variant="h3">{pageTitle}</PageTitle>}
  </>
);
