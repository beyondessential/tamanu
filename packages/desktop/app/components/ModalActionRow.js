import React from 'react';
import styled from 'styled-components';
import { MODAL_PADDING_LEFT_AND_RIGHT, FullWidthRow } from './Modal';
import { Colors } from '../constants';
import { ConfirmCancelRow } from './ButtonRow';

const ActionRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding: 30px ${MODAL_PADDING_LEFT_AND_RIGHT}px 0 0;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

export const ModalActionRow = ({ className = '', ...props }) => (
  <FullWidthRow className={className}>
    <ActionRow {...props} />
  </FullWidthRow>
);
