import React from 'react';
import styled from 'styled-components';
import { MODAL_PADDING_LEFT_AND_RIGHT, FullWidthRow } from './Modal';
import { Colors } from '../constants';
import { ButtonRow, ConfirmCancelRow } from './ButtonRow';

const ActionRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding: 30px ${MODAL_PADDING_LEFT_AND_RIGHT}px 0 0;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

export const ModalActionRow = props => (
  <FullWidthRow>
    <ActionRow {...props} />
  </FullWidthRow>
);

export const StyledButtonRow = styled(ButtonRow)`
  border-top: 1px solid ${Colors.outline};
  padding: 30px ${MODAL_PADDING}px 0 ${MODAL_PADDING}px;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

export const ModalButtonRow = ({ children, ...props }) => (
  <FullWidthRow>
    <StyledButtonRow {...props}>{children}</StyledButtonRow>
  </FullWidthRow>
);
