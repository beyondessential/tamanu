import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { EditedOrnament } from '@tamanu/ui-components';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import AlertOrnament from './AlertOrnament';
import MarStatusIcon from './MarStatusIcon';
import { MarStatusTooltip } from './MarStatusTooltip';
import { MarDataCell, MarCellButton } from './components';
import useMarDoseAlerts from './useMarDoseAlerts';

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
function MarDoseStatusIcon({
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

const DiscontinuedDivider = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: ${p => p.theme.palette.text.tertiary};
`;

/**
 * @param {{
 *   isDiscontinued?: boolean;
 *   isEnd?: boolean;
 *   isNotDue?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPausedThenDiscontinued?: boolean;
 *   marInfo?: object | null;
 *   medication?: object | null;
 * }} props
 */
export default function MarDoseStatus({
  isDiscontinued,
  isEnd,
  isNotDue,
  isPast,
  isPaused,
  isPausedThenDiscontinued,
  marInfo,
  medication,
}) {
  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo?.id);
  const { isAlert, isError } = useMarDoseAlerts({
    marInfo,
    medication,
    marDoses,
    isPaused,
    isPast,
  });

  const { dueAt, status, reasonNotGiven, isEdited } = marInfo || {};
  const { dosingUnit, endDate, isPrn } = medication || {};

  return (
    <MarStatusTooltip
      dosingUnit={dosingUnit}
      dueAt={dueAt}
      endDate={endDate}
      isAlert={isAlert}
      isDiscontinued={isDiscontinued}
      isEnd={isEnd}
      isError={isError}
      isNotDue={isNotDue}
      isPast={isPast}
      isPaused={isPaused}
      isPrn={isPrn}
      marDoses={marDoses}
      marInfo={marInfo}
      reasonNotGiven={reasonNotGiven}
      status={status}
    >
      {isPausedThenDiscontinued && <DiscontinuedDivider />}
      <MarDoseStatusIcon
        isAlert={isAlert}
        isDiscontinued={isDiscontinued}
        isEdited={isEdited}
        isEnd={isEnd}
        isPast={isPast}
        isPaused={isPaused}
        isPrn={isPrn}
        marInfo={marInfo}
        status={status}
      />
    </MarStatusTooltip>
  );
}
