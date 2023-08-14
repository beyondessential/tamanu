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

  position: absolute;
  top: -300px;
  right: 0px;
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

export const TableNotification = memo(({ message, clearNotification }) => {
  return (
    <Notification>
      <NotificationClearIcon onClick={clearNotification} />
      {message}
    </Notification>
  );
});
