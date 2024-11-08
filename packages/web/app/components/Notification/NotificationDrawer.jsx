import React from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { Drawer } from '@material-ui/core';
import {
  WS_EVENTS,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { kebabCase } from 'lodash';
import { useHistory } from 'react-router-dom';

import { labsIcon, radiologyIcon } from '../../constants/images';
import { Colors } from '../../constants';
import { BodyText, Heading5 } from '../Typography';
import { TranslatedText } from '../Translation';
import { useTranslation } from '../../contexts/Translation';
import { useAutoUpdatingQuery } from '../../api/queries/useAutoUpdatingQuery';
import { formatShortest, formatTime } from '../DateDisplay';
import { useMarkAllAsRead, useMarkAsRead } from '../../api/mutations';
import { useQueryClient } from '@tanstack/react-query';

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.LAB_REQUEST]: labsIcon,
  [NOTIFICATION_TYPES.IMAGING_REQUEST]: radiologyIcon,
};

const getNotificationText = ({ getTranslation, type, patient, metadata }) => {
  const { firstName, lastName } = patient;
  const { displayId } = metadata.dataValues;
  const patientName = `${firstName} ${lastName}`;

  if (type === NOTIFICATION_TYPES.IMAGING_REQUEST) {
    return getTranslation(
      'notification.content.imagingRequest.completed',
      'Imaging results for :patientName (:displayId) are <strong>now available</strong>',
      { displayId, patientName },
    );
  } else if (type === NOTIFICATION_TYPES.LAB_REQUEST) {
    const labRequestStatus = metadata?.dataValues?.status;
    switch (labRequestStatus) {
      case LAB_REQUEST_STATUSES.PUBLISHED:
      case LAB_REQUEST_STATUSES.INTERIM_RESULTS:
        return getTranslation(
          'notification.content.labRequest.published',
          'Lab results for :patientName (:displayId) are <strong>now available</strong>',
          { displayId, patientName },
        );
      case LAB_REQUEST_STATUSES.INVALIDATED:
        return getTranslation(
          'notification.content.labRequest.invalidated',
          'Lab results for :patientName (:displayId) are <strong>have been invalidated</strong>',
          { displayId, patientName },
        );
    }
  }
};

const StyledDrawer = styled(Drawer)`
  .MuiBackdrop-root {
    background-color: transparent;
  }
  .MuiPaper-root {
    width: 355px;
  }
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px;
  font-weight: 500;
  font-size: 16px;
`;

const UnreadTitle = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0 16px;
  margin-bottom: 12px;
`;

const ActionLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
`;

const CloseButton = styled.div`
  cursor: pointer;
  svg {
    fill: ${Colors.darkText};
  }
`;

const CardContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 14px;
  &:hover {
    background-color: ${Colors.veryLightBlue};
  }
  position: relative;
  cursor: pointer;
`;
const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const CardDatetime = styled.div`
  font-size: 11px;
  line-height: 15px;
  margin-top: 2px;
  color: ${Colors.midText};
  text-transform: lowercase;
`;
const CardIndicator = styled.div`
  width: 3px;
  height: 100%;
  position: absolute;
  background-color: ${Colors.primary};
  top: 0;
  left: 0;
`;

const ReadTitle = styled.div`
  margin: 8px 0 18px 16px;
  font-size: 14px;
  font-weight: 500;
`;

const Card = ({ notification = {} }) => {
  const { getTranslation } = useTranslation();
  const { mutateAsync: markAsRead } = useMarkAsRead(notification?.id);
  const { type, createdTime, status, patient, metadata } = notification;
  const { encounterId, id } = metadata.dataValues.encounterId;

  const history = useHistory();

  const onNotificationClick = async () => {
    if (status === NOTIFICATION_STATUSES.UNREAD) {
      await markAsRead();
    }
    history.push(`/patients/all/${patient.id}/encounter/${encounterId}/${kebabCase(type)}/${id}`);
  };
  return (
    <CardContainer onClick={onNotificationClick}>
      {status === NOTIFICATION_STATUSES.UNREAD && <CardIndicator />}
      <img src={NOTIFICATION_ICONS[type]} />
      <div>
        <BodyText
          dangerouslySetInnerHTML={{
            __html: getNotificationText({ getTranslation, type, patient, metadata }),
          }}
        />
        <CardDatetime>{`${formatTime(createdTime)} ${formatShortest(createdTime)}`}</CardDatetime>
      </div>
    </CardContainer>
  );
};

export const NotificationDrawer = ({ open, onClose }) => {
  const { data: notifications = {} } = useAutoUpdatingQuery(
    'notifications',
    {},
    `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`,
  );
  const queryClient = useQueryClient();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { unreadNotifications = [], readNotifications = [] } = notifications;

  const onMarkAllAsRead = () => {
    queryClient.invalidateQueries('notifications');
    markAllAsRead();
  };

  return (
    <StyledDrawer open={open} onClose={onClose} anchor="right">
      <Title>
        {
          <TranslatedText
            fallback="Notifications (:count new)"
            stringId="dashboard.notification.notifications.title"
            replacements={{ count: unreadNotifications.length || '0' }}
          />
        }
        <CloseButton onClick={onClose}>
          <CloseIcon />
        </CloseButton>
      </Title>
      {!!unreadNotifications.length && (
        <UnreadTitle>
          <Heading5 margin={0}>
            <TranslatedText fallback="Unread" stringId="dashboard.notification.unread.title" />
          </Heading5>
          <ActionLink onClick={onMarkAllAsRead}>
            <TranslatedText
              fallback="Mark all as read"
              stringId="dashboard.notification.action.markAllAsRead"
            />
          </ActionLink>
        </UnreadTitle>
      )}
      <NotificationList>
        {unreadNotifications.map(notification => (
          <Card notification={notification} />
        ))}
      </NotificationList>
      {!!readNotifications.length && (
        <ReadTitle>
          <TranslatedText
            fallback="Recent (last 48 hours)"
            stringId="dashboard.notification.recent.title"
          />
        </ReadTitle>
      )}
      <NotificationList>
        {readNotifications.map(notification => (
          <Card notification={notification} />
        ))}
      </NotificationList>
    </StyledDrawer>
  );
};
