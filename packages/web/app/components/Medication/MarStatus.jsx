import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { addHours, format } from 'date-fns';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { ADMINISTRATION_STATUS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { ConditionalTooltip } from '../Tooltip';
import { getDose } from '../../utils/medications';
import { useTranslation } from '../../contexts/Translation';

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
    p.isFuture || p.isDiscontinued || p.isEnd
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
  opacity: ${p => (p.isSelected && !p.isFuture ? 1 : 0)};
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

const getIsMissed = ({ timeSlot, selectedDate }) => {
  const endDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date() > endDate;
};

const getIsFuture = ({ hasRecord, timeSlot, selectedDate }) => {
  const startDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  if (!hasRecord) {
    return startDate > new Date();
  }
  return startDate > addHours(new Date(), 2);
};

const getIsEnd = ({ endDate, administeredAt, timeSlot, selectedDate }) => {
  if (administeredAt) {
    return new Date(endDate) < new Date(administeredAt);
  }
  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date(endDate) < endDateOfSlot;
};

const getIsPaused = ({
  pauseRecords,
  administeredAt,
  timeSlot,
  selectedDate,
  isRecordedStatus,
}) => {
  if (!pauseRecords?.length) return false;

  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);
  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);

  return pauseRecords.some(pauseRecord => {
    const pauseStartDate = new Date(pauseRecord.pauseStartDate);
    const pauseEndDate = new Date(pauseRecord.pauseEndDate);

    if (isRecordedStatus) {
      return pauseStartDate <= startDateOfSlot && pauseEndDate >= endDateOfSlot;
    }

    if (administeredAt) {
      const administeredAtDate = new Date(administeredAt);
      return pauseStartDate <= administeredAtDate && pauseEndDate >= administeredAtDate;
    }

    return pauseStartDate < endDateOfSlot && pauseEndDate > startDateOfSlot;
  });
};

const getIsPausedThenDiscontinued = ({
  discontinuedDate,
  timeSlot,
  selectedDate,
  isPreviouslyPaused,
  isDiscontinued,
}) => {
  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);

  return (
    isPreviouslyPaused &&
    isDiscontinued &&
    new Date(discontinuedDate).getTime() - startDateOfSlot.getTime() > 0
  );
};

export const MarStatus = ({
  isAlert = false,
  isEdited = false,
  selectedDate,
  timeSlot,
  marInfo,
  previousMarInfo,
  medication,
  pauseRecords,
}) => {
  const { administeredAt, status } = marInfo || {};
  const { doseAmount, isPrn, units, discontinuedDate, endDate, isVariableDose } = medication || {};

  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef(null);
  const isMissed = getIsMissed({ timeSlot, selectedDate });
  const isFuture = getIsFuture({ hasRecord: !!marInfo, timeSlot, selectedDate });
  const isDiscontinued = getIsEnd({
    endDate: discontinuedDate,
    administeredAt,
    timeSlot,
    selectedDate,
  });
  const isEnd = getIsEnd({ endDate, administeredAt, timeSlot, selectedDate });
  const isPaused = getIsPaused({
    pauseRecords: pauseRecords?.data,
    isRecordedStatus: !!status,
    administeredAt,
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
      administeredAt: previousMarInfo?.administeredAt,
      timeSlot: previousTimeSlot,
      selectedDate,
    });

  const isPausedThenDiscontinued = getIsPausedThenDiscontinued({
    discontinuedDate,
    administeredAt,
    timeSlot,
    selectedDate,
    isPreviouslyPaused,
    isDiscontinued,
  });

  const { getTranslation, getEnumTranslation } = useTranslation();

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

  const onSelected = () => {
    if (!isDiscontinued) {
      setIsSelected(true);
    }
  };

  const renderStatus = () => {
    if (!marInfo) return null;
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
        if (isMissed) {
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
            {getDose({ doseAmount, units, isPrn }, getTranslation, getEnumTranslation)}
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
      if (isFuture) {
        return (
          <Box maxWidth={73}>
            <TranslatedText
              stringId="medication.mar.future.tooltip"
              fallback="Cannot record future dose. Due at :dueAt."
              replacements={{
                dueAt: format(new Date(administeredAt), 'h:mma').toLowerCase(),
              }}
            />
          </Box>
        );
      }
      if (isMissed) {
        return (
          <Box maxWidth={69}>
            <TranslatedText
              stringId="medication.mar.missed.tooltip"
              fallback="Missed. Due at :dueAt"
              replacements={{
                dueAt: format(new Date(administeredAt), 'hh:mma').toLowerCase(),
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
              dueAt: format(new Date(administeredAt), 'hh:mma').toLowerCase(),
            }}
          />
        </Box>
      );
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
    <ConditionalTooltip
      visible={getTooltipText()}
      title={<Box fontWeight={400}>{getTooltipText()}</Box>}
    >
      <StatusContainer
        ref={containerRef}
        onClick={onSelected}
        isFuture={isFuture}
        isDiscontinued={isDiscontinued}
        isEnd={isEnd}
        isPaused={isPaused}
      >
        {isPausedThenDiscontinued && <DiscontinuedDivider />}
        {renderStatus()}
        <SelectedOverlay isSelected={isSelected} isFuture={isFuture} />
      </StatusContainer>
    </ConditionalTooltip>
  );
};
