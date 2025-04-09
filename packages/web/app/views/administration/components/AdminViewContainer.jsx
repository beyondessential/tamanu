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

const Title = styled.h1`
  padding: 20px;
  margin: 0px;
`;

export const AdminViewContainer = ({ title, showLoadingIndicator, children, className }) => (
  <OuterContainer className={className} data-testid='outercontainer-ueni'>
    {showLoadingIndicator && (
      <LoadingContainer data-testid='loadingcontainer-0uay'>
        <LoadingIndicator data-testid='loadingindicator-z2hl' />
      </LoadingContainer>
    )}
    <ContentContainer data-testid='contentcontainer-andg'>
      <Title data-testid='title-6kns'>{title}</Title>
      {children}
    </ContentContainer>
  </OuterContainer>
);
