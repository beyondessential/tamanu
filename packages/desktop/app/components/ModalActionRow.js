import React from 'react';
import styled from 'styled-components';
import { FullWidthRow } from './Modal';
import { Colors } from '../constants';
import { ConfirmCancelRow } from './ButtonRow';

const ActionRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
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
