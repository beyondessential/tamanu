import { Typography } from '@material-ui/core';
import { route } from '@tamanu/api-client';
import React, { useState } from 'react';
import styled from 'styled-components';

import { TextButton, TranslatedText, VisuallyHidden, useTranslation } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { useAuth } from '../../contexts/Auth';
import { usePatient } from '../../contexts/Patient';
import { joinNames } from '../../utils/user';
import { escapeHtml } from '../../utils/escapeHtml';
import { DataFetchingTable, Table } from '../Table';

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

  &,
  &:hover {
    font-weight: 400;
  }
`;

const StyledContactListTable = props => {
  const Component = styled(DataFetchingTable)`
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
  return <Component {...props} data-testid="component-pg7n" />;
};

const ContactDetailTable = props => {
  const Component = styled(Table)`
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
        padding: 10px 0 16px 1px !important;
      }
    }
  `;

  return <Component {...props} data-testid="component-71a1" />;
};

export const ContactDetails = ({ onRemoveContact, selectedContact, isRemoveModal = false }) => {
  const { getTranslation } = useTranslation();
  const { patient } = usePatient();
  const patientName = joinNames(patient ?? {});
  const [isEmpty, setIsEmpty] = useState(false);

  const { ability } = useAuth();
  const canRemoveReminderContacts = ability.can('write', 'Patient');

  if (!patient) return null;

  const onDataFetched = ({ count }) => {
    setIsEmpty(!count);
  };

  const columns = [
    {
      key: 'name',
      title: (
        <TranslatedText
          stringId="patient.details.reminderContacts.field.contact"
          fallback="Contact"
          data-testid="translatedtext-e3ae"
        />
      ),
      sortable: false,
    },
    {
      key: 'relationship.name',
      title: (
        <TranslatedText
          stringId="patient.details.reminderContacts.field.relationship"
          fallback="Relationship"
          data-testid="translatedtext-w0tz"
        />
      ),
      sortable: false,
      accessor: ({ relationship }) => relationship.name,
    },
    {
      key: 'method',
      title: (
        <TranslatedText
          stringId="patient.details.reminderContacts.field.contactMethod"
          fallback="Contact method"
          data-testid="translatedtext-yndp"
        />
      ),
      sortable: false,
      accessor: ({ method }) => (
        <TranslatedText
          stringId={`patient.details.reminderContacts.method.${method}`}
          fallback={method}
          data-testid="translatedtext-0k1c"
        />
      ),
    },
    ...(canRemoveReminderContacts && !isRemoveModal
      ? [
          {
            key: 'remove',
            title: (
              <VisuallyHidden>
                <TranslatedText
                  stringId="patient.details.reminderContacts.action.remove"
                  fallback="Remove"
                />
              </VisuallyHidden>
            ),
            sortable: false,
            accessor: data => {
              return (
                <StyledTextButton
                  onClick={() => onRemoveContact(data)}
                  data-testid="styledtextbutton-6f20"
                >
                  <TranslatedText
                    stringId="patient.details.reminderContacts.action.remove"
                    fallback="Remove"
                  />
                </StyledTextButton>
              );
            },
          },
        ]
      : []),
  ];

  if (isRemoveModal) {
    return (
      <ContactDetailTable
        columns={columns}
        allowExport={false}
        data={[selectedContact]}
        data-testid="contactdetailtable-p940"
      />
    );
  }

  return (
    <>
      {isEmpty ? (
        <StyledText
          dangerouslySetInnerHTML={{
            __html: getTranslation(
              'patient.details.reminderContacts.noContacts',
              'There are no contacts registered to receive reminders for :patientName.',
              { replacements: { patientName: `<span>${escapeHtml(patientName)}</span>` } },
            ),
          }}
          data-testid="styledtext-r6fj"
        />
      ) : (
        <StyledText
          dangerouslySetInnerHTML={{
            __html: getTranslation(
              'patient.details.reminderContacts.description',
              'The below contact list is registered to receive reminders for :patientName.',
              { replacements: { patientName: `<span>${escapeHtml(patientName)}</span>` } },
            ),
          }}
          data-testid="styledtext-rxy4"
        />
      )}
      <StyledContactListTable
        columns={columns}
        endpoint={route('patient/:patientId/reminderContacts', { patientId: patient.id })}
        disablePagination
        initialSort={{ orderBy: 'name', order: 'asc' }}
        allowExport={false}
        onDataFetched={onDataFetched}
        isEmpty={isEmpty}
        data-testid="styledcontactlisttable-hj3q"
      />
    </>
  );
};
