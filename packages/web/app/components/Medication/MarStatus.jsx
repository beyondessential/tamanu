import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { Colors } from '../../constants';

const StatusContainer = styled.div`
  position: relative;
  width: 48px;
  height: 63px;
  border: 1px solid ${props => (props.isSelected ? Colors.primary : Colors.outline)};
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  ${props =>
    props.isFuture
      ? `opacity: 0.38;`
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
    color: ${props => {
      switch (props.status) {
        case ADMINISTRATION_STATUS.GIVEN:
          return Colors.green;
        case ADMINISTRATION_STATUS.NOT_GIVEN:
          return Colors.alert;
        case ADMINISTRATION_STATUS.MISSED:
          return Colors.darkOrange;
        default:
          return Colors.darkestText;
      }
    }};
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

export const MARStatus = ({
  status,
  doseAmount,
  units,
  isFuture = false,
  isAlert = false,
  isEdited = false,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef(null);

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

  const renderIcon = () => {
    switch (status) {
      case ADMINISTRATION_STATUS.GIVEN:
        return (
          <IconWrapper status={status}>
            <CheckCircleIcon />
            {isAlert && <StyledPriorityHighIcon />}
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      case ADMINISTRATION_STATUS.NOT_GIVEN:
        return (
          <IconWrapper status={status}>
            <CancelIcon />
            {isEdited && <EditedIcon>*</EditedIcon>}
          </IconWrapper>
        );
      case ADMINISTRATION_STATUS.MISSED:
        return (
          <IconWrapper status={status}>
            <HelpOutlineIcon />
          </IconWrapper>
        );
      default:
        return null;
    }
  };

  const renderDoseInfo = () => {
    if (!doseAmount || !units) return null;
    return (
      <DoseInfo>
        <div>{doseAmount}</div>
        <div>{units}</div>
      </DoseInfo>
    );
  };

  return (
    <StatusContainer
      ref={containerRef}
      status={status}
      isSelected={isSelected}
      isFuture={isFuture}
      onClick={() => setIsSelected(true)}
    >
      {status === ADMINISTRATION_STATUS.DUE ? renderDoseInfo() : renderIcon()}
    </StatusContainer>
  );
};
