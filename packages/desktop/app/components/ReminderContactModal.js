import React, { useState } from 'react';

import styled from 'styled-components';
import AddIcon from '@material-ui/icons/Add';

import { Button } from './Button';
import { DataFetchingTable } from './Table';
import { BaseModal } from './BaseModal';
import { ModalCancelRow } from './ModalActionRow';
import { Box } from '@material-ui/core';

const StyledText = styled.p`
  margin-bottom: 33px;

  span {
    font-weight: 500;
  }
`;

const StyledButton = styled(Button)`
  padding: 11px 10px !important;
  margin-bottom: 27px;
`;

const columns = [
  { key: 'contactName', title: 'Contact', sortable: false },
  { key: 'relationshipType', title: 'Relationship', sortable: false },
  { key: 'contactMethod', title: 'Contact method', sortable: false },
  { key: '', title: '', sortable: false },
];

export const NoContactInfo = ({ name }) => {
  return (
    <StyledText>
      {`There are no contacts registered to receive reminders for `}
      <span>{name}</span>
      {`. Please select 'Add contact' to register a contact.`}
    </StyledText>
  );
};

export const ContactDetails = ({ name }) => {
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
      <Box marginBottom="28px">
        <DataFetchingTable
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
      </Box>
    </>
  );
};

export const ReminderContactModal = ({ openReminderModal, handleClose, patient = {} }) => {
  return (
    <BaseModal
      width="md"
      title="Reminder contacts"
      open={openReminderModal}
      cornerExitButton={false}
    >
      <ContactDetails name={`${patient?.firstName} ${patient?.lastName}`} />

      <StyledButton
        variant="outlined"
        color="primary"
        size="small"
        // onClick={onClickModal}
      >
        <AddIcon />
        Add Contacts
      </StyledButton>
      <ModalCancelRow confirmText="Close" confirmColor="primary" onConfirm={handleClose} />
    </BaseModal>
  );
};
