import React from 'react';
import styled from 'styled-components';
import { IPatientContact } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useReminderContact } from '~/ui/contexts/ReminderContactContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { RowView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const StyledViewWithBorder = styled(StyledView)`
  border: 1px solid ${theme.colors.BOX_OUTLINE};
  padding: 6px 18px;
  margin-top: 8px;
  border-radius: 5px;
  color: ${theme.colors.MAIN_SUPER_DARK};
`;

export const ContactCard = (contact: IPatientContact) => {
  const { name, relationship, method, connectionDetails } = contact;
  const { isFailedContact } = useReminderContact();

  const getColor = () => {
    if (connectionDetails) return theme.colors.TEXT_SUPER_DARK;
    return isFailedContact(contact) ? theme.colors.ALERT : theme.colors.TEXT_SOFT;
  };

  return (
    <StyledViewWithBorder>
      <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
          fontWeight={500}
        >
          <TranslatedText
            stringId="patient.details.reminderContacts.field.contact"
            fallback="Contact"
          />
        </StyledText>
        <StyledText color={getColor()} fontSize={screenPercentageToDP(2, Orientation.Height)}>
          {name}
        </StyledText>
      </RowView>
      <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
          fontWeight={500}
        >
          <TranslatedText
            stringId="patient.details.reminderContacts.field.relationship"
            fallback="Relationship"
          />
        </StyledText>
        <StyledText color={getColor()} fontSize={screenPercentageToDP(2, Orientation.Height)}>
          {relationship?.name}
        </StyledText>
      </RowView>
      <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
          fontWeight={500}
        >
          <TranslatedText
            stringId="patient.details.reminderContacts.field.contactMethod"
            fallback="Contact method"
          />
        </StyledText>
        <StyledText color={getColor()} fontSize={screenPercentageToDP(2, Orientation.Height)}>
          {connectionDetails ? (
            <TranslatedText
              stringId={`patient.details.reminderContacts.method.${method}`}
              fallback={method}
            />
          ) : isFailedContact(contact) ? (
            <TranslatedText
              stringId="patient.details.reminderContacts.status.failed"
              fallback="Failed"
            />
          ) : (
            <TranslatedText
              stringId="patient.details.reminderContacts.status.pending"
              fallback=":method pending"
              replacements={{ method }}
            />
          )}
        </StyledText>
      </RowView>
    </StyledViewWithBorder>
  );
};
