import React, { Children } from 'react';
import styled from 'styled-components';

import { Button } from './Button';

const Row = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
  grid-template-columns: auto repeat(${p => p.items}, 8rem);
  grid-column: 1 / -1;
`;

// Add an empty div at the start to fill up any excess space.
// Also note the 'auto' as the first element of grid-template-columns,
// which corresponds to this div.
export const ButtonRow = React.memo(({ children, ...props }) => (
  <Row items={Children.toArray(children).length || 1} {...props}>
    <div />
    {children}
  </Row>
));

export const ConfirmCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = 'Confirm',
    confirmColor = 'primary',
    cancelText = 'Cancel',
    confirmDisabled,
    ...props
  }) => (
    <ButtonRow {...props}>
      {onCancel && (
        <Button variant="contained" onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      {onConfirm && (
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>
      )}
    </ButtonRow>
  ),
);
