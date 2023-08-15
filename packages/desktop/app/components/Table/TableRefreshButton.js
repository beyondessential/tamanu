import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

import { getDateDisplay } from '../DateDisplay';

import { RefreshIcon } from '../Icons/RefreshIcon';
import { Colors } from '../../constants';
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
  ${({ $isSpinning }) =>
    $isSpinning &&
    css`
      animation: 0.5s linear ${spin} infinite;
    `}
`;

const RefreshButton = styled.div`
  margin-left: 5px;
  cursor: pointer;
  border-radius: 3px;
  &:hover {
    background-color: ${Colors.softOutline};
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
  top: -210px;
  color: ${Colors.softText};
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

  return (
    <LastUpdatedBadge>
      Last updated: {getDateDisplay(lastUpdatedTime, { showTime: true })}
      <ThemedTooltip title="Refresh">
        <RefreshButton>
          <Spinner $isSpinning={isRefreshSpinning} onClick={handleClick} />
        </RefreshButton>
      </ThemedTooltip>
    </LastUpdatedBadge>
  );
};
