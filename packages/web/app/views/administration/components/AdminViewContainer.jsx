import React from 'react';
import styled from 'styled-components';

import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Colors } from '../../../constants';

const OuterContainer = styled.div`
  position: relative;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: auto;
`;

const TitleContainer = styled.div`
  align-items: center;
  background-color: ${Colors.white};
  display: flex;
  justify-content: space-between;
  padding-inline: 30px;
  padding-block: 20px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.33333333;
  margin: 0;
`;

const TitleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const AdminViewContainer = ({
  children,
  className,
  showLoadingIndicator,
  title,
  titleActions,
}) => (
  <OuterContainer className={className} data-testid="outercontainer-ueni">
    {showLoadingIndicator && (
      <LoadingIndicator data-testid="loadingindicator-z2hl" style={{ position: 'absolute' }} />
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
