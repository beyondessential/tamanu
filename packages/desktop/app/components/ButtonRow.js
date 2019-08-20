import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';

const Row = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
  grid-template-columns: auto repeat(${p => p.items}, 8rem);
`;

// Add an empty div at the start to fill up any excess space.
// Also note the 'auto' as the first element of grid-template-columns,
// which corresponds to this div.
export const ButtonRow = React.memo(({ children, ...props }) => (
  <Row items={children.length || 1} {...props}>
    <div />
    {children}
  </Row>
));

// by default, stretch across all columns of any containing grid so it displays in its own row
const defaultConfirmCancelStyle = { gridColumn: 'span 1 / -1' };
export const ConfirmCancelRow = React.memo(
  ({ onCancel, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', style, ...props }) => (
    <ButtonRow style={{ ...defaultConfirmCancelStyle, ...style }} {...props}>
      <Button variant="contained" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="contained" color="primary" onClick={onConfirm}>
        {confirmText}
      </Button>
    </ButtonRow>
  ),
);
