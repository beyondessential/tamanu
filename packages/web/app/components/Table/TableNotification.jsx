import { TAMANU_COLORS } from '@tamanu/ui-components';
import React, { memo } from 'react';
import styled from 'styled-components';

import { ClearIcon } from '../Icons/ClearIcon';

const Notification = styled.div`
  background-color: ${TAMANU_COLORS.primary}10;
  border: 1px solid ${TAMANU_COLORS.primary}1a;
  border-radius: 4px;
  color: ${TAMANU_COLORS.primary};

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
    fill: ${TAMANU_COLORS.primary};
  }
`;

const RefreshText = styled.span`
  cursor: pointer;
`;

export const TableNotification = memo(({ message, refreshTable, clearNotification }) => {
  return (
    <Notification data-testid="notification-mvzs">
      <NotificationClearIcon onClick={clearNotification} data-testid="notificationclearicon-6cup" />
      <RefreshText onClick={refreshTable} data-testid="refreshtext-ww64">
        {message}
      </RefreshText>
    </Notification>
  );
});
