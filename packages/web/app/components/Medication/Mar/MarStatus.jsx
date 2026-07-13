import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { addHours, isSameDay } from 'date-fns';
import React, { forwardRef, useRef, useState } from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { EditedOrnament, useDateTime, useTranslation } from '@tamanu/ui-components';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { useAuth } from '../../../contexts/Auth';
import { WarningModal } from '../WarningModal';
import { MarDetails } from './MarDetails';
import MarDoseInfo from './MarDoseInfo';
import MarStatusIcon from './MarStatusIcon';
import { MarStatusTooltip } from './MarStatusTooltip';
import { StatusPopper } from './StatusPopper';
import TableCellButton from './TableCellButton';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';

const TableDataCell = styled(
  forwardRef(function (
    {
      canCreateMar,
      canViewMar,
      children,
      disabled,
      isDiscontinued,
      isEnd,
      isPaused,
      onClick,
      status,
      ...props
    },
    ref,
  ) {
    const isInactive = isDiscontinued || isEnd || isPaused;
    return (
      <td
        ref={ref}
        data-discontinued={isDiscontinued || undefined}
        data-ended={isEnd || undefined}
        data-inactive={isInactive || undefined}
        data-paused={isPaused || undefined}
        {...props}
      >
        <TableCellButton
          disabled={disabled || isInactive || !(canCreateMar || (status && canViewMar))}
          onClick={onClick}
        >
          {children}
        </TableCellButton>
      </td>
    );
  }),
)`
  position: relative;

  &[data-inactive='true'] {
    background-image: linear-gradient(${p => p.theme.palette.divider} 1px, transparent 1px);
    background-size: 100% 5px;
    background-position: 0 2.5px;
  }

  &[data-discontinued='true'],
  &[data-ended='true'] {
    background-color: ${p => p.theme.palette.background.default};
    color: ${p => p.theme.palette.text.tertiary};
  }

  &&[aria-selected='true'] {
    background-color: ${p => p.theme.palette.background.paper};
    border: 1px solid ${p => p.theme.palette.primary.main};
  }
`;

const IconWrapper = styled.div`
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
  .MuiSvgIcon-root {
    font-size: 24px;
  }
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  inset-block-end: 3px;
  inset-inline-end: 0;
  position: absolute;
  &.MuiSvgIcon-root {
    color: ${p => p.theme.palette.error.main};
    font-size: 18px;
  }
`;

function AlertOrnament(props) {
  const { getTranslation } = useTranslation();
  return (
    <StyledPriorityHighIcon
      aria-hidden={undefined}
      aria-label={getTranslation('medication.mar.alert', 'Alert.')}
      {...props}
    />
  );
}

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

const getIsPast = ({ timeSlot, selectedDate, now }) => {
  const slotEndDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return now > slotEndDate;
};

const getIsCurrent = ({ timeSlot, selectedDate, now }) => {
  const slotStartDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  const slotEndDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return now >= slotStartDate && now < slotEndDate;
};

const getIsNotDue = ({ hasRecord, timeSlot, selectedDate, now }) => {
  const slotStartDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  if (!hasRecord || !isSameDay(selectedDate, now)) {
    return slotStartDate > now;
  }
  return slotStartDate > addHours(now, 2);
};

const toFacilityDate = (dateStr, toFacilityDateTime) => {
  if (!dateStr) return null;
  const facilityStr = toFacilityDateTime(dateStr);
  return facilityStr ? new Date(facilityStr) : new Date(dateStr);
};

const getIsEnd = ({ endDate, hasRecord, timeSlot, selectedDate, toFacilityDateTime }) => {
  if (hasRecord) {
    return false;
  }
  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  const endDateFacility = toFacilityDate(endDate, toFacilityDateTime);
  if (!endDateFacility) return false;
  return endDateFacility < endDateOfSlot;
};

const getIsDiscontinued = ({
  discontinuedDate,
  dueAt,
  isRecordedStatus,
  timeSlot,
  selectedDate,
  nextMarInfo,
  toFacilityDateTime,
  storedDateTimeToEpochMilliseconds,
}) => {
  if (isRecordedStatus || !discontinuedDate || nextMarInfo?.status) {
    return false;
  }

  if (dueAt) {
    const dueAtMs = storedDateTimeToEpochMilliseconds(dueAt);
    const discontinuedDateMs = storedDateTimeToEpochMilliseconds(discontinuedDate);
    // Fail-open: if dates can't be parsed, assume not discontinued to avoid blocking medication administration
    if (dueAtMs == null || discontinuedDateMs == null) return false;
    return dueAtMs > discontinuedDateMs;
  }

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return toFacilityDate(discontinuedDate, toFacilityDateTime) < endDateOfSlot;
};

const getIsPaused = ({ pauseRecords, timeSlot, selectedDate, recordedAt, toFacilityDateTime }) => {
  if (!pauseRecords?.length) return false;

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);

  return pauseRecords.some(pauseRecord => {
    const pauseStartDate = toFacilityDate(pauseRecord.pauseStartDate, toFacilityDateTime);
    const pauseEndDate = toFacilityDate(pauseRecord.pauseEndDate, toFacilityDateTime);

    if (recordedAt && toFacilityDate(recordedAt, toFacilityDateTime) <= pauseStartDate) {
      return false;
    }

    return pauseStartDate < endDateOfSlot && pauseEndDate >= endDateOfSlot;
  });
};

