import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { EditedOrnament } from '@tamanu/ui-components';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { WarningModal } from '../WarningModal';
import AlertOrnament from './AlertOrnament';
import { MarDetails } from './MarDetails';
import MarStatusIcon from './MarStatusIcon';
import { MarStatusTooltip } from './MarStatusTooltip';
import { StatusPopper } from './StatusPopper';
import TableCellButton from './TableCellButton';
import { useMarDoseState } from './useMarDoseState';

const IconWrapper = styled.div`
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
`;

const StyledEditedOrnament = styled(EditedOrnament)`
  position: absolute;
  right: 3px;
  top: 2px;
`;

const DiscontinuedDivider = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: ${p => p.theme.palette.text.tertiary};
`;

export function MarDoseButton({
  selectedDate,
  timeSlot,
  parentTimeSlot,
  marInfo,
  previousMarInfo,
  nextMarInfo,
  previousSubSlot,
  medication,
  pauseRecords,
  anchorEl,
  onAnchorElChange,
}) {
  const {
    canCreateMar,
    canView,
    canViewMar,
    dosingUnit,
    dueAt,
    endDate,
    isAlert,
    isCurrent,
    isDiscontinued,
    isDoseAmountNotMatch,
    isEdited,
    isEnd,
    isError,
    isFuture,
    isNotDue,
    isPaused,
    isPausedThenDiscontinued,
    isPast,
    isPrn,
    isRecordedDuringPaused,
    isRecordedOutsideAdministrationSchedule,
    marDoses,
    reasonNotGiven,
    status,
  } = useMarDoseState({
    selectedDate,
    timeSlot,
    marInfo,
    previousMarInfo,
    nextMarInfo,
    previousSubSlot,
    medication,
    pauseRecords,
  });

  const [isSelected, setIsSelected] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState('');
  const [showMarDetailsModal, setShowMarDetailsModal] = useState(false);
  const buttonRef = useRef(null);

  const isInactive = isDiscontinued || isEnd || isPaused;

  const handleStatusPopperOpen = () => {
    setIsSelected(true);
    onAnchorElChange(buttonRef.current);
  };

  const handleClose = () => {
    onAnchorElChange(null);
    setIsSelected(false);
  };

  const handleOpenMarDetailsModal = () => {
    setIsSelected(true);
    setShowMarDetailsModal(true);
  };

  const handleCloseMarDetailsModal = () => {
    setShowMarDetailsModal(false);
    setIsSelected(false);
  };

  const handleConfirm = () => {
    setShowWarningModal('');
    handleStatusPopperOpen();
  };

  const onSelected = () => {
    if (!canView || anchorEl || isDiscontinued || isNotDue || isEnd || !canViewMar) return;

    if (status) {
      handleOpenMarDetailsModal();
      return;
    }

    if (!canCreateMar) {
      return;
    }

    if (isPaused) {
      setShowWarningModal(MAR_WARNING_MODAL.PAUSED);
      return;
    }
    if (isPast) {
      setShowWarningModal(MAR_WARNING_MODAL.PAST);
      return;
    }
    if (isFuture || (isCurrent && !marInfo?.id)) {
      setShowWarningModal(MAR_WARNING_MODAL.FUTURE);
      return;
    }
    handleStatusPopperOpen();
  };

  const renderStatus = () => {
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
        // Dose due info is rendered as a cell-level overlay in MarStatus
        return null;
      }
    }
  };

  return (
    <>
      <TableCellButton
        ref={buttonRef}
        aria-selected={isSelected || undefined}
        data-discontinued={isDiscontinued || undefined}
        data-ended={isEnd || undefined}
        data-inactive={isInactive || undefined}
        data-paused={isPaused || undefined}
        disabled={!canView || isNotDue || isInactive || !(canCreateMar || (status && canViewMar))}
        onClick={onSelected}
      >
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
          {renderStatus()}
        </MarStatusTooltip>
      </TableCellButton>
      <StatusPopper
        open={Boolean(anchorEl) && Boolean(buttonRef.current) && anchorEl === buttonRef.current}
        anchorEl={anchorEl}
        onClose={handleClose}
        timeSlot={timeSlot}
        parentTimeSlot={parentTimeSlot}
        selectedDate={selectedDate}
        marInfo={marInfo}
        medication={medication}
        isFuture={isFuture}
        isPast={isPast}
      />
      <WarningModal
        modal={showWarningModal}
        onClose={() => setShowWarningModal('')}
        onConfirm={handleConfirm}
        isPast={isPast}
      />
      {showMarDetailsModal && (
        <MarDetails
          onClose={handleCloseMarDetailsModal}
          medication={medication}
          marInfo={marInfo}
          timeSlot={timeSlot}
          isRecordedOutsideAdministrationSchedule={isRecordedOutsideAdministrationSchedule}
          isDoseAmountNotMatch={isDoseAmountNotMatch}
          isRecordedDuringPaused={isRecordedDuringPaused}
        />
      )}
    </>
  );
}
