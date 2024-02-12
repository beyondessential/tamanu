import React, { useState } from 'react';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';

import { PlusIcon } from '../assets/icons/PlusIcon';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { Button } from './Button';
import { ModalCancelRow } from './ModalActionRow';
import { DataFetchingTable } from './Table';

const StyledText = styled(Typography)`
  margin: 14px 0 33px;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }
`;

const StyledContactListTable = styled(DataFetchingTable)`
  margin-bottom: 28px;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  box-shadow: none;

  table {
    padding-left: 21px;
    padding-right: 25px;
  }

  table thead th {
    background-color: ${Colors.white} !important;
    border-bottom: 1px solid ${Colors.outline};
    padding: 13px 0 12px 2px;
    padding-left: 2px !important;
  }

  table thead th tr {
    font-size: 14px;
    font-style: normal;
    line-height: 18px;
  }
`;

const StyledAddContactButton = styled(Button)`
  padding: 11px 15px !important;
  height: 33px;
  border-radius: 3px;
  border: 1px solid ${Colors.primary};
  line-height: 18px;
  margin-bottom: 16px;

  svg {
    margin-right: 5px !important;
  }
`;

const columns = [
  { key: 'contactName', title: 'Contact', sortable: false },
  { key: 'relationshipType', title: 'Relationship', sortable: false },
  { key: 'contactMethod', title: 'Contact method', sortable: false },
  { key: '', title: '', sortable: false },
];

const NoContactInfo = ({ name }) => {
  return (
    <StyledText>
      {`There are no contacts registered to receive reminders for `}
      <span>{name}</span>
      {`. Please select 'Add contact' to register a contact.`}
    </StyledText>
  );
};

const ContactDetails = ({ name }) => {
  const [contactsCount, setContactsCount] = useState(null);

  // Helper Methods
  const onDataFetched = ({ count }) => {
    setContactsCount(count);
  };

  if (contactsCount === 0) {
    return <NoContactInfo name={name} />;
  }

  return (
    <>
      <StyledText>
        The below contact list is registered to receive reminders for <span>{name}</span>.
      </StyledText>
      <StyledContactListTable
        columns={columns}
        noDataMessage="No contacts registered for this patient."
        // endpoint={`patient/19324abf-b485-4184-8537-0a7fe4be1d0b/encounters`}
        disablePagination
        // onRowClick={row => onItemClick(row.id)}
        // initialSort={{ orderBy: 'startDate', order: 'desc' }}
        // refreshCount={refreshCount}
        allowExport={false}
        onDataFetched={onDataFetched}
      />
    </>
  );
};

export const ReminderContactList = ({ patient, onClose, onAddContact }) => {
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  return (
    <>
      <ContactDetails name={`${patient?.firstName} ${patient?.lastName}`} />

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
      <ModalCancelRow confirmText="Close" confirmColor="primary" onConfirm={onClose} />
    </>
  );
};
