import React from 'react';
import styled from 'styled-components';
import { type IPatientContact, ReferenceDataType } from '~/types';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
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

export const ContactCard = ({ name, relationship, method }: IPatientContact) => {
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
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
        >
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
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
        >
          <TranslatedReferenceData
            category={ReferenceDataType.ContactRelationship}
            fallback={relationship?.name}
            value={relationship?.id}
          />
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
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(2, Orientation.Height)}
        >
          <TranslatedText
            stringId={`patient.details.reminderContacts.method.${method}`}
            fallback={method}
          />
        </StyledText>
      </RowView>
    </StyledViewWithBorder>
  );
};
