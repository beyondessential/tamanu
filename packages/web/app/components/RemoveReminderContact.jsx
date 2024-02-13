import React from 'react';
import styled from 'styled-components';

import { Box, Divider, Typography } from '@material-ui/core';

import { Colors } from '../constants';
import { FormConfirmCancelBackRow } from './ButtonRow';
import { Table } from './Table';

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
      }
    }

    tbody tr td {
      border-bottom: none;
      padding: 10px 0 25px 2px !important;
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
  const contactDetail = [
    {
      contactName: 'Jessie Ugyen',
      relationshipType: 'Grandmother',
      contactMethod: 'Telegram',
    },
  ];

  return <ContactDetailTable columns={columns} allowExport={false} data={contactDetail} />;
};

export const RemoveReminderContact = ({ onBack, onClose }) => {
  return (
    <>
      <StyledHeading>Would you like to remove the below contact?</StyledHeading>
      <StyledSubHeading>You can add the contact again at any time.</StyledSubHeading>

      <ContactDetails />

      <StyledFullWidthContainer>
        <StyledDivider />
      </StyledFullWidthContainer>
      <FormConfirmCancelBackRow
        onBack={onBack}
        onConfirm={onBack}
        onCancel={onClose}
        confirmText="Remove"
      />
    </>
  );
};
