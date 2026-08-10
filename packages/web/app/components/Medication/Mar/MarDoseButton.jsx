import React, { useRef, useState } from 'react';

import { useDateTime } from '@tamanu/ui-components';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import useIsEncounterDischarged from '../../../hooks/useIsEncounterDischarged';
import { WarningModal } from '../WarningModal';
import { MarDetails } from './MarDetails';
import MarDoseStatus from './MarDoseStatus';
import { MarStatusLabel, MarStatusTooltip } from './MarStatusTooltip';
import { StatusPopper } from './StatusPopper';
import { MarCellButton } from './components';
import { getIsDueBeforePrescriptionStart } from './getShowDoseInfo';
import useCanViewMedication from './useCanViewMedication';
import useMarDoseAlerts from './useMarDoseAlerts';
import { useMarDoseTiming } from './useMarDoseTiming';
import useMarPermissions from './useMarPermissions';
import { useMarDoseScheduleStatus } from './useMarStatusFlags';

export function MarDoseButton({
  selectedDate,
  timeSlot,
  parentTimeSlot,
  marInfo,
  nextMarInfo,
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
  });
  const { isDiscontinued, isEnd, isPaused } = useMarDoseScheduleStatus({
    medication,
    marInfo,
    nextMarInfo,
    timeSlot,
    selectedDate,
    pauseRecords,
  });
  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo?.id);
  const {
    isAlert,
    isDoseAmountNotMatch,
    isError,
    isRecordedDuringPaused,
    isRecordedOutsideAdministrationSchedule,
  } = useMarDoseAlerts({
    marInfo,
    medication,
    marDoses,
    isPaused,
    isPast,
  });

  const { dueAt, reasonNotGiven, status } = marInfo || {};
  const { dosingUnit, endDate, isPrn, startDate } = medication || {};

  const { storedDateTimeToEpochMilliseconds } = useDateTime();
  const isDueBeforePrescriptionStart = getIsDueBeforePrescriptionStart({
    dueAt,
    startDate,
    storedDateTimeToEpochMilliseconds,
  });

  const isCreateBlockedByDischarge = useIsEncounterDischarged() && !marInfo?.status;

  const [isSelected, setIsSelected] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState('');
  const [showMarDetailsModal, setShowMarDetailsModal] = useState(false);
  const buttonRef = useRef(null);

  const isInactive = isDiscontinued || isEnd || isPaused;
  // Paused doses stay actionable, behind a warning modal
  const isDisabled =
    !canViewMedication ||
    isNotDue ||
    isDiscontinued ||
    isEnd ||
    !(canCreateMar || (status && canViewMar)) ||
    isCreateBlockedByDischarge;

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
    if (isDisabled || anchorEl) return;

    if (status) {
      handleOpenMarDetailsModal();
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

  const marStatus = {
    dosingUnit,
    dueAt,
    endDate,
    isAlert,
    isDiscontinued,
    isDueBeforePrescriptionStart,
    isEnd,
    isError,
    isNotDue,
    isPast,
    isPaused,
    isPrn,
    marDoses,
    marInfo,
    reasonNotGiven,
    status,
  };

  return (
    <>
      <MarStatusTooltip {...marStatus}>
        <MarCellButton
          ref={buttonRef}
          aria-selected={isSelected || undefined}
          data-discontinued={isDiscontinued || undefined}
          data-ended={isEnd || undefined}
          data-inactive={isInactive || undefined}
          data-paused={isPaused || undefined}
          disabled={isDisabled}
          onClick={onSelected}
        >
          <MarStatusLabel {...marStatus} />
          <MarDoseStatus {...marStatus} />
        </MarCellButton>
      </MarStatusTooltip>
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
