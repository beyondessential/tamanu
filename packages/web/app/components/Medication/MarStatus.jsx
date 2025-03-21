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
import { StatusPopper } from './StatusPopper';
import { WarningModal } from './WarningModal';
import { MAR_WARNING_MODAL } from '../../constants/medication';
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

const getIsPast = (timeSlot, selectedDate) => {
  const endDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return new Date() > endDate;
};

const getIsFuture = (timeSlot, selectedDate) => {
  const startDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  return startDate > new Date();
};

const getIsDisabled = (hasRecord, timeSlot, selectedDate) => {
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
  administeredAt,
  status,
  doseAmount,
  isPrn,
  units,
  isAlert = false,
  isEdited = false,
  selectedDate,
  timeSlot,
  discontinuedDate,
  endDate,
  marId,
  reasonNotGiven,
  prescriptionId,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);

  const containerRef = useRef(null);

  const isPast = getIsPast(timeSlot, selectedDate);
  const isFuture = getIsFuture(timeSlot, selectedDate);

  const isDisabled = getIsDisabled(!!administeredAt, timeSlot, selectedDate);
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

  const onSelected = event => {
    if (isDiscontinued || isDisabled) return;
    if ([ADMINISTRATION_STATUS.NOT_GIVEN, ADMINISTRATION_STATUS.GIVEN].includes(status)) {
      setIsSelected(true);
      return;
    }
    if (isPast) {
      setSelectedElement(event.currentTarget);
      setShowWarningModal(MAR_WARNING_MODAL.PAST);
      return;
    }
    if (isFuture) {
      setSelectedElement(event.currentTarget);
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

    switch (status) {
      case ADMINISTRATION_STATUS.NOT_GIVEN:
        return (
          <>
            <TranslatedText stringId="medication.mar.notGiven.tooltip" fallback="Not given." />
            <div>{reasonNotGiven?.name}</div>
          </>
        );
      default:
        if (isDisabled) {
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
        if (isPast) {
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
  };

  const handleConfirm = () => {
    setShowWarningModal('');
    if (selectedElement) {
      handleStatusPopperOpen({ currentTarget: selectedElement });
    }
  };

  return (
    <>
      <ConditionalTooltip
        visible={isDiscontinued || isEnd || administeredAt}
        title={<Box fontWeight={400}>{getTooltipText()}</Box>}
      >
        <StatusContainer
          ref={containerRef}
          onClick={onSelected}
          isDisabled={isDisabled}
          isDiscontinued={isDiscontinued}
          isEnd={isEnd}
        >
          {administeredAt && !isDiscontinued && renderStatus()}
          <SelectedOverlay isSelected={isSelected} isDisabled={isDisabled} />
        </StatusContainer>
      </ConditionalTooltip>

      <StatusPopper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        marId={marId}
        administeredAt={
          administeredAt ? administeredAt : getDateFromTimeString(timeSlot.startTime, selectedDate)
        }
        prescriptionId={prescriptionId}
      />
      <WarningModal
        modal={showWarningModal}
        onClose={() => setShowWarningModal('')}
        onConfirm={handleConfirm}
      />
    </>
  );
};
