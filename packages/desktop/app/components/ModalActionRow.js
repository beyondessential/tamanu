import React from 'react';
import styled from 'styled-components';
import { MODAL_PADDING, FullWidthRow } from './Modal';
import { Colors } from '../constants';
import { ButtonRow, ConfirmCancelRow } from './ButtonRow';

// const ActionRowStyle = styled.css`
//   border-top: 1px solid ${Colors.outline};
//   padding: 30px ${MODAL_PADDING}px 0 0;
//   grid-column: 1 / -1;
//   display: flex;
//   justify-content: flex-end;
// `;

// export const BlankActionRow = styled(ButtonRow)`${ActionRowStyle}`;
// export const ActionRow = styled(ConfirmCancelRow)`${ActionRowStyle}`;
export const BlankActionRow = styled(ButtonRow)`
  border-top: 1px solid ${Colors.outline};
  padding: 30px ${MODAL_PADDING}px 0 ${MODAL_PADDING}px;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

export const BlankModalActionRow = ({ children, ...props}) => (
  <FullWidthRow>
    <BlankActionRow {...props}>
      {children}
    </BlankActionRow>
  </FullWidthRow>
);

// (ActionRowStyle);
// export const BlankActionRow = styled(ButtonRow)(ActionRowStyle);

const ActionRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding: 30px ${MODAL_PADDING}px 0 0;
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
`;

export const ModalActionRow = props => (
  <FullWidthRow>
    <ActionRow {...props} />
  </FullWidthRow>
);
