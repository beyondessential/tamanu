
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';

import { PlusIcon } from '../assets/icons/PlusIcon';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { Button, TextButton } from './Button';
import { ModalCancelRow } from './ModalActionRow';
import { DataFetchingTable } from './Table';
import { joinNames } from '../utils/user';
import { useTranslation } from '../contexts/Translation';
import { TranslatedText } from './Translation/TranslatedText';
import { capitalize } from 'lodash';

const StyledText = styled(Typography)`
  margin: 14px 0px 30px 0;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }
`;

const StyledTextButton = styled(TextButton)`
  font-size: 14px;
  line-height: 18px;
  text-decoration: underline;
  color: ${Colors.darkestText};
  .MuiButton-label {
    font-weight: 400;
  }
`;

const StyledContactListTable = styled(DataFetchingTable)`
  display: ${props => (props.isEmpty ? 'none' : 'block')};
  margin-bottom: 28px;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  box-shadow: none;

  table {
    padding-left: 21px;
    padding-right: 25px;
    padding-bottom: 16px;
  }

  table thead th {
    background-color: ${Colors.white} !important;
    border-bottom: 1px solid ${Colors.outline};
    padding: 13px 0 12px 2px;
    padding-left: 2px !important;
    width: 30%;
    &: 4th-child {
      width: 10%;
    }
  }

  table thead th tr {
    font-size: 14px;
    font-style: normal;
    line-height: 18px;
  }

  table tbody td {
    padding-left: 2px !important;
    padding-top: 14px !important;
    padding-bottom: 0 !important;
    border-bottom: none;
  }
`;

const StyledAddContactButton = styled(Button)`
  padding: 11px 15px !important;
  height: 33px;
  border-radius: 3px;
  border: 1px solid ${Colors.primary};
  line-height: 18px;
  margin-bottom: 20px;

  svg {
    margin-right: 5px !important;
  }
`;

const RowActionLink = styled.a`
  text-decoration: underline;
  cursor: pointer;
`;

const ColoredText = styled.span`
  color: ${props => props.color};
`;

const ColoredCellText = ({ children, status }) => {
  switch (status) {
    case 'failed':
      return <ColoredText color={Colors.alert}>{children}</ColoredText>
    case 'pending':
      return <ColoredText color={Colors.softText}>{children}</ColoredText>
    default:
      return <span>{children}</span>
  }
}

const ContactDetails = ({ pendingContacts, onRetry, successContactIds, onRemoveContact }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector(state => state.patient);
  const patientName = joinNames(patient);
  const [isEmpty, setIsEmpty] = useState(false);

  const { ability } = useAuth();
  const canRemoveReminderContacts = ability.can('write', 'Patient');

  const onDataFetched = ({ count }) => {
    setIsEmpty(!count);
  };

  const getStatus = (isTimerStarted = false, contactId, connectionDetails) => {
    if (successContactIds.includes(contactId) || !!connectionDetails) {
      return 'success';
    }
    if (isTimerStarted) {
      return 'pending';
    }
    return 'failed';
  };

  const getMethod = (status, method) => {
    let methodText;
    switch (status) {
      case 'failed':
        methodText = <TranslatedText
          stringId='patient.details.reminderContacts.method.failed'
          fallback='Failed'
        />;
        break;
      case 'pending':
        methodText = <TranslatedText
          stringId={`patient.details.reminderContacts.method.${method}Pending`}
          fallback={capitalize(method) + ' pending'}
        />;
        break;
      case 'success':
        methodText = <TranslatedText
          stringId={`patient.details.reminderContacts.method.${method}`}
          fallback={capitalize(method)}
        />;
        break;
    }
    return <ColoredCellText status={status}>{methodText}</ColoredCellText>
  };

  const columns = [
    {
      key: 'name',
      title: <TranslatedText stringId='patient.details.reminderContacts.field.contact' fallback='Contact' />,
      sortable: false,
      accessor: row => (
        <ColoredCellText status={getStatus(pendingContacts[row.id]?.isTimerStarted, row.id, row.connectionDetails)}>
          {row.name}
        </ColoredCellText>
      ),
    },
    {
      key: 'relationship.name',
      title: <TranslatedText stringId='patient.details.reminderContacts.field.relationship' fallback='Relationship' />,
      sortable: false,
      accessor: row => (
        <ColoredCellText status={getStatus(pendingContacts[row.id]?.isTimerStarted, row.id, row.connectionDetails)}>
          {row.relationship.name}
        </ColoredCellText>
      ),
    },
    {
      key: 'method',
      title: <TranslatedText stringId='patient.details.reminderContacts.field.contactMethod' fallback='Contact method' />,
      sortable: false,
      accessor: row => getMethod(
        getStatus(pendingContacts[row.id]?.isTimerStarted, row.id, row.connectionDetails),
        row.method,
      ),
    },
    ...(canRemoveReminderContacts
      ? [
          {
            key: '',
            title: '',
            sortable: false,
            accessor: (data) => {
              return (
                <StyledTextButton onClick={() => onRemoveContact(data)}>
                  <TranslatedText
                    stringId={'patient.details.reminderContacts.label.remove'}
                    fallback={'Remove'}
                  />
                </StyledTextButton>
              );
            },
          },
        ]
      : []),
    { 
      key: '', 
      title: '', 
      sortable: false,
      accessor: row => getStatus(pendingContacts[row.id]?.isTimerStarted, row.id, row.connectionDetails) === 'failed'
      ? (
        <RowActionLink onClick={() => onRetry(row)}>
          <TranslatedText stringId="general.action.retry" fallback="Retry" />
        </RowActionLink>
      )
      : ''
    },
  ];

  return (
    <>
      {isEmpty ? (
        <StyledText
          dangerouslySetInnerHTML={{
            __html: getTranslation(
              'patient.details.reminderContacts.emptyDescription',
              "There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact.",
              { patientName: `<span>${patientName}</span>` },
            ),
          }}
        ></StyledText>
      ) : (
        <StyledText
          dangerouslySetInnerHTML={{
            __html: getTranslation(
              'patient.details.reminderContacts.description',
              'The below contact list is registered to receive reminders for :patientName.',
              { patientName: `<span>${patientName}</span>` },
            ),
          }}
        ></StyledText>
      )}
      <StyledContactListTable
        columns={columns}
        endpoint={`/patient/${patient.id}/reminderContacts`}
        disablePagination
        initialSort={{ orderBy: 'name', order: 'asc' }}
        allowExport={false}
        onDataFetched={onDataFetched}
        isEmpty={isEmpty}
      />
    </>
  );
};

export const ReminderContactList = ({ onClose, onAddContact, pendingContacts, onRetry, successContactIds, onRemoveContact }) => {
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  return (
    <>
      <ContactDetails 
        pendingContacts={pendingContacts}
        onRetry={onRetry}
        successContactIds={successContactIds}
        onRemoveContact={onRemoveContact}
      />

      {canAddReminderContacts && (
        <StyledAddContactButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={onAddContact}
        >
          <PlusIcon fill={Colors.primary} />
          <TranslatedText
            stringId="patient.details.reminderContacts.action.add"
            fallback="Add contact"
          />
        </StyledAddContactButton>
      )}
      <ModalCancelRow
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        confirmColor="primary"
        onConfirm={onClose}
      />
    </>
  );
};
