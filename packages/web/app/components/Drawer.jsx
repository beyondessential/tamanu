import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Drawer as MuiDrawer } from '@mui/material';

import { BodyText, Heading4 } from './Typography';
import { Colors } from '../constants';
import { TOP_BAR_HEIGHT } from './TopBar';
import { ClearIcon } from './Icons';

const Container = styled.div`
  width: 20.625rem;
  padding: 1rem;
  padding-top: 0;
  background-color: ${Colors.background};
  overflow-y: auto;
  position: relative;
`;

const Title = styled(Heading4)`
  font-size: 1rem;
  position: sticky;
  z-index: 1;
  background-color: ${Colors.background};
  border-bottom: 1px ${Colors.outline} solid;
  padding: 1rem 1rem 0.313rem 1rem;
  margin: 0 -1rem 9px;
  top: 0;
`;

const Description = styled(BodyText)`
  font-size: 0.688rem;
  color: ${Colors.midText};
  margin-bottom: 1rem;
`;

const StyledDrawer = styled(MuiDrawer)`
  .MuiPaper-root {
    block-size: calc(100% - ${TOP_BAR_HEIGHT + 1}px);
    inset-block-start: ${TOP_BAR_HEIGHT + 1}px;
  }
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
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

  useEffect(() => topRef.current.scrollIntoView(), [open]);

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
        <div ref={topRef} aria-hidden></div>
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
