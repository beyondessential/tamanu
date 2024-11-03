import React from 'react';
import styled from 'styled-components';
import { Drawer as MuiDrawer } from '@mui/material';

import { BodyText, Heading4 } from '../../../components/Typography';
import { Colors } from '../../../constants';
import { TOP_BAR_HEIGHT } from '../../../components/TopBar';

const Container = styled.div`
  width: 330px;
  padding: 16px;
  background-color: ${Colors.background};
  overflow-y: auto;
  position: relative;
`;

const Title = styled(Heading4)`
  font-size: 16px;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 11px;
  color: ${Colors.midText};
`;

const StyledDrawer = styled(MuiDrawer)`
  .MuiPaper-root {
    block-size: calc(100% - ${TOP_BAR_HEIGHT}px);
    inset-block-start: ${TOP_BAR_HEIGHT}px;
  }
`;

export const Drawer = ({ open, onClose, title, description, children }) => {
  return (
    <StyledDrawer variant="persistent" anchor="right" open={open} onClose={onClose}>
      <Container columns={1}>
        <Title>{title}</Title>
        <Description>{description}</Description>
        {children}
      </Container>
    </StyledDrawer>
  );
};