const getIsPausedThenDiscontinued = ({
  isPreviouslyPaused,
  isDiscontinued,
  timeSlot,
  selectedDate,
  discontinuedDate,
  toFacilityDateTime,
}) => {
  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);
  return (
    isPreviouslyPaused &&
    isDiscontinued &&
    toFacilityDate(discontinuedDate, toFacilityDateTime) >= startDateOfSlot
  );
};

export const MarStatus = ({
  selectedDate,
  timeSlot,
  marInfo,
  previousMarInfo,
  nextMarInfo,
  medication,
  pauseRecords,
  anchorEl,
  onAnchorElChange,
}) => {
  const { data: { data: marDoses = [] } = {} } = useMarDoses(marInfo?.id);
  const { getFacilityNowDate, toFacilityDateTime, storedDateTimeToEpochMilliseconds } =
    useDateTime();
  const facilityNow = getFacilityNowDate();
  const { ability } = useAuth();
  const canViewMar = ability.can('read', 'MedicationAdministration');
  const canCreateMar = ability.can('create', 'MedicationAdministration');
  const canView =
    !medication?.medication?.referenceDrug?.isSensitive ||
    ability.can('read', 'SensitiveMedication');

  const { dueAt, recordedAt, status, reasonNotGiven, isAutoGenerated, isEdited } = marInfo || {};
  const { doseAmount, isPrn, dosingUnit, discontinuedDate, endDate, isVariableDose } =
    medication || {};

  const [isSelected, setIsSelected] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState('');
  const [showMarDetailsModal, setShowMarDetailsModal] = useState(false);

  const containerRef = useRef(null);
  const isPast = getIsPast({ timeSlot, selectedDate, now: facilityNow });
  const isNotDue = getIsNotDue({
    hasRecord: !!marInfo,
    timeSlot,
    selectedDate,
    now: facilityNow,
  });
  const isFuture = getDateFromTimeString(timeSlot.startTime, selectedDate) > facilityNow;
  const isCurrent = getIsCurrent({ timeSlot, selectedDate, now: facilityNow });
  const isCurrentTimeSlot = useIsCurrentTimeSlot({
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    selectedDate,
  });
  const isDiscontinued = getIsDiscontinued({
    discontinuedDate,
    dueAt,
    isRecordedStatus: !!recordedAt,
    timeSlot,
    selectedDate,
    nextMarInfo,
    toFacilityDateTime,
    storedDateTimeToEpochMilliseconds,
  });
  const isEnd = getIsEnd({
    endDate,
    hasRecord: !!marInfo,
    timeSlot,
    selectedDate,
    toFacilityDateTime,
  });
  const isPaused = getIsPaused({
    pauseRecords: pauseRecords?.data,
    timeSlot,
    selectedDate,
    recordedAt,
    toFacilityDateTime,
  });

  const previousTimeSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(
    slot => slot.endTime === timeSlot.startTime,
  );
  const isPreviouslyPaused =
    previousTimeSlot &&
    getIsPaused({
      pauseRecords: pauseRecords?.data,
      timeSlot: previousTimeSlot,
      selectedDate,
      recordedAt: previousMarInfo?.recordedAt,
      toFacilityDateTime,
    });

  const isPausedThenDiscontinued = getIsPausedThenDiscontinued({
    isPreviouslyPaused,
    isDiscontinued,
    timeSlot,
    selectedDate,
    discontinuedDate,
    toFacilityDateTime,
  });

  const recordedAtMs = storedDateTimeToEpochMilliseconds(recordedAt);
  const dueAtMs = storedDateTimeToEpochMilliseconds(dueAt);
  const isRecordedOutsideAdministrationSchedule =
    !isAutoGenerated ||
    (recordedAtMs != null && dueAtMs != null && recordedAtMs < dueAtMs) ||
    (isPrn && isPast);
  const isDoseAmountNotMatch =
    !isVariableDose &&
    status === ADMINISTRATION_STATUS.GIVEN &&
    marDoses?.some(dose => Number(dose.doseAmount) !== Number(doseAmount));
  const isRecordedDuringPaused = !!recordedAt && isPaused;
  const isMultipleDoses = marDoses?.length > 1;
  const isError = marInfo?.isError;
  const isAlert =
    !!recordedAt &&
    (isRecordedOutsideAdministrationSchedule ||
      isDoseAmountNotMatch ||
      isRecordedDuringPaused ||
      isMultipleDoses ||
      isError);

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

  const handleStatusPopperOpen = () => {
    setIsSelected(true);
    onAnchorElChange(containerRef.current);
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
        return (
          <MarDoseInfo
            doseAmount={doseAmount}
            dosingUnit={dosingUnit}
            isVariableDose={isVariableDose}
          />
        );
      }
    }
  };

  return (
    <>
      <TableDataCell
        aria-current={isCurrentTimeSlot ? 'time' : undefined}
        aria-selected={isSelected || undefined}
        ref={containerRef}
        onClick={onSelected}
        isDiscontinued={isDiscontinued}
        isEnd={isEnd}
        isPaused={isPaused}
        canCreateMar={canCreateMar}
        canViewMar={canViewMar}
        status={status}
        disabled={!canView || isNotDue}
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
      </TableDataCell>
      <StatusPopper
        open={!!anchorEl && !!containerRef.current && anchorEl === containerRef.current}
        anchorEl={anchorEl}
        onClose={handleClose}
        timeSlot={timeSlot}
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
};
