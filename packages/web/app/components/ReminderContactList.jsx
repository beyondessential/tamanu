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
  margin: 14px 40px 30px 0;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }
`;

const StyledTextButton = styled(TextButton)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400 !important;
  text-decoration: underline;
  color: ${Colors.darkestText};
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
    padding-left: 3px !important;
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

const ContactDetails = ({ onRemoveContact }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector(state => state.patient);
  const patientName = joinNames(patient);
  const [isEmpty, setIsEmpty] = useState(false);

  const { ability } = useAuth();
  const canRemoveReminderContacts = ability.can('write', 'Patient');

  const onDataFetched = ({ count }) => {
    setIsEmpty(!count);
  };

  const columns = [
    {
      key: 'name',
      title: getTranslation('patient.details.reminderContacts.field.contact', 'Contact'),
      sortable: false,
    },
    {
      key: 'relationship.name',
      title: getTranslation('patient.details.reminderContacts.field.relationShip', 'Relationship'),
      sortable: false,
    },
    {
      key: 'method',
      title: getTranslation(
        'patient.details.reminderContacts.field.contactMethod',
        'Contact method',
      ),
      sortable: false,
      accessor: data => {
        return data.connectionDetails ? (
          <TranslatedText
            stringId={`patient.details.reminderContacts.method.${data.method}`}
            fallback={capitalize(data.method)}
          />
        ) : (
          <TranslatedText
            stringId={`patient.details.reminderContacts.method.${data.method}Pending`}
            fallback={`${capitalize(data.method)} pending`}
          />
        );
      },
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
  ];

  const description = getTranslation(
    'patient.details.reminderContacts.description',
    'The below contact list is registered to receive reminders for :patientName.',
    { patientName },
  );

  const emptyDescription = getTranslation(
    'patient.details.reminderContacts.emptyDescription',
    "There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact.",
    { patientName },
  );

  return (
    <>
      {isEmpty ? (
        <StyledText>
          {emptyDescription.split(`${patientName}.`)[0]}
          <span>{patientName}.</span>
          {emptyDescription.split(`${patientName}.`)[1]}
        </StyledText>
      ) : (
        <StyledText>
          {description.split(`${patientName}.`)[0]}
          <span>{patientName}.</span>
        </StyledText>
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

export const ReminderContactList = ({ onClose, onAddContact, onRemoveContact }) => {
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  return (
    <>
      <ContactDetails onRemoveContact={onRemoveContact} />

      {canAddReminderContacts && (
        <StyledAddContactButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={onAddContact}
        >
          <PlusIcon fill={Colors.primary} />
          Add contact
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
