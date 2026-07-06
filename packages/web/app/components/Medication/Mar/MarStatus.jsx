import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import Box from '@mui/material/Box';
import { addHours, isSameDay } from 'date-fns';
import React, { useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import {
  ADMINISTRATION_STATUS,
  DRUG_UNIT_SHORT_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import {
  DateDisplay,
  EditedOrnament,
  TranslatedEnum,
  TranslatedText,
  useDateTime,
  useTranslation,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';
import { ConditionalTooltip } from '../../Tooltip';
import { WarningModal } from '../WarningModal';
import { MarDetails } from './MarDetails';
import { StatusPopper } from './StatusPopper';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';

const StatusContainer = styled.td`
  position: relative;
  ${p =>
    !p.$disabledClick &&
    (p.canCreateMar || (p.status && p.canViewMar)) &&
    css`
      cursor: pointer;
    `};
  ${p =>
    (p.isDiscontinued || p.isEnd || p.isPaused) &&
    css`
      background-image: linear-gradient(${p => p.theme.palette.divider} 1px, transparent 1px);
      background-size: 100% 5px;
      background-position: 0 2.5px;
    `}
  ${p =>
    p.isDisabled || p.isDiscontinued || p.isEnd
      ? css`
          background-color: ${Colors.background};
          color: ${p => p.theme.palette.text.tertiary};
        `
      : css`
          &:hover {
            background-color: ${p.$disabledClick ? 'transparent' : p.theme.palette.action.hover};
          }
        `}
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
    color: ${Colors.alert};
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

const DoseInfo = styled.div`
  text-align: center;
`;

const DiscontinuedDivider = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: ${Colors.midText};
`;

const TooltipText = styled.div`
  margin-block: 0;
  text-wrap: balance;
  p {
    margin-block: 0;
  }
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

const getIsDisabled = ({ hasRecord, timeSlot, selectedDate, now }) => {
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
  const { formatTime, getFacilityNowDate, toFacilityDateTime, storedDateTimeToEpochMilliseconds } =
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
  const [selectedElement, setSelectedElement] = useState(null);
  const [showMarDetailsModal, setShowMarDetailsModal] = useState(false);

  const containerRef = useRef(null);
  const isPast = getIsPast({ timeSlot, selectedDate, now: facilityNow });
  const isDisabled = getIsDisabled({
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

  const onSelected = event => {
    if (!canView || anchorEl || isDiscontinued || isDisabled || isEnd || !canViewMar) return;

    if (status) {
      handleOpenMarDetailsModal();
      return;
    }

    if (!canCreateMar) {
      return;
    }

    setSelectedElement(event.currentTarget);
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
    handleStatusPopperOpen(event);
  };

  const handleStatusPopperOpen = eventOrElement => {
    setIsSelected(true);
    const element = eventOrElement.currentTarget || eventOrElement;
    onAnchorElChange(element);
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
    if (selectedElement) {
      handleStatusPopperOpen({ currentTarget: selectedElement });
    }
  };

  const renderStatus = () => {
    if (!marInfo || isEnd || isDiscontinued || (!status && isPaused)) return null;
    switch (status) {
      case ADMINISTRATION_STATUS.GIVEN:
        return (
          <IconWrapper>
            <CheckCircleRoundedIcon style={{ color: Colors.green }} />
            {isAlert && <AlertOrnament />}
            {isEdited && <StyledEditedOrnament />}
          </IconWrapper>
        );
      case ADMINISTRATION_STATUS.NOT_GIVEN:
        return (
          <IconWrapper>
            <CancelRoundedIcon style={{ color: Colors.alert }} />
            {isAlert && <AlertOrnament />}
            {isEdited && <StyledEditedOrnament />}
          </IconWrapper>
        );
      default: {
        if (isPast) {
          return isPrn ? null : (
            <IconWrapper>
              <HelpOutlineIcon style={{ color: Colors.darkOrange }} />
            </IconWrapper>
          );
        }
        if (isVariableDose) {
          return (
            <DoseInfo>
              <TranslatedText stringId="medication.mar.status.doseDue" fallback="Dose due" />
            </DoseInfo>
          );
        }
        if (!dosingUnit) return null;
        return (
          <DoseInfo>
            <div>{doseAmount}</div>
            <div>
              <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />
            </div>
          </DoseInfo>
        );
      }
    }
  };

  const content = (() => {
    if (isDiscontinued) {
      return (
        <TooltipText>
          <TranslatedText
            stringId="medication.mar.medicationDiscontinued.tooltip"
            fallback="Medication discontinued"
          />
        </TooltipText>
      );
    }
    if (isEnd) {
      return (
        <TooltipText>
          <TranslatedText stringId="medication.mar.endsOn.tooltip" fallback="Ends on" />{' '}
          <DateDisplay date={endDate} timeFormat="default" noTooltip />
        </TooltipText>
      );
    }
    if (isPaused && !status) {
      return (
        <TooltipText>
          <TranslatedText
            stringId="medication.mar.medicationPaused.tooltip"
            fallback="Medication paused"
          />
        </TooltipText>
      );
    }
    if (marInfo) {
      switch (status) {
        case ADMINISTRATION_STATUS.NOT_GIVEN:
          return (
            <TooltipText>
              {isError && (
                <p>
                  <TranslatedText stringId="medication.mar.error" fallback="Error." />
                </p>
              )}
              {isAlert && !isError && (
                <p>
                  <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
                </p>
              )}
              <p>
                <TranslatedText stringId="medication.mar.notGiven" fallback="Not given." />
              </p>
              <p>{reasonNotGiven?.name}</p>
            </TooltipText>
          );
        case ADMINISTRATION_STATUS.GIVEN: {
          return (
            <TooltipText>
              <Box>
                {isError && <TranslatedText stringId="medication.mar.error" fallback="Error." />}
                {isAlert && !isError && (
                  <p>
                    <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
                  </p>
                )}
              </Box>
              {marDoses?.map(
                dose =>
                  !dose.isRemoved && (
                    <div key={dose?.id}>
                      {dose?.doseAmount}&nbsp;
                      <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />{' '}
                      <TranslatedText
                        stringId="medication.mar.givenAt.tooltip"
                        fallback="given at :time"
                        replacements={{ time: formatTime(dose?.givenTime) }}
                      />
                    </div>
                  ),
              )}
            </TooltipText>
          );
        }
        default:
          if (isDisabled) {
            return (
              <TooltipText>
                <TranslatedText
                  stringId="medication.mar.future.tooltip"
                  fallback="Cannot record future dose. Due at :dueAt."
                  replacements={{ dueAt: formatTime(dueAt) }}
                />
              </TooltipText>
            );
          }
          if (isPast) {
            return isPrn ? null : (
              <TooltipText>
                <TranslatedText
                  stringId="medication.mar.missed.tooltip"
                  fallback="Missed. Due at :dueAt."
                  replacements={{ dueAt: formatTime(dueAt) }}
                />
              </TooltipText>
            );
          }
          return (
            <TooltipText>
              <TranslatedText
                stringId="medication.mar.dueAt.tooltip"
                fallback="Due at :dueAt."
                replacements={{ dueAt: formatTime(dueAt) }}
              />
            </TooltipText>
          );
      }
    }
    return null;
  })();

  return (
    <>
      <StatusContainer
        aria-current={isCurrentTimeSlot ? 'time' : undefined}
        aria-selected={isSelected}
        ref={containerRef}
        onClick={onSelected}
        isDisabled={isDisabled}
        isDiscontinued={isDiscontinued}
        isEnd={isEnd}
        isPaused={isPaused}
        canCreateMar={canCreateMar}
        canViewMar={canViewMar}
        status={status}
        $disabledClick={!canView}
      >
        <ConditionalTooltip
          visible={Boolean(content)}
          title={content}
          PopperProps={{
            popperOptions: {
              positionFixed: true,
              modifiers: {
                preventOverflow: {
                  enabled: true,
                  boundariesElement: 'window',
                },
              },
            },
          }}
        >
          <VisuallyHidden>{content}</VisuallyHidden>
          {isPausedThenDiscontinued && <DiscontinuedDivider />}
          {renderStatus()}
        </ConditionalTooltip>
      </StatusContainer>
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
