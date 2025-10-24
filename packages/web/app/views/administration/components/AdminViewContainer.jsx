import React from 'react';
import styled from 'styled-components';

import { LoadingIndicator } from '../../../components/LoadingIndicator';

const OuterContainer = styled.div`
  position: relative;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  > div {
    display: flex;
    flex-direction: column;
  }
`;

const ContentContainer = styled.div`
  min-height: 100%;
  overflow: auto;
`;

const LoadingContainer = styled.div`
  position: absolute;
  width: 100%;
  z-index: 9999;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const Title = styled.h1`
  margin: 0px;
`;

const TitleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const AdminViewContainer = ({ title, titleActions, showLoadingIndicator, children, className }) => (
  <OuterContainer className={className} data-testid="outercontainer-ueni">
    {showLoadingIndicator && (
      <LoadingContainer data-testid="loadingcontainer-0uay">
        <LoadingIndicator data-testid="loadingindicator-z2hl" />
      </LoadingContainer>
    )}
    <ContentContainer data-testid="contentcontainer-andg">
      <TitleContainer>
        <Title data-testid="title-6kns">{title}</Title>
        {titleActions && <TitleActions>{titleActions}</TitleActions>}
      </TitleContainer>
      {children}
    </ContentContainer>
  </OuterContainer>
);
