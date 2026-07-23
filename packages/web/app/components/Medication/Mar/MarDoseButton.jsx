import React, { useRef, useState } from 'react';

import { useMarDoses } from '../../../api/queries/useMarDoses';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { WarningModal } from '../WarningModal';
import { MarDetails } from './MarDetails';
import MarDoseStatus from './MarDoseStatus';
import { StatusPopper } from './StatusPopper';
import { MarCellButton } from './components';
import useMarDoseAlerts from './useMarDoseAlerts';
import { useMarDoseTiming } from './useMarDoseTiming';
import useCanViewMedication from './useCanViewMedication';
import useMarPermissions from './useMarPermissions';
import { useMarDoseScheduleStatus } from './useMarStatusFlags';

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
  const canViewMedication = useCanViewMedication(medication?.medication);
  const { canCreateMar, canViewMar } = useMarPermissions();
  const { isPast, isCurrent, isFuture, isNotDue } = useMarDoseTiming({
    timeSlot,
    selectedDate,
    hasRecord: Boolean(marInfo),
  });
  const { isDiscontinued, isEnd, isPaused, isPausedThenDiscontinued } = useMarDoseScheduleStatus({
    medication,
    marInfo,
    nextMarInfo,
    previousMarInfo,
    previousSubSlot,
    timeSlot,
    selectedDate,
    pauseRecords,
  });
  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo?.id);
  const {
    isDoseAmountNotMatch,
    isRecordedDuringPaused,
    isRecordedOutsideAdministrationSchedule,
  } = useMarDoseAlerts({
    marInfo,
    medication,
    marDoses,
    isPaused,
    isPast,
  });

  const { status } = marInfo || {};

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
    if (!canViewMedication || anchorEl || isDiscontinued || isNotDue || isEnd || !canViewMar)
      return;

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

  return (
    <>
      <MarCellButton
        ref={buttonRef}
        aria-selected={isSelected || undefined}
        data-discontinued={isDiscontinued || undefined}
        data-ended={isEnd || undefined}
        data-inactive={isInactive || undefined}
        data-paused={isPaused || undefined}
        disabled={
          !canViewMedication || isNotDue || isInactive || !(canCreateMar || (status && canViewMar))
        }
        onClick={onSelected}
      >
        <MarDoseStatus
          isDiscontinued={isDiscontinued}
          isEnd={isEnd}
          isNotDue={isNotDue}
          isPast={isPast}
          isPaused={isPaused}
          isPausedThenDiscontinued={isPausedThenDiscontinued}
          marInfo={marInfo}
          medication={medication}
        />
      </MarCellButton>
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
