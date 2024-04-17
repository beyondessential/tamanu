import React, { memo } from 'react';
import styled from 'styled-components';

import { ClearIcon } from '../Icons/ClearIcon';
import { Colors } from '../../constants';

const Notification = styled.div`
  background-color: ${Colors.primary}10;
  border: 1px solid ${Colors.primary}1a;
  border-radius: 4px;
  color: ${Colors.primary};

  height: 48px;
  line-height: 48px;
  width: 320px;
  padding-left: 15px;

  position: fixed;
  top: 25px;
  right: 48px;
  z-index: 9;
`;

const NotificationClearIcon = styled(ClearIcon)`
  position: absolute;
  right: 20px;
  top: 19px;
  cursor: pointer;
  path {
    fill: ${Colors.primary};
  }
`;

const RefreshText = styled.span`
  cursor: pointer;
`;

export const TableNotification = memo(({ message, refreshTable, clearNotification }) => {
  return (
    <Notification>
      <NotificationClearIcon onClick={clearNotification} />
      <RefreshText onClick={refreshTable}>{message}</RefreshText>
    </Notification>
  );
});
