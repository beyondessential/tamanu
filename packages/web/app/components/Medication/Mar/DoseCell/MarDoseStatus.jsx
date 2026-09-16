import React from 'react';
import styled from 'styled-components';

import { EditedOrnament, TAMANU_COLORS } from '@tamanu/ui-components';
import AlertOrnament from './AlertOrnament';
import MarStatusIcon from './MarStatusIcon';
import { MarDataCell, MarDoseSlot } from '../components';
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
  color: ${TAMANU_COLORS.darkText};
  font-size: 12px;
  inset-block-start: 2px;
  inset-inline-end: 3px;
  position: absolute;
`;

/**
 * @param {{
 *   isAlert?: boolean;
 *   isDiscontinued?: boolean;
 *   isDueBeforePrescriptionStart?: boolean;
 *   isEnd?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPrn?: boolean;
 *   marInfo?: object | null;
 * }} props
 */
export default function MarDoseStatus({
  isAlert,
  isDiscontinued,
  isDueBeforePrescriptionStart,
  isEnd,
  isPast,
  isPaused,
  isPrn,
  marInfo,
}) {
  const { isEdited, status } = marInfo || {};

  const variant = getMarStatusIconVariant({
    marInfo,
    isDiscontinued,
    isDueBeforePrescriptionStart,
    isEnd,
    isPast,
    isPaused,
    isPrn,
  });
  if (!variant) return null;

  return (
    <IconWrapper>
      <MarStatusIcon variant={variant} />
      {status && isAlert && <AlertOrnament />}
      {status && isEdited && <StyledEditedOrnament />}
    </IconWrapper>
  );
}
