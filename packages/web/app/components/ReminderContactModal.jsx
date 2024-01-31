import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import { PlusIcon } from '../assets/icons/PlusIcon';
import { Colors } from '../constants';
import { AddReminderContactModal } from './AddReminderContactModal';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { ModalCancelRow } from './ModalActionRow';
import { DataFetchingTable } from './Table';
import { useAuth } from '../contexts/Auth';
import { RemoveReminderContactModal } from './RemoveReminderContactModal';

const StyledText = styled.p`
  margin-bottom: 33px;

  span {
    font-weight: 500;
  }
`;

const StyledButton = styled(Button)`
  padding: 11px 15px !important;
  height: 33px;
  border-radius: 3px;
  border: 1px solid ${Colors.primary};
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  margin-bottom: 17px;

  svg {
    margin-right: 5px !important;
  }
`;

const ContactInformationContainer = styled(DataFetchingTable)`
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
      {/* Show Remove button only if user have "write" -> "Patient" permission */}
      <ContactInformationContainer
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

export const ReminderContactModal = ({ openReminderModal, patient = {}, handleOpenCloseRemindersModal }) => {
  const [openAddReminderContactModal, setOpenAddReminderContactModal] = useState(false);
  const [openRemoveReminderContactModal, setOpenRemoveReminderContactModal] = useState(false);
  const { ability } = useAuth();
  const canAddReminderContacts = ability.can('write', 'Patient');

  const handleAddReminderContactModal = useCallback(() => {
    handleOpenCloseRemindersModal(false);
    setOpenAddReminderContactModal(true);
  }, []);

  const handleCloseAddRemindersModal = useCallback(() => {
    setOpenAddReminderContactModal(false);
  }, []);

  const handleCloseRemoveReminder = useCallback(() => {
    setOpenRemoveReminderContactModal(false);
  }, []);

  const handleBackAddReminderModal = useCallback(() => {
    handleOpenCloseRemindersModal(true);
    setOpenAddReminderContactModal(false);
  }, []);

  const handleBackRemoveReminderModal = useCallback(() => {
    handleOpenCloseRemindersModal(true);
    setOpenRemoveReminderContactModal(false);
  }, []);

  return (
    <>
      <BaseModal
        width="md"
        title="Reminder contacts"
        open={openReminderModal}
        onClose={() => handleOpenCloseRemindersModal(false)}
      >
        <ContactDetails name={`${patient?.firstName} ${patient?.lastName}`} />

        {canAddReminderContacts &&
          (<StyledButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleAddReminderContactModal}
          >
            <PlusIcon fill={Colors.primary} />
            Add contact
          </StyledButton>)}
        <ModalCancelRow confirmText="Close" confirmColor="primary" onConfirm={() => handleOpenCloseRemindersModal(false)} />

      </BaseModal>
      <AddReminderContactModal
        openAddReminderContactModal={openAddReminderContactModal}
        handleCloseAddReminder={handleCloseAddRemindersModal}
        patient={patient}
        handleBackAddReminder={handleBackAddReminderModal}
      />
      <RemoveReminderContactModal
        openRemoveReminderContactModal={openRemoveReminderContactModal}
        handleCloseRemoveReminder={handleCloseRemoveReminder}
        handleBackRemoveReminder={handleBackRemoveReminderModal}
      />
    </>
  );
};
