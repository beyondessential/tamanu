import React from 'react';
import styled from 'styled-components';
import { Drawer as MuiDrawer } from '@mui/material';

import { BodyText, Heading4 } from './Typography';
import { Colors } from '../constants';
import { TOP_BAR_HEIGHT } from './TopBar';

const Container = styled.div`
  width: 20.625rem;
  padding: 1rem;
  background-color: ${Colors.background};
  overflow-y: auto;
  position: relative;
`;

const Title = styled(Heading4)`
  font-size: 1rem;
  margin-block-end: 0.563rem;
`;

const Description = styled(BodyText)`
  font-size: 0.688rem;
  color: ${Colors.midText};
`;

const StyledDrawer = styled(MuiDrawer)`
  .MuiPaper-root {
    block-size: calc(100% - ${TOP_BAR_HEIGHT}px);
    inset-block-start: ${TOP_BAR_HEIGHT}px;
  }
`;

export const Drawer = ({ open, className, onClose, title, description, children }) => {
  return (
    <StyledDrawer
      PaperProps={{
        className,
      }}
      variant="persistent"
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Container columns={1}>
        <Title>{title}</Title>
        <Description>{description}</Description>
        {children}
      </Container>
    </StyledDrawer>
  );
};
