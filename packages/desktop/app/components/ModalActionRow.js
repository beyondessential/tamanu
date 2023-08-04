import React from 'react';
import styled from 'styled-components';
import { MODAL_PADDING_LEFT_AND_RIGHT, FullWidthRow } from './Modal';
import { Colors } from '../constants';
import { ButtonRow, ConfirmCancelRow } from './ButtonRow';

// TODO this is a little weird - might be better to refactor ConfirmCancelRow to allow replacing
// the ButtonRow component it uses with a differently styled one
const makeModalRow = (Component, includeLeftPadding = true) => {
  const Row = styled(Component)`
    border-top: 1px solid ${Colors.outline};
    padding: 30px ${MODAL_PADDING_LEFT_AND_RIGHT}px 0
      ${includeLeftPadding ? MODAL_PADDING_LEFT_AND_RIGHT : 0}px;
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  `;

  return ({ className = '', ...props }) => (
    <FullWidthRow className={className}>
      <Row {...props} />
    </FullWidthRow>
  );
};

export const ModalGenericButtonRow = makeModalRow(ButtonRow);

// this is the component for the "standard actions" at the bottom of a modal (ie confirm/cancel)
// anything deviating from this pattern should use ModalGenericButtonRow instead
export const ModalActionRow = makeModalRow(ConfirmCancelRow, false);
