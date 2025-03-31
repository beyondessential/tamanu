import React from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { Drawer } from '@material-ui/core';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUSES, LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { kebabCase } from 'lodash';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { labsIcon, radiologyIcon } from '../../constants/images';
import { Colors } from '../../constants';
import { BodyText, Heading3, Heading5 } from '../Typography';
import { TranslatedText } from '../Translation';
import { useTranslation } from '../../contexts/Translation';
import { formatShortest, formatTime } from '../DateDisplay';
import { useMarkAllAsRead, useMarkAsRead } from '../../api/mutations';
import { LoadingIndicator } from '../LoadingIndicator';
import { useLabRequest } from '../../contexts/LabRequest';
import { useEncounter } from '../../contexts/Encounter';
import { reloadImagingRequest, reloadPatient } from '../../store';

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.LAB_REQUEST]: labsIcon,
  [NOTIFICATION_TYPES.IMAGING_REQUEST]: radiologyIcon,
};

const getNotificationText = ({ getTranslation, type, patient, metadata }) => {
  const { firstName, lastName } = patient;
  const { displayId } = metadata;
  const patientName = `${firstName} ${lastName}`;

  if (type === NOTIFICATION_TYPES.IMAGING_REQUEST) {
    return getTranslation(
      'notification.content.imagingRequest.completed',
      'Imaging results for :patientName (:displayId) are <strong>now available</strong>',
      { replacements: { displayId, patientName } },
    );
  } else if (type === NOTIFICATION_TYPES.LAB_REQUEST) {
    const labRequestStatus = metadata.status;
    switch (labRequestStatus) {
      case LAB_REQUEST_STATUSES.PUBLISHED:
      case LAB_REQUEST_STATUSES.INTERIM_RESULTS:
        return getTranslation(
          'notification.content.labRequest.published',
          'Lab results for :patientName (:displayId) are <strong>now available</strong>',
          { replacements: { displayId, patientName } },
        );
      case LAB_REQUEST_STATUSES.INVALIDATED:
        return getTranslation(
          'notification.content.labRequest.invalidated',
          'Lab results for :patientName (:displayId) have been <strong>invalidated</strong>',
          { replacements: { displayId, patientName } },
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
  &:hover {
    font-weight: 500;
    color: ${Colors.primary};
  }
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
  gap: 14px;
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
  height: calc(100% + 11px);
  position: absolute;
  background-color: ${Colors.primary};
  top: -6px;
  left: 0;
  border-radius: 5px;
`;

const ReadTitle = styled.div`
  margin: 8px 0 18px 16px;
  font-size: 14px;
  font-weight: 500;
`;

const NoDataContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  flex-grow: 1;
  gap: 3px;
  margin-bottom: 40px;
`;

const Card = ({ notification }) => {
  const { loadLabRequest } = useLabRequest();
  const { getTranslation } = useTranslation();
  const { loadEncounter } = useEncounter();
  const dispatch = useDispatch();
  const { mutateAsync: markAsRead, isLoading: isMarkingAsRead } = useMarkAsRead(notification.id);
  const { type, createdTime, status, patient, metadata } = notification;
  const { encounterId, id } = metadata;

  const history = useHistory();

  const onNotificationClick = async () => {
    if (isMarkingAsRead) return;
    if (status === NOTIFICATION_STATUSES.UNREAD) {
      await markAsRead();
    }
    if (type === NOTIFICATION_TYPES.LAB_REQUEST) {
      await loadLabRequest(id);
    }
    if (type === NOTIFICATION_TYPES.IMAGING_REQUEST) {
      await dispatch(reloadImagingRequest(metadata.id));
    }
    await loadEncounter(encounterId);
    if (patient?.id) await dispatch(reloadPatient(patient.id));

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

export const NotificationDrawer = ({ open, onClose, notifications, isLoading }) => {
  const { mutate: markAllAsRead, isLoading: isMarkingAllAsRead } = useMarkAllAsRead();
  const {
    unreadNotifications = [],
    readNotifications = [],
    recentNotificationsTimeFrame,
  } = notifications;

  const onMarkAllAsRead = () => {
    if (isMarkingAllAsRead) return;
    markAllAsRead();
  };

  return (
    <StyledDrawer open={open} onClose={onClose} anchor="right">
      <Title>
        <TranslatedText
          fallback="Notifications"
          stringId="dashboard.notification.notifications.title"
          replacements={{ count: unreadNotifications.length }}
          data-test-id='translatedtext-q9ro' />{' '}
        {!!unreadNotifications.length && (
          <TranslatedText
            fallback="(:count new)"
            stringId="dashboard.notification.title.countNew"
            replacements={{ count: unreadNotifications.length }}
            data-test-id='translatedtext-z61r' />
        )}
        <CloseButton onClick={onClose}>
          <CloseIcon />
        </CloseButton>
      </Title>
      {!unreadNotifications.length && !readNotifications.length && (
        <NoDataContainer>
          <Heading3 margin={0}>
            <TranslatedText
              fallback="No notifications to display "
              stringId="dashboard.notification.empty.title"
              data-test-id='translatedtext-ygeu' />
          </Heading3>
          <BodyText>
            <TranslatedText
              fallback="Check back again later"
              stringId="dashboard.notification.empty.subTitle"
              data-test-id='translatedtext-3bbs' />
          </BodyText>
        </NoDataContainer>
      )}
      {!isLoading ? (
        <>
          {!!unreadNotifications.length && (
            <UnreadTitle>
              <Heading5 margin={0}>
                <TranslatedText
                  fallback="Unread"
                  stringId="dashboard.notification.unread.title"
                  data-test-id='translatedtext-jhct' />
              </Heading5>
              <ActionLink onClick={onMarkAllAsRead}>
                <TranslatedText
                  fallback="Mark all as read"
                  stringId="dashboard.notification.action.markAllAsRead"
                  data-test-id='translatedtext-7bsk' />
              </ActionLink>
            </UnreadTitle>
          )}
          <NotificationList>
            {unreadNotifications.map(notification => (
              <Card notification={notification} key={notification.id} />
            ))}
          </NotificationList>
          {!!readNotifications.length && (
            <ReadTitle>
              <TranslatedText
                fallback="Recent (last :recentNotificationsTimeFrame hours)"
                stringId="dashboard.notification.recent.title"
                replacements={{ recentNotificationsTimeFrame }}
                data-test-id='translatedtext-bbt0' />
            </ReadTitle>
          )}
          <NotificationList>
            {readNotifications.map(notification => (
              <Card notification={notification} key={notification.id} />
            ))}
          </NotificationList>
        </>
      ) : (
        <LoadingIndicator backgroundColor={Colors.white} />
      )}
    </StyledDrawer>
  );
};
