import React from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { Drawer } from '@material-ui/core';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUSES, LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { kebabCase } from 'lodash';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { Box } from '@mui/material';

import { labsIcon, radiologyIcon, medicationIcon } from '../../constants/images';
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
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.LAB_REQUEST]: labsIcon,
  [NOTIFICATION_TYPES.IMAGING_REQUEST]: radiologyIcon,
  [NOTIFICATION_TYPES.PHARMACY_NOTE]: medicationIcon,
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
  }

  if (type === NOTIFICATION_TYPES.LAB_REQUEST) {
    const labRequestStatus = metadata.status;
    const previousStatus = metadata.previousStatus;

    // Amended results notification overrides all other notifications
    if (previousStatus === LAB_REQUEST_STATUSES.PUBLISHED) {
      return getTranslation(
        'notification.content.labRequest.resultsAmended',
        'Lab results for :patientName (:displayId) have been <strong>amended</strong>',
        { replacements: { displayId, patientName } },
      );
    }

    switch (labRequestStatus) {
      case LAB_REQUEST_STATUSES.PUBLISHED:
        return getTranslation(
          'notification.content.labRequest.published',
          'Lab results for :patientName (:displayId) are <strong>now available</strong>',
          { replacements: { displayId, patientName } },
        );
      case LAB_REQUEST_STATUSES.INTERIM_RESULTS:
        return getTranslation(
          'notification.content.labRequest.interimResults',
          'Interim lab results for :patientName (:displayId) are <strong>now available</strong>',
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

  if (type === NOTIFICATION_TYPES.PHARMACY_NOTE) {
    return getTranslation(
      'notification.content.pharmacyNote',
      'Pharmacy note for :patientName (:displayId)',
      { replacements: { displayId: patient.displayId, patientName } },
    );
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

  const navigate = useNavigate();

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

    if (type === NOTIFICATION_TYPES.PHARMACY_NOTE) {
      navigate(
        `/patients/all/${patient.id}/encounter/${encounterId}?tab=${ENCOUNTER_TAB_NAMES.MEDICATION}&openMedicationId=${id}`,
      );
    } else {
      navigate(`/patients/all/${patient.id}/encounter/${encounterId}/${kebabCase(type)}/${id}`);
    }
  };
  return (
    <CardContainer onClick={onNotificationClick} data-testid="cardcontainer-qqc2">
      {status === NOTIFICATION_STATUSES.UNREAD && (
        <CardIndicator data-testid="cardindicator-bkvg" />
      )}
      <img src={NOTIFICATION_ICONS[type]} />
      <Box flex={1}>
        <BodyText
          dangerouslySetInnerHTML={{
            __html: getNotificationText({ getTranslation, type, patient, metadata }),
          }}
          data-testid="bodytext-xa84"
        />
        <CardDatetime data-testid="carddatetime-vyqg">
          {`${formatTime(createdTime).replace(' ', '')} ${formatShortest(createdTime)}`}
        </CardDatetime>
      </Box>
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
    <StyledDrawer open={open} onClose={onClose} anchor="right" data-testid="styleddrawer-fn4h">
      <Title data-testid="title-cg5h">
        <TranslatedText
          fallback="Notifications"
          stringId="dashboard.notification.notifications.title"
          replacements={{ count: unreadNotifications.length }}
          data-testid="translatedtext-2asn"
        />{' '}
        {!!unreadNotifications.length && (
          <TranslatedText
            fallback="(:count new)"
            stringId="dashboard.notification.title.countNew"
            replacements={{ count: unreadNotifications.length }}
            data-testid="translatedtext-fq6k"
          />
        )}
        <CloseButton onClick={onClose} data-testid="closebutton-rgw9">
          <CloseIcon data-testid="closeicon-x89c" />
        </CloseButton>
      </Title>
      {!unreadNotifications.length && !readNotifications.length && (
        <NoDataContainer data-testid="nodatacontainer-2xqs">
          <Heading3 margin={0} data-testid="heading3-xlfm">
            <TranslatedText
              fallback="No notifications to display "
              stringId="dashboard.notification.empty.title"
              data-testid="translatedtext-owm5"
            />
          </Heading3>
          <BodyText data-testid="bodytext-7fkl">
            <TranslatedText
              fallback="Check back again later"
              stringId="dashboard.notification.empty.subTitle"
              data-testid="translatedtext-dpro"
            />
          </BodyText>
        </NoDataContainer>
      )}
      {!isLoading ? (
        <>
          {!!unreadNotifications.length && (
            <UnreadTitle data-testid="unreadtitle-raz1">
              <Heading5 margin={0} data-testid="heading5-lwm3">
                <TranslatedText
                  fallback="Unread"
                  stringId="dashboard.notification.unread.title"
                  data-testid="translatedtext-ddcf"
                />
              </Heading5>
              <ActionLink onClick={onMarkAllAsRead} data-testid="actionlink-10rj">
                <TranslatedText
                  fallback="Mark all as read"
                  stringId="dashboard.notification.action.markAllAsRead"
                  data-testid="translatedtext-essh"
                />
              </ActionLink>
            </UnreadTitle>
          )}
          <NotificationList data-testid="notificationlist-xmfz">
            {unreadNotifications.map((notification, index) => (
              <Card
                notification={notification}
                key={notification.id}
                data-testid={`card-2yld-${index}`}
              />
            ))}
          </NotificationList>
          {!!readNotifications.length && (
            <ReadTitle data-testid="readtitle-svo6">
              <TranslatedText
                fallback="Recent (last :recentNotificationsTimeFrame hours)"
                stringId="dashboard.notification.recent.title"
                replacements={{ recentNotificationsTimeFrame }}
                data-testid="translatedtext-314f"
              />
            </ReadTitle>
          )}
          <NotificationList data-testid="notificationlist-wek6">
            {readNotifications.map((notification, index) => (
              <Card
                notification={notification}
                key={notification.id}
                data-testid={`card-trcn-${index}`}
              />
            ))}
          </NotificationList>
        </>
      ) : (
        <LoadingIndicator backgroundColor={Colors.white} data-testid="loadingindicator-36ut" />
      )}
    </StyledDrawer>
  );
};
