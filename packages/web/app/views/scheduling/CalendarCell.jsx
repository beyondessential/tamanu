import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';

const Cell = styled.div`
  cursor: pointer;
  scroll-snap-align: start;
  transition: background-color 100ms ease;
  padding-block: 0.25rem;
  padding-inline: 0.5rem 1rem;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
`;

export const CalendarCell = ({ children, ...props }) => <Cell {...props}>{children}</Cell>;
