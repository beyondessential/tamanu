import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { addHours, isSameDay } from 'date-fns';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import {
  ADMINISTRATION_STATUS,
  DRUG_UNIT_SHORT_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '@tamanu/constants';
import { TranslatedEnum, TranslatedText, DateDisplay, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { ConditionalTooltip } from '../../Tooltip';
import { useTranslation } from '../../../contexts/Translation';
import { StatusPopper } from './StatusPopper';
import { WarningModal } from '../WarningModal';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { MarDetails } from './MarDetails';
import { useMarDoses } from '../../../api/queries/useMarDoses';
import { useAuth } from '../../../contexts/Auth';

const StatusContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid ${Colors.outline};
  border-right: none;
  border-bottom: none;
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: -1px;
  margin-right: -1px;
  cursor: ${p =>
    p.$disabledClick
      ? 'default'
      : p.canCreateMar || (p.status && p.canViewMar)
      ? 'pointer'
      : 'default'};
  ${p =>
    (p.isDiscontinued || p.isEnd || p.isPaused) &&
    `background-image: linear-gradient(${Colors.outline} 1px, transparent 1px);
    background-size: 100% 5px;
    background-position: 0 2.5px;`}
  ${p =>
    p.isDisabled || p.isDiscontinued || p.isEnd
      ? `background-color: ${Colors.background}; color: ${Colors.softText};`
      : `&:hover {
    background-color: ${p.$disabledClick ? 'transparent' : Colors.veryLightBlue};
  }`}
`;

const IconWrapper = styled.div`
  height: 24px;
  .MuiSvgIcon-root {
    width: 24px;
    height: 24px;
    color: ${props => props.$color};
  }
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  position: absolute;
  right: 0px;
  bottom: 3px;
  font-size: 18px;
  &.MuiSvgIcon-root {
    color: ${Colors.alert};
    width: 16px;
  }
`;

const EditedIcon = styled.span`
  position: absolute;
  right: 3px;
  top: 2px;
`;

const DoseInfo = styled.div`
  text-align: center;
  font-size: 12px;
`;

const SelectedOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: all 0.2s;
  opacity: ${p => (p.isSelected && !p.isDisabled ? 1 : 0)};
  border: 1px solid ${Colors.primary};
`;

const DiscontinuedDivider = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: ${Colors.midText};
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
}) => {
  if (isRecordedStatus || !discontinuedDate || nextMarInfo?.status) {
    return false;
  }

  if (dueAt) {
    return new Date(dueAt) > new Date(discontinuedDate);
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
  return isPreviouslyPaused && isDiscontinued && toFacilityDate(discontinuedDate, toFacilityDateTime) >= startDateOfSlot;
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
  const { getEnumTranslation } = useTranslation();
  const { formatTimeCompact, getFacilityNowDate, toFacilityDateTime } = useDateTime();
  const facilityNow = getFacilityNowDate();
  const { ability } = useAuth();
  const canViewMar = ability.can('read', 'MedicationAdministration');
  const canCreateMar = ability.can('create', 'MedicationAdministration');
  const canViewSensitiveMedications = ability.can('read', 'SensitiveMedication');
  const isSensitive = medication?.medication?.referenceDrug?.isSensitive;

  const { dueAt, recordedAt, status, reasonNotGiven, isAutoGenerated, isEdited } = marInfo || {};
  const { doseAmount, isPrn, units, discontinuedDate, endDate, isVariableDose } = medication || {};

  const [isSelected, setIsSelected] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [showMarDetailsModal, setShowMarDetailsModal] = useState(false);

  const containerRef = useRef(null);
  const isPast = getIsPast({ timeSlot, selectedDate, now: facilityNow });
  const isDisabled = getIsDisabled({ hasRecord: !!marInfo, timeSlot, selectedDate, now: facilityNow });
  const isFuture = getDateFromTimeString(timeSlot.startTime, selectedDate) > facilityNow;
  const isCurrent = getIsCurrent({ timeSlot, selectedDate, now: facilityNow });
  const isDiscontinued = getIsDiscontinued({
    discontinuedDate,
    dueAt,
    isRecordedStatus: !!recordedAt,
    timeSlot,
    selectedDate,
    nextMarInfo,
    toFacilityDateTime,
  });
  const isEnd = getIsEnd({ endDate, hasRecord: !!marInfo, timeSlot, selectedDate, toFacilityDateTime });
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

  const isRecordedOutsideAdministrationSchedule =
    !isAutoGenerated || new Date(recordedAt) < new Date(dueAt) || (isPrn && isPast);
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
    if (isSensitive && !canViewSensitiveMedications) {
      return;
    }
    if (anchorEl) return;
    if (isDiscontinued || isDisabled || isEnd || !canViewMar) return;

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
          <IconWrapper $color={Colors.green}>
            <CheckCircleIcon />
            {isAlert && <StyledPriorityHighIcon />}
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      case ADMINISTRATION_STATUS.NOT_GIVEN:
        return (
          <IconWrapper $color={Colors.alert}>
            <CancelIcon />
            {isAlert && <StyledPriorityHighIcon />}
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      default: {
        if (isPast) {
          return isPrn ? null : (
            <IconWrapper $color={Colors.darkOrange}>
              <HelpOutlineIcon />
            </IconWrapper>
          );
        }
        if (!units) return null;
        if (isVariableDose) {
          return (
            <DoseInfo>
              <TranslatedText stringId="medication.mar.status.doseDue" fallback="Dose due" />
            </DoseInfo>
          );
        }
        return (
          <DoseInfo>
            <div>
              {isVariableDose ? (
                <TranslatedText stringId="medication.table.variable" fallback="Variable" />
              ) : (
                doseAmount
              )}
            </div>
            <div>{units ? getEnumTranslation(DRUG_UNIT_SHORT_LABELS, units) : ''}</div>
          </DoseInfo>
        );
      }
    }
  };

  const getTooltipText = () => {
    if (isDiscontinued) {
      return (
        <Box maxWidth={69}>
          <TranslatedText
            stringId="medication.mar.medicationDiscontinued.tooltip"
            fallback="Medication discontinued"
          />
        </Box>
      );
    }
    if (isEnd) {
      return (
        <Box maxWidth={105}>
          <TranslatedText stringId="medication.mar.endsOn.tooltip" fallback="Ends on" />
          <DateDisplay date={endDate} timeFormat="compact" noTooltip />
        </Box>
      );
    }
    if (isPaused && !status) {
      return (
        <Box maxWidth={69}>
          <TranslatedText
            stringId="medication.mar.medicationPaused.tooltip"
            fallback="Medication paused"
          />
        </Box>
      );
    }
    if (marInfo) {
      switch (status) {
        case ADMINISTRATION_STATUS.NOT_GIVEN:
          return (
            <>
              <Box>
                {isError && <TranslatedText stringId="medication.mar.error" fallback="Error." />}
                {isAlert && !isError && (
                  <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
                )}
              </Box>
              <div>{reasonNotGiven?.name}</div>
            </>
          );
        case ADMINISTRATION_STATUS.GIVEN: {
          return (
            <Box maxWidth={73}>
              <Box>
                {isError && <TranslatedText stringId="medication.mar.error" fallback="Error." />}
                {isAlert && !isError && (
                  <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
                )}
              </Box>
              {marDoses?.map(
                dose =>
                  !dose.isRemoved && (
                    <div key={dose?.id}>
                      <span>{dose?.doseAmount}</span>{' '}
                      <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={units} />{' '}
                      <TranslatedText
                        stringId="medication.mar.givenAt.tooltip"
                        fallback="given at :time"
                        replacements={{
                          time: formatTimeCompact(dose?.givenTime),
                        }}
                      />
                    </div>
                  ),
              )}
            </Box>
          );
        }
        default:
          if (isDisabled) {
            return (
              <Box maxWidth={73}>
                <TranslatedText
                  stringId="medication.mar.future.tooltip"
                  fallback="Cannot record future dose. Due at :dueAt."
                  replacements={{
                    dueAt: formatTimeCompact(dueAt),
                  }}
                />
              </Box>
            );
          }
          if (isPast) {
            return isPrn ? null : (
              <Box maxWidth={69}>
                <TranslatedText
                  stringId="medication.mar.missed.tooltip"
                  fallback="Missed. Due at :dueAt"
                  replacements={{
                    dueAt: formatTimeCompact(dueAt),
                  }}
                />
              </Box>
            );
          }
          return (
            <Box maxWidth={69}>
              <TranslatedText
                stringId="medication.mar.dueAt.tooltip"
                fallback="Due at :dueAt"
                replacements={{
                  dueAt: formatTimeCompact(dueAt),
                }}
              />
            </Box>
          );
      }
    }
    return null;
  };

  return (
    <>
      <ConditionalTooltip
        visible={getTooltipText()}
        title={<Box fontWeight={400}>{getTooltipText()}</Box>}
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
        <StatusContainer
          ref={containerRef}
          onClick={onSelected}
          isDisabled={isDisabled}
          isDiscontinued={isDiscontinued}
          isEnd={isEnd}
          isPaused={isPaused}
          canCreateMar={canCreateMar}
          canViewMar={canViewMar}
          status={status}
          $disabledClick={isSensitive && !canViewSensitiveMedications}
        >
          {isPausedThenDiscontinued && <DiscontinuedDivider />}
          {renderStatus()}
          <SelectedOverlay isSelected={isSelected} isDisabled={isDisabled || isEnd} />
        </StatusContainer>
      </ConditionalTooltip>
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
