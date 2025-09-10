import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { DateDisplay } from '../DateDisplay';
import { RefreshIcon } from '../Icons/RefreshIcon';
import { ThemedTooltip } from '../Tooltip';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled(RefreshIcon)`
  animation: 0.5s linear ${spin} infinite;
`;

const RefreshButton = styled.div`
  margin-left: 5px;
  cursor: pointer;
  border-radius: 3px;
  &:hover {
    background-color: ${TAMANU_COLORS.softOutline};
  }
  height: 25px;
  width: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LastUpdatedBadge = styled.div`
  position: absolute;
  right: 0;
  top: -12px;
  color: ${TAMANU_COLORS.softText};
  font-size: 11px;
  display: flex;
  align-items: center;
`;

export const TableRefreshButton = ({ refreshTable, lastUpdatedTime }) => {
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false);

  const spinRefreshButton = () => {
    setIsRefreshSpinning(true);
    setTimeout(() => {
      setIsRefreshSpinning(false);
    }, 1000);
  };

  const handleClick = () => {
    refreshTable();
    spinRefreshButton();
  };

  const RefreshSpinner = isRefreshSpinning ? Spinner : RefreshIcon;

  return (
    <LastUpdatedBadge data-testid="lastupdatedbadge-gj4z">
      <span>
        <span>Last updated: </span>
        <DateDisplay date={lastUpdatedTime} showTime data-testid="datedisplay-0aiw" />
      </span>
      <ThemedTooltip title="Refresh" data-testid="themedtooltip-8v14">
        <RefreshButton data-testid="refreshbutton-77qa">
          <RefreshSpinner onClick={handleClick} data-testid="refreshspinner-n268" />
        </RefreshButton>
      </ThemedTooltip>
    </LastUpdatedBadge>
  );
};
