import Collapse, { collapseClasses } from '@mui/material/Collapse';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { ClearIcon } from './Icons';
import { BodyText, Heading4 } from './Typography';

const StyledCollapse = styled(Collapse)`
  &.${collapseClasses.root} {
    background-color: ${Colors.background};
    border-inline-start: 1px ${Colors.outline} solid;
    min-block-size: 100%;
    overflow-y: auto;
    padding-block: 0 1rem;
    padding-inline: 1rem;
    position: relative;

    .${collapseClasses.wrapperInner} {
      inline-size: 21rem;
    }
  }
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

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
  position: absolute;
`;

export const Drawer = ({
  open,
  onClose,
  title,
  description,
  children,
  orientation = 'horizontal',
  ...props
}) => {
  const topRef = useRef(null);

  useEffect(() => topRef.current.scrollIntoView(), [open]);

  return (
    <StyledCollapse in={open} orientation={orientation} {...props}>
      <div ref={topRef} aria-hidden />
      <Title>
        {title}
        <CloseDrawerIcon onClick={onClose} />
      </Title>
      <Description>{description}</Description>
      {children}
    </StyledCollapse>
  );
};
