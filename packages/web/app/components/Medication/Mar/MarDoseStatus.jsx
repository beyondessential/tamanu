import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { EditedOrnament } from '@tamanu/ui-components';
import AlertOrnament from './AlertOrnament';
import MarStatusIcon from './MarStatusIcon';
import { MarDataCell, MarDoseSlot } from './components';

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
}) {
  const { isEdited, status } = marInfo || {};

  if (!marInfo || isEnd || isDiscontinued || (!status && isPaused)) return null;

  switch (status) {
    case ADMINISTRATION_STATUS.GIVEN:
      return (
        <IconWrapper>
          <MarStatusIcon variant={ADMINISTRATION_STATUS.GIVEN} />
          {isAlert && <AlertOrnament />}
          {isEdited && <StyledEditedOrnament />}
        </IconWrapper>
      );
    case ADMINISTRATION_STATUS.NOT_GIVEN:
      return (
        <IconWrapper>
          <MarStatusIcon variant={ADMINISTRATION_STATUS.NOT_GIVEN} />
          {isAlert && <AlertOrnament />}
          {isEdited && <StyledEditedOrnament />}
        </IconWrapper>
      );
    default: {
      if (isPast) {
        return isPrn ? null : (
          <IconWrapper>
            <MarStatusIcon variant="missed" />
          </IconWrapper>
        );
      }
      // Dose due info is rendered as a cell-level overlay in MarCell
      return null;
    }
  }
}
