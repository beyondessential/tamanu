import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';

const Row = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
  grid-template-columns: auto repeat(${p => p.items}, 8rem);
`;

export const ButtonRow = React.memo(({ children, ...props }) => (
  <Row items={children.length} {...props}>
    <div />
    {children}
  </Row>
));

export const ConfirmCancelRow = React.memo(
  ({ onCancel, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', ...props }) => (
    <ButtonRow {...props}>
      <Button variant="contained" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="contained" color="primary" onClick={onConfirm}>
        {confirmText}
      </Button>
    </ButtonRow>
  ),
);
