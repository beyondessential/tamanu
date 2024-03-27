import { capitalize } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { IPatientContact } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { RowView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const StyledViewWithBorder = styled(StyledView)`
  border: 1px solid ${theme.colors.BOX_OUTLINE};
  padding: 6px 18px;
  margin-top: 10px;
  border-radius: 5px;
  color: ${theme.colors.MAIN_SUPER_DARK};
`;

export const ContactCard = ({ name, relationship, method, connectionDetails }: IPatientContact) => (
  <StyledViewWithBorder>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        <TranslatedText
          stringId="patient.details.reminderContacts.field.contact"
          fallback="Contact"
        />
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {name}
      </StyledText>
    </RowView>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        <TranslatedText
          stringId="patient.details.reminderContacts.field.relationShip"
          fallback="Relationship"
        />
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {relationship?.name}
      </StyledText>
    </RowView>
    <RowView justifyContent="space-between" paddingTop={10} paddingBottom={10}>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        fontWeight={600}
      >
        <TranslatedText
          stringId="patient.details.reminderContacts.field.contactMethod"
          fallback="Contact Method"
        />
      </StyledText>
      <StyledText
        color={theme.colors.MAIN_SUPER_DARK}
        fontSize={screenPercentageToDP(2, Orientation.Height)}
      >
        {connectionDetails ? (
          <TranslatedText
            stringId={`patient.details.reminderContacts.method.${method}`}
            fallback={capitalize(method)}
          />
        ) : (
          <TranslatedText
            stringId={`patient.details.reminderContacts.method.${method}Pending`}
            fallback={`${capitalize(method)} pending`}
          />
        )}
      </StyledText>
    </RowView>
  </StyledViewWithBorder>
);
