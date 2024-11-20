import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { BodyText, Heading4 } from './Typography';
import { Colors } from '../constants';
import { ClearIcon } from './Icons';

import Collapse from '@mui/material/Collapse';

const Container = styled.div`
  width: 20.625rem;
  padding: 1rem;
  padding-top: 0;
  background-color: ${Colors.background};
  border-inline-start: 1px ${Colors.outline} solid;
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

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
`;

export const Drawer = ({
  open,
  className,
  innerClassName,
  onClose,
  title,
  description,
  children,
  orientation = 'horizontal',
}) => {
  const topRef = useRef(null);

  useEffect(() => topRef.current.scrollIntoView(), [open]);

  return (
    <Collapse className={className} in={open} orientation={orientation}>
      <Container className={innerClassName} columns={1}>
        <div ref={topRef} aria-hidden></div>
        <Title>
          {title}
          <CloseDrawerIcon onClick={onClose} />
        </Title>
        <Description>{description}</Description>
        {children}
      </Container>
    </Collapse>
  );
};
