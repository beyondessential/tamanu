import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';

const Cell = styled.td`
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  cursor: pointer;
  scroll-snap-align: start;
  transition: background-color 100ms ease;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const CalendarCell = () => <Cell />;
