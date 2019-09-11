import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { FullWidthRow } from './Modal';

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
  <Row items={children.length || 1} {...props}>
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

const ActionRow = styled(ConfirmCancelRow)`
  border-top: 1px solid #dedede;
  padding: 18px 32px 0 0;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;

  button:first-of-type {
    margin-right: 24px;
  }
`;

export const ModalActionRow = props => (
  <FullWidthRow>
    <ActionRow {...props} />
  </FullWidthRow>
);
