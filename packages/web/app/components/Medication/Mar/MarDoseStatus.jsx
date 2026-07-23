import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { EditedOrnament } from '@tamanu/ui-components';
import AlertOrnament from './AlertOrnament';
import MarStatusIcon from './MarStatusIcon';
import { MarDataCell, MarCellButton } from './components';

const IconWrapper = styled.div`
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
  font-size: 24px;
  ${MarDataCell}:has(${MarCellButton}:nth-of-type(2)) & {
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
 *   isEdited?: boolean;
 *   isEnd?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPrn?: boolean;
 *   marInfo?: object | null;
 *   status?: string;
 * }} props
 */
export default function MarDoseStatus({
  isAlert,
  isDiscontinued,
  isEdited,
  isEnd,
  isPast,
  isPaused,
  isPrn,
  marInfo,
  status,
}) {
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
