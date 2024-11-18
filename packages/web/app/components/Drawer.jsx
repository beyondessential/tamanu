import MuiDrawer from '@mui/material/Drawer';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { ClearIcon } from './Icons';
import { TOP_BAR_HEIGHT } from './TopBar';
import { BodyText, Heading4 } from './Typography';

const Container = styled.div`
  background-color: ${Colors.background};
  inline-size: 20.625rem;
  min-block-size: 100%;
  overflow-y: auto;
  padding-block: 0 1rem;
  padding-inline: 1rem;
  position: relative;
`;

// TODO: Fix semantics
const Title = styled(Heading4)`
  background-color: ${Colors.background};
  border-bottom: max(0.0625rem, 1px) ${Colors.outline} solid;
  font-size: 1rem;
  inset-block-start: 0;
  margin-block: 0 0.5625rem;
  margin-inline: -1rem;
  padding-block: 1rem 0.313rem;
  padding-inline: 1rem;
  position: sticky;
  z-index: 1;
`;

const Description = styled(BodyText)`
  color: ${Colors.midText};
  font-size: 0.688rem;
  margin-block-end: 1rem;
`;

const StyledDrawer = styled(MuiDrawer)`
  .MuiPaper-root {
    block-size: calc(100% - ${TOP_BAR_HEIGHT + 1}px);
    inset-block-start: ${TOP_BAR_HEIGHT + 1}px;
  }
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
  position: absolute;
`;

export const Drawer = ({
  open,
  PaperProps = {},
  className,
  onClose,
  title,
  description,
  children,
}) => {
  const topRef = useRef(null);

  useEffect(() => topRef.current.scrollIntoView(), []);

  return (
    <StyledDrawer
      PaperProps={PaperProps}
      className={className}
      variant="persistent"
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Container columns={1}>
        <div ref={topRef} aria-hidden />
        <Title>
          {title}
          <CloseDrawerIcon onClick={onClose} />
        </Title>
        <Description>{description}</Description>
        {children}
      </Container>
    </StyledDrawer>
  );
};
