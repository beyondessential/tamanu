import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { addHours, format } from 'date-fns';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { ADMINISTRATION_STATUS } from '@tamanu/constants';
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
    (p.isDiscontinued || p.isEnd) &&
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

const getIsMissed = (timeSlot, selectedDate) => {
  const endDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date() > endDate;
};

const getIsFuture = (hasRecord, timeSlot, selectedDate) => {
  const startDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  if (!hasRecord) {
    return startDate > new Date();
  }
  return startDate > addHours(new Date(), 2);
};

const getIsEnd = (endDate, administeredAt, timeSlot, selectedDate) => {
  if (administeredAt) {
    return new Date(endDate) < new Date(administeredAt);
  }
  const startDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  return new Date(endDate) < startDate;
};

export const MarStatus = ({
  isAlert = false,
  isEdited = false,
  selectedDate,
  timeSlot,
  marInfo,
  medication,
}) => {
  const { administeredAt, status } = marInfo || {};
  const { doseAmount, isPrn, units, discontinuedDate, endDate } = medication || {};

  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef(null);
  const isMissed = getIsMissed(timeSlot, selectedDate);
  const isFuture = getIsFuture(!!administeredAt, timeSlot, selectedDate);
  const isDiscontinued = getIsEnd(discontinuedDate, administeredAt, timeSlot, selectedDate);
  const isEnd = getIsEnd(endDate, administeredAt, timeSlot, selectedDate);

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
    if (!administeredAt) return;
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
  };

  return (
    <ConditionalTooltip
      visible={isDiscontinued || isEnd || administeredAt}
      title={<Box fontWeight={400}>{getTooltipText()}</Box>}
    >
      <StatusContainer
        ref={containerRef}
        onClick={onSelected}
        isFuture={isFuture}
        isDiscontinued={isDiscontinued}
        isEnd={isEnd}
      >
        {administeredAt && !isDiscontinued && renderStatus()}
        <SelectedOverlay isSelected={isSelected} isFuture={isFuture} />
      </StatusContainer>
    </ConditionalTooltip>
  );
};
