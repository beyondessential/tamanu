import React from 'react';
import styled from 'styled-components';

import { Box, Divider, Typography } from '@material-ui/core';

import { Colors } from '../constants';
import { FormConfirmCancelBackRow } from './ButtonRow';
import { Table } from './Table';
import { TranslatedText } from './Translation/TranslatedText';
import { useApi } from '../api';
import { useTranslation } from '../contexts/Translation';
import { capitalize } from 'lodash';

const StyledHeading = styled(Typography)`
  margin: 6px 0 9px 0;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
`;

const StyledSubHeading = styled(Typography)`
  margin: 0;
  font-size: 14px;
  line-height: 18px;
`;

const ContactDetailTable = styled(Table)`
  border: 1px solid ${Colors.outline};
  box-shadow: none;
  margin: 22px 0 42px;
  border-radius: 5px;
  background: ${Colors.white};

  table {
    padding-left: 23px;
    padding-right: 20px;

    thead tr {
      border-bottom: 1px solid ${Colors.outline};

      th {
        font-style: normal;
        background-color: ${Colors.white} !important;
        padding: 13px 0 12px !important;
        font-size: 14px;
        line-height: 18px;
        font-weight: 500;
        width: 30%;
      }
    }

    tbody tr td {
      border-bottom: none;
      padding: 10px 0 16px 2px !important;
    }
  }
`;

const StyledFullWidthContainer = styled(Box)`
  margin: 0 -32px 21px;
  grid-column: 1 / -1;
`;

const StyledDivider = styled(Divider)`
  border-top: 1px solid ${Colors.outline};
`;

export const ContactDetails = ({ selectedContact }) => {
  const { getTranslation } = useTranslation();

  const columns = [
    {
      key: 'name',
      title: getTranslation('patient.details.reminderContacts.field.contact', 'Contact'),
      sortable: false,
    },
    {
      key: 'relationship.name',
      title: getTranslation('patient.details.reminderContacts.field.relationship', 'Relationship'),
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
  ];

  return <ContactDetailTable columns={columns} allowExport={false} data={[selectedContact]} />;
};

export const RemoveReminderContact = ({ selectedContact, onBack, onClose }) => {
  const api = useApi();

  const handleDeleteContact = async () => {
    await api.delete(`patient/reminderContact/${selectedContact.id}`);
    onBack();
  };

  return (
    <>
      <StyledHeading>
        <TranslatedText
          stringId="patient.details.removeReminderContact.confirmation"
          fallback="Would you like to remove the below contact?"
        />
      </StyledHeading>
      <StyledSubHeading>
        <TranslatedText
          stringId="patient.details.removeReminderContact.description"
          fallback="You can add the contact again at any time."
        />
      </StyledSubHeading>

      <ContactDetails selectedContact={selectedContact} />

      <StyledFullWidthContainer>
        <StyledDivider />
      </StyledFullWidthContainer>
      <FormConfirmCancelBackRow
        onBack={onBack}
        onConfirm={handleDeleteContact}
        onCancel={onClose}
        confirmText={<TranslatedText stringId="general.action.remove" fallback="Remove" />}
      />
    </>
  );
};
