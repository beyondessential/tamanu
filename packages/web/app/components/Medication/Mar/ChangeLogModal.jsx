import React, { Fragment, useEffect, useState } from 'react';
import { ConfirmCancelRow, TranslatedText, Modal } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { useMarChangelogQuery } from '../../../api/queries/useMarChangelogQuery';
import { formatShortest } from '@tamanu/utils/dateTime';
import { formatTimeSlot } from '../../../utils/medications';
import { Box } from '@mui/material';
import { useTranslation } from '../../../contexts/Translation';
import { getMarDoseDisplay } from '@tamanu/shared/utils/medication';

const LogContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${Colors.white};
  padding: 20px 40px;
  margin-top: 16px;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  overflow-y: auto;
`;

const LogItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const NoteText = styled.span`
  color: ${Colors.softText};
  font-size: 11px;
`;

const DoseLabel = styled.span`
  color: ${Colors.darkText};
  font-size: 14px;
  font-weight: 500;
  position: absolute;
  right: 0;
  top: 0;
`;

const StyledDivider = styled(Divider)`
  margin: 34px -32px 20px -32px;
`;

const LABELS = {
  status: <TranslatedText stringId="medication.mar.status" fallback="Status" />,
  reason: <TranslatedText stringId="medication.mar.reason" fallback="Reason" />,
  recordedBy: <TranslatedText stringId="medication.mar.recordedBy" fallback="Recorded by" />,
  doseGiven: <TranslatedText stringId="medication.mar.doseGiven" fallback="Dose given" />,
  timeGiven: <TranslatedText stringId="medication.mar.timeGiven" fallback="Time given" />,
  givenBy: <TranslatedText stringId="medication.mar.givenBy" fallback="Given by" />,
  reasonForChange: (
    <TranslatedText stringId="medication.mar.reasonForChange" fallback="Reason for change" />
  ),
  reasonForRemoval: (
    <TranslatedText stringId="medication.mar.reasonForRemoval" fallback="Reason for removal" />
  ),
  doseRemoved: <TranslatedText stringId="medication.mar.doseRemoved" fallback="Dose removed" />,
  given: <TranslatedText stringId="medication.mar.given" fallback="Given" />,
  notGiven: <TranslatedText stringId="medication.mar.notGiven" fallback="Not given" />,
};

export const ChangeLogModal = ({ open, onClose, medication, marId }) => {
  const [changeLogList, setChangeLogList] = useState([]);
  const { getEnumTranslation } = useTranslation();

  const { data } = useMarChangelogQuery(marId);

  useEffect(() => {
    if (data) {
      processedData(data.map((l, index) => ({ ...l, index })));
    }
  }, [data]);

  const getUserChanged = log => {
    return {
      name: log.changedByUser,
      date: `${formatShortest(log.createdAt)} ${formatTimeSlot(log.createdAt)}`,
    };
  };

  const getNotGivenDataChanges = (log, previousLog) => {
    const changes = [];
    if (previousLog?.marNotGivenReason?.id !== log.marNotGivenReason.id) {
      changes.push({ label: LABELS.reason, value: log.marNotGivenReason.name });
    }
    if (previousLog?.recordedByUser?.id !== log.recordedByUser.id) {
      changes.push({ label: LABELS.recordedBy, value: log.recordedByUser.name });
    }
    if (!changes.length) {
      return [];
    }
    if (log.marChangingNotGivenInfoReason) {
      changes.push({ label: LABELS.reasonForChange, value: log.marChangingNotGivenInfoReason });
    }
    return [
      {
        changes,
        userChanged: getUserChanged(log),
      },
    ];
  };

  const getGivenDataChanges = (logs, lastSwitchToGivenLogIndex) => {
    const result = [];
    for (const log of logs) {
      if (log.type === 'mar') continue;
      if (log.changeType === 'CREATED') {
        result.push([
          {
            changes: [
              {
                label: LABELS.doseGiven,
                value: getMarDoseDisplay(
                  { doseAmount: log.doseAmount, units: medication.units },
                  getEnumTranslation,
                ),
              },
              { label: LABELS.timeGiven, value: formatTimeSlot(log.doseGivenTime) },
              { label: LABELS.givenBy, value: log.doseGivenByUser.name },
              { label: LABELS.recordedBy, value: log.recordedByUser.name },
            ],
            userChanged: getUserChanged(log),
            doseIndex: log.doseIndex + 1,
          },
        ]);
      }
      if (log.changeType === 'UPDATED') {
        if (log.doseIsRemoved) {
          result.push([
            {
              changes: [
                { label: LABELS.doseRemoved },
                {
                  label: LABELS.reasonForRemoval,
                  value: log.doseReasonForRemoval,
                },
              ],
              userChanged: getUserChanged(log),
              doseIndex: log.doseIndex + 1,
            },
          ]);
        } else {
          const previousLog = data.slice(log.index + 1).find(l => l.id === log.id);
          const changes = [];
          if (previousLog?.doseAmount !== log.doseAmount) {
            changes.push({
              label: LABELS.doseGiven,
              value: getMarDoseDisplay(
                { doseAmount: log.doseAmount, units: medication.units },
                getEnumTranslation,
              ),
            });
          }
          if (previousLog?.doseGivenTime !== log.doseGivenTime) {
            changes.push({ label: LABELS.timeGiven, value: formatTimeSlot(log.doseGivenTime) });
          }
          if (previousLog?.doseGivenByUser?.id !== log.doseGivenByUser.id) {
            changes.push({ label: LABELS.givenBy, value: log.doseGivenByUser.name });
          }
          if (previousLog?.recordedByUser?.id !== log.recordedByUser.id) {
            changes.push({ label: LABELS.recordedBy, value: log.recordedByUser.name });
          }
          if (log.doseReasonForChange && changes.length) {
            changes.push({ label: LABELS.reasonForChange, value: log.doseReasonForChange });
          }
          const shouldShowDoseIndex = data
            .slice(log.index + 1, lastSwitchToGivenLogIndex)
            .some(l => l.doseIndex > 0);
          if (changes.length) {
            result.push([
              {
                changes,
                userChanged: getUserChanged(log),
                doseIndex: shouldShowDoseIndex ? log.doseIndex + 1 : null,
              },
            ]);
          }
        }
      }
    }
    return result;
  };

  const processedData = data => {
    const groupedLogs = [...data].reverse().reduce((acc, item) => {
      if (item.type === 'mar') {
        acc.push([item]);
      } else {
        acc[acc.length - 1]?.push(item);
      }
      return acc;
    }, []);

    let currentStatus = '';
    let lastSwitchToGivenLogIndex = null;
    const newChangeLogList = [];
    groupedLogs.forEach((logs, index) => {
      const marStatus = logs[0].marStatus;
      if (!marStatus && !currentStatus) {
        return;
      }

      // change status
      if (!currentStatus || marStatus !== currentStatus) {
        if (marStatus === 'not-given') {
          const marChanges = [
            {
              changes: [
                { label: LABELS.status, value: LABELS.notGiven },
                { label: LABELS.reason, value: logs[0].marNotGivenReason.name },
                { label: LABELS.recordedBy, value: logs[0].recordedByUser.name },
                ...(logs[0].marChangingStatusReason
                  ? [{ label: LABELS.reasonForChange, value: logs[0].marChangingStatusReason }]
                  : []),
              ],
              userChanged: getUserChanged(logs[0]),
            },
          ];
          const doseChanges = logs
            .filter(log => log.recordDeletedAt && log.type === 'dose')
            .sort((a, b) => b.doseIndex - a.doseIndex)
            .map((log, _, array) => {
              return {
                changes: [
                  { label: LABELS.doseRemoved },
                  {
                    label: LABELS.reasonForRemoval,
                    value: (
                      <TranslatedText
                        stringId="medication.mar.reasonForRemoval.dose.dueStatusChange"
                        fallback="Removed due to status change"
                      />
                    ),
                  },
                ],
                userChanged: getUserChanged(log),
                doseIndex: array.length > 1 ? log.doseIndex + 1 : null,
              };
            });
          marChanges.push(...doseChanges);
          newChangeLogList.push(marChanges);
        } else if (marStatus === 'given') {
          lastSwitchToGivenLogIndex = logs[0].index;
          const marChanges = [
            {
              changes: [
                { label: LABELS.status, value: LABELS.given },
                {
                  label: LABELS.doseGiven,
                  value: getMarDoseDisplay(
                    { doseAmount: logs[1].doseAmount, units: medication.units },
                    getEnumTranslation,
                  ),
                },
                {
                  label: LABELS.timeGiven,
                  value: logs[1].doseGivenTime && formatTimeSlot(logs[1].doseGivenTime),
                },
                { label: LABELS.givenBy, value: logs[1].doseGivenByUser.name },
                { label: LABELS.recordedBy, value: logs[0].recordedByUser.name },
                ...(logs[0].marChangingStatusReason
                  ? [{ label: LABELS.reasonForChange, value: logs[0].marChangingStatusReason }]
                  : []),
              ],
              userChanged: getUserChanged(logs[0]),
            },
          ];
          newChangeLogList.push(marChanges);
          // remove the first two logs because they are already in the marChanges
          const doseChanges = getGivenDataChanges(logs.slice(2), lastSwitchToGivenLogIndex);
          if (doseChanges.length) {
            newChangeLogList.push(...doseChanges);
          }
        }
        currentStatus = marStatus;
        return;
      }

      // update not given info, we don't care about the changes of doses in this case
      if (marStatus === 'not-given') {
        const dataChanges = getNotGivenDataChanges(logs[0], groupedLogs[index - 1]?.[0]);
        if (dataChanges.length) {
          newChangeLogList.push(dataChanges);
        }
        return;
      }

      // update given doses, we only care about the changes of doses in this case
      if (marStatus === 'given') {
        // remove the first log because it is marChanges and doesn't necessary
        const doseChanges = getGivenDataChanges(logs.slice(1), lastSwitchToGivenLogIndex);
        if (doseChanges.length) {
          newChangeLogList.push(...doseChanges);
        }
        return;
      }
    });
    setChangeLogList(newChangeLogList.reverse());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.mar.changeLog.title"
          fallback="Change Log | :medicationName"
          replacements={{ medicationName: medication.medication.name }}
        />
      }
      disableDevWarning
    >
      <LogContainer>
        {changeLogList.map((logs, idx) => (
          <Fragment key={idx}>
            <Box display={'flex'} flexDirection={'column'} gap={1}>
              {logs.map((log, idy) => (
                <LogItem key={idy}>
                  {log.changes.map((change, idz) => (
                    <Box key={idz} display={'inline-block'}>
                      <span>{change.label}</span>
                      {change.value && <span>: {change.value}</span>}
                    </Box>
                  ))}
                  <NoteText>
                    {log.userChanged.name} {log.userChanged.date}
                  </NoteText>
                  {log.doseIndex && (
                    <DoseLabel>
                      <TranslatedText
                        stringId="medication.mar.dose"
                        fallback="Dose :index"
                        replacements={{ index: log.doseIndex }}
                      />
                    </DoseLabel>
                  )}
                </LogItem>
              ))}
            </Box>
            {idx < changeLogList.length - 1 && <Divider color={Colors.outline} />}
          </Fragment>
        ))}
      </LogContainer>
      <StyledDivider />
      <ConfirmCancelRow
        onConfirm={onClose}
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
      />
    </Modal>
  );
};
