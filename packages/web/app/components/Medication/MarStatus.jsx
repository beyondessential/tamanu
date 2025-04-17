import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { addHours, format } from 'date-fns';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import {
  ADMINISTRATION_STATUS,
  DRUG_UNIT_SHORT_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { ConditionalTooltip } from '../Tooltip';
import { useTranslation } from '../../contexts/Translation';
import { StatusPopper } from './StatusPopper';
import { WarningModal } from './WarningModal';
import { MAR_WARNING_MODAL } from '../../constants/medication';

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
  ${p =>
    (p.isDiscontinued || p.isEnd || p.isPaused) &&
    `background-image: linear-gradient(${Colors.outline} 1px, transparent 1px);
    background-size: 100% 5px;
    background-position: 0 2.5px;`}
  ${p =>
    p.isDisabled || p.isDiscontinued || p.isEnd
      ? `background-color: ${Colors.background}; color: ${Colors.softText};`
      : `&:hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
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

const getIsPast = ({ timeSlot, selectedDate }) => {
  const endDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date() > endDate;
};

const getIsDisabled = ({ hasRecord, timeSlot, selectedDate }) => {
  const startDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  if (!hasRecord) {
    return startDate > new Date();
  }
  return startDate > addHours(new Date(), 2);
};

const getIsEnd = ({ endDate, hasRecord, timeSlot, selectedDate }) => {
  if (hasRecord) {
    return false;
  }
  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date(endDate) < endDateOfSlot;
};

const getIsDiscontinued = ({
  discontinuedDate,
  dueAt,
  isRecordedStatus,
  timeSlot,
  selectedDate,
  nextMarInfo,
}) => {
  if (isRecordedStatus || !discontinuedDate || nextMarInfo?.status) {
    return false;
  }

  if (dueAt) {
    return new Date(dueAt) > new Date(discontinuedDate);
  }

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date(discontinuedDate) < endDateOfSlot;
};

const getIsPaused = ({ pauseRecords, timeSlot, selectedDate, isRecordedStatus }) => {
  if (!pauseRecords?.length) return false;

  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);
  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);

  return pauseRecords.some(pauseRecord => {
    const pauseStartDate = new Date(pauseRecord.pauseStartDate);
    const pauseEndDate = new Date(pauseRecord.pauseEndDate);

    if (isRecordedStatus) {
      return pauseStartDate < startDateOfSlot && pauseEndDate > startDateOfSlot;
    }

    return pauseStartDate < endDateOfSlot && pauseEndDate > startDateOfSlot;
  });
};

const getIsPausedThenDiscontinued = ({
  isPreviouslyPaused,
  isDiscontinued,
  timeSlot,
  selectedDate,
  discontinuedDate,
}) => {
  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);
  return isPreviouslyPaused && isDiscontinued && new Date(discontinuedDate) >= startDateOfSlot;
};

export const MarStatus = ({
  isAlert = false,
  isEdited = false,
  selectedDate,
  timeSlot,
  marInfo,
  previousMarInfo,
  nextMarInfo,
  medication,
  pauseRecords,
}) => {
  const { dueAt, status, reasonNotGiven, doses } = marInfo || {};
  const { doseAmount, isPrn, units, discontinuedDate, endDate, isVariableDose } = medication || {};

  const [isSelected, setIsSelected] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);

  const containerRef = useRef(null);
  const isPast = getIsPast({ timeSlot, selectedDate });
  const isDisabled = getIsDisabled({ hasRecord: !!marInfo, timeSlot, selectedDate });
  const isDiscontinued = getIsDiscontinued({
    discontinuedDate,
    dueAt,
    isRecordedStatus: !!status,
    timeSlot,
    selectedDate,
    nextMarInfo,
  });
  const isEnd = getIsEnd({ endDate, hasRecord: !!marInfo, timeSlot, selectedDate });
  const isPaused = getIsPaused({
    pauseRecords: pauseRecords?.data,
    isRecordedStatus: !!status,
    timeSlot,
    selectedDate,
  });

  const previousTimeSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(
    slot => slot.endTime === timeSlot.startTime,
  );
  const isPreviouslyPaused =
    previousTimeSlot &&
    previousMarInfo &&
    getIsPaused({
      pauseRecords: pauseRecords?.data,
      isRecordedStatus: !!previousMarInfo?.status,
      timeSlot: previousTimeSlot,
      selectedDate,
    });

  const isPausedThenDiscontinued = getIsPausedThenDiscontinued({
    isPreviouslyPaused,
    isDiscontinued,
    timeSlot,
    selectedDate,
    discontinuedDate,
  });

  const { getEnumTranslation } = useTranslation();

  useEffect(() => {
    const handleClickOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onSelected = event => {
    if (isDiscontinued || isDisabled) return;
    if ([ADMINISTRATION_STATUS.NOT_GIVEN, ADMINISTRATION_STATUS.GIVEN].includes(status)) {
      setIsSelected(true);
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
    if (isDisabled) {
      setShowWarningModal(MAR_WARNING_MODAL.FUTURE);
      return;
    }
    handleStatusPopperOpen(event);
  };

  const handleStatusPopperOpen = eventOrElement => {
    setIsSelected(true);
    const element = eventOrElement.currentTarget || eventOrElement;
    setAnchorEl(element);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsSelected(false);
  };

  const handleConfirm = () => {
    setShowWarningModal('');
    if (selectedElement) {
      handleStatusPopperOpen({ currentTarget: selectedElement });
    }
  };

  const renderStatus = () => {
    if (!marInfo || isDiscontinued) return null;
    let color = Colors.green;
    switch (status) {
      case ADMINISTRATION_STATUS.GIVEN:
        return (
          <IconWrapper $color={color}>
            <CheckCircleIcon />
            {isAlert && <StyledPriorityHighIcon />}
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      case ADMINISTRATION_STATUS.NOT_GIVEN:
        color = Colors.alert;
        return (
          <IconWrapper $color={color}>
            <CancelIcon />
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      default: {
        if (isPast) {
          if (isPrn) return null;
          color = Colors.darkOrange;
          return (
            <IconWrapper $color={color}>
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
          <div>{format(new Date(endDate), 'dd/MM/yyyy hh:mma').toLowerCase()}</div>
        </Box>
      );
    }
    if (marInfo) {
      switch (status) {
        case ADMINISTRATION_STATUS.NOT_GIVEN:
          return (
            <>
              <TranslatedText stringId="medication.mar.notGiven.tooltip" fallback="Not given." />
              <div>{reasonNotGiven?.name}</div>
            </>
          );
        case ADMINISTRATION_STATUS.GIVEN: {
          console.log('doses', doses);
          
          const firstDose = doses?.[0];
          if (!firstDose) return null;
          return (
            <Box maxWidth={73}>
              <TranslatedText
                stringId="medication.mar.givenAt.tooltip"
                fallback=":doses given at :time"
                replacements={{
                  doses: `${firstDose?.doseAmount} ${units}`,
                  time: format(new Date(firstDose?.givenTime), 'hh:mma').toLowerCase(),
                }}
              />
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
                    dueAt: format(new Date(dueAt), 'h:mma').toLowerCase(),
                  }}
                />
              </Box>
            );
          }
          if (isPast) {
            return (
              <Box maxWidth={69}>
                <TranslatedText
                  stringId="medication.mar.missed.tooltip"
                  fallback="Missed. Due at :dueAt"
                  replacements={{
                    dueAt: format(new Date(dueAt), 'hh:mma').toLowerCase(),
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
                  dueAt: format(new Date(dueAt), 'hh:mma').toLowerCase(),
                }}
              />
            </Box>
          );
      }
    }
    if (isPaused) {
      return (
        <Box maxWidth={69}>
          <TranslatedText
            stringId="medication.mar.medicationPaused.tooltip"
            fallback="Medication paused"
          />
        </Box>
      );
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
        >
          {isPausedThenDiscontinued && <DiscontinuedDivider />}
          {renderStatus()}
          <SelectedOverlay isSelected={isSelected} isDisabled={isDisabled} />
        </StatusContainer>
      </ConditionalTooltip>
      <StatusPopper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        timeSlot={timeSlot}
        selectedDate={selectedDate}
        marInfo={marInfo}
        medication={medication}
      />
      <WarningModal
        modal={showWarningModal}
        onClose={() => setShowWarningModal('')}
        onConfirm={handleConfirm}
        isPast={isPast}
      />
    </>
  );
};
