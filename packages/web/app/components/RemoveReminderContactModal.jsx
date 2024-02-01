import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { BaseModal } from './BaseModal';
import { ModalBackCancelConfirmRow } from './ModalActionRow';
import { Table } from './Table';

const StyledText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }

  &.headerText {
    margin: 6px 0 9px 0;
    font-weight: 500;
  }

  &.bottomText {
    margin-bottom: 31px;
    font-weight: 500;
  }
`;

const ContactInformationContainer = styled(Table)`
  margin: 22px 0 42px;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  box-shadow: none;

  table {
    padding-left: 23px;
    padding-right: 20px;

    thead tr th {
      background-color: ${Colors.white} !important;
      border-bottom: 1px solid ${Colors.outline};
      padding: 13px 0 12px 2px;
      font-size: 14px;
      font-style: normal;
      line-height: 18px;
      font-weight: 500;

      &:first-child {
        padding-left: 0;
      }

      &:last-child {
        padding-right: 0;
      }
    }

    tbody tr td {
      &:first-child {
        padding-left: 0;
      }

      &:last-child {
        padding-right: 0;
      }
    }
  }
`;

const columns = [
  {
    key: 'contactName',
    title: 'Contact',
    sortable: false,
    accessor: ({ contactName }) => contactName,
  },
  {
    key: 'relationshipType',
    title: 'Relationship',
    sortable: false,
    accessor: ({ relationshipType }) => relationshipType,
  },
  {
    key: 'contactMethod',
    title: 'Contact method',
    sortable: false,
    accessor: ({ contactMethod }) => contactMethod,
  },
];

export const ContactDetails = () => {
  const dummyDataRow = [
    {
      contactName: 'Jessie Ugyen',
      relationshipType: 'Grandmother',
      contactMethod: 'Telegram',
    },
  ];
  return (
    <>
      <ContactInformationContainer columns={columns} allowExport={false} data={dummyDataRow} />
    </>
  );
};

export const RemoveReminderContactModal = ({
  openRemoveReminderContactModal,
  handleCloseRemoveReminder,
  handleBackRemoveReminder,
}) => {
  const handleRemoveContact = () => {
    handleBackRemoveReminder();
  };

  return (
    <>
      <BaseModal
        width="sm"
        title="Remove reminder contact"
        open={openRemoveReminderContactModal}
        onClose={handleCloseRemoveReminder}
      >
        <StyledText className="headerText">Would you like to remove the below contact?</StyledText>
        <StyledText>You can add the contact again at any time.</StyledText>

        <ContactDetails />

        <ModalBackCancelConfirmRow
          onBack={handleBackRemoveReminder}
          confirmText="Remove"
          confirmColor="primary"
          onConfirm={handleRemoveContact}
          onCancel={handleCloseRemoveReminder}
        />
      </BaseModal>
    </>
  );
};
