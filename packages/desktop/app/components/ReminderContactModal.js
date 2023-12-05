import React, { useState } from 'react';

import styled from 'styled-components';
import AddIcon from '@material-ui/icons/Add';

import { Button } from './Button';
import { DataFetchingTable } from './Table';
import { BaseModal } from './BaseModal';
import { ModalCancelRow } from './ModalActionRow';

const StyledText = styled.p`
  margin-bottom: 33px;

  span {
    font-weight: 500;
  }
`;

const StyledTable = styled.div`
  margin-bottom: 28px;
`;

const StyledButton = styled.div`
  margin-bottom: 27px;
`;

export const NoContactInfo = ({ name }) => {
  return (
    <StyledText>
      There are no contacts registered to receive reminders for <span>{name}</span>. Please select
      'Add contact' to register a contact.
    </StyledText>
  );
};

export const ContactDetails = ({ name, setContactsCount, setIsLoading }) => {
  // Table Constants
  const columns = [
    { key: 'ContactName', title: 'Contact', sortable: false },
    { key: 'RelationshipType', title: 'Relationship', sortable: false },
    { key: 'ContactMethod', title: 'Contact method', sortable: false },
    { key: '', title: '', sortable: false },
  ];

  // Helper Methods
  const onDataFetched = ({ count }) => {
    setIsLoading(false);
    setContactsCount(count);
  };

  return (
    <>
      <StyledText>
        The below contact list is registered to receive reminders for <span>{name}</span>.
      </StyledText>
      <StyledTable>
        <DataFetchingTable
          columns={columns}
          noDataMessage="No historical records for this patient."
          //   endpoint={`patient/19324abf-b485-4184-8537-0a7fe4be1d0b/encounters`}
          disablePagination={true}
          // onRowClick={row => onItemClick(row.id)}
          // initialSort={{ orderBy: 'startDate', order: 'desc' }}
          // refreshCount={refreshCount}
          allowExport={false}
          onDataFetched={onDataFetched}
        />
      </StyledTable>
    </>
  );
};

const ReminderContactModal = ({ openModal, setOpenModal, values = {} }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);

  const onCancel = () => {
    setOpenModal(false);
  };

  return (
    <BaseModal width="md" title="Reminder contacts" open={openModal} cornerExitButton={false}>
      {contactsCount > 0 || isLoading ? (
        <ContactDetails
          name={`${values?.firstName} ${values?.lastName}`}
          setContactsCount={setContactsCount}
          setIsLoading={setIsLoading}
        />
      ) : (
        <NoContactInfo name={`${values?.firstName} ${values?.lastName}`} />
      )}

      <StyledButton>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          style={{ padding: '11px 15px' }}
          //   onClick={onClickModal}
        >
          <AddIcon />
          Add Contacts
        </Button>
      </StyledButton>
      <ModalCancelRow cancelText="Close" cancelColor="primary" onCancel={onCancel} />
    </BaseModal>
  );
};

export default ReminderContactModal;
