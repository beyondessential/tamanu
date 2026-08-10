import React from 'react';
import styled from 'styled-components';

import { EditedOrnament } from '@tamanu/ui-components';
import AlertOrnament from './AlertOrnament';
import MarStatusIcon from './MarStatusIcon';
import { MarDataCell, MarDoseSlot } from './components';
import { getMarStatusIconVariant } from './getShowDoseInfo';

/** `span` rather than `div`: `MarCellButton` cannot contain flow content. */
const IconWrapper = styled.span`
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
  font-size: 24px;
  ${MarDataCell}:has(${MarDoseSlot}:nth-of-type(2)) & {
    font-size: 16px;
  }
`;

const StyledEditedOrnament = styled(EditedOrnament)`
  position: absolute;
  right: 3px;
  top: 2px;
`;

/**
 * @param {{
 *   isAlert?: boolean;
 *   isDiscontinued?: boolean;
 *   isEnd?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPrn?: boolean;
 *   marInfo?: object | null;
 *   showPending?: boolean;
 * }} props
 */
export default function MarDoseStatus({
  isAlert,
  isDiscontinued,
  isEnd,
  isPast,
  isPaused,
  isPrn,
  marInfo,
  showPending,
}) {
  const { isEdited, status } = marInfo || {};

  const variant = getMarStatusIconVariant({
    marInfo,
    isDiscontinued,
    isEnd,
    isPast,
    isPaused,
    isPrn,
    showPending,
  });
  // Without an icon, dose due info is rendered as a cell-level overlay in MarCell
  if (!variant) return null;

  return (
    <IconWrapper>
      <MarStatusIcon variant={variant} />
      {status && isAlert && <AlertOrnament />}
      {status && isEdited && <StyledEditedOrnament />}
    </IconWrapper>
  );
}
